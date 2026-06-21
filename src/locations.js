"use strict";

import { enemy_templates, Enemy } from "./enemies.js";
import { dialogues as dialoguesList} from "./dialogues.js";
import { skills } from "./skills.js";
import { current_game_time } from "./game_time.js";
import { activities } from "./activities.js";
import { inf_combat } from "./main.js";

import { book_stats, item_templates, Weapon, Armor, Shield } from "./items.js";
import { get_total_skill_level,add_to_character_inventory, remove_from_character_inventory } from "./character.js";
import { character } from "./character.js";
import { log_message , format_number} from "./display.js";
import { enemy_killcount } from "./enemies.js";
const locations = {};
const location_types = {};
//contains all the created locations

class Location {
    constructor({
                name, 
                id,
                description, 
                connected_locations, 
                is_unlocked = true, 
                is_finished = false,
                dialogues = [], 
                traders = [],
                types = [], //{type, xp per tick}
                sleeping = null, //{text to start, xp per tick},
                light_level = "normal",
                getDescription,
                background_noises = [],
                getBackgroundNoises,
                crafting = null,
                tags = {},
                bgm = "",
            }) {
        // always a safe zone
        this.bgm = bgm;
        this.name = name; //needs to be the same as key in locations
        this.id = id || name;
        this.description = description;
        this.getDescription = getDescription || function(){return description;}
        this.background_noises = background_noises;
        this.getBackgroundNoises = getBackgroundNoises || function(){return background_noises;}
        this.connected_locations = connected_locations; //a list
        this.is_unlocked = is_unlocked;
        this.is_finished = is_finished; //for when it's in any way or form "completed" and player shouldn't be allowed back
        this.dialogues = dialogues;
        this.traders = traders;
        this.activities = {};
        this.types = types;
        this.sleeping = sleeping;
        for (let i = 0; i < this.dialogues.length; i++) {
            if (!dialoguesList[this.dialogues[i]]) {
                throw new Error(`No such dialogue as "${this.dialogues[i]}"!`);
            }
        }
        this.light_level = light_level; //not really used for this type
        this.crafting = crafting;
        this.tags = tags;
        this.tags["Safe zone"] = true;
        /* 
        crafting: {
            is_unlocked: Boolean, 
            use_text: String, 
            tiers: {
                crafting: Number,
                forging: Number,
                smelting: Number,
                cooking: Number,
                alchemy: Number,
            }
        },
         */
    }
}

class Combat_zone {
    constructor({name, 
                id,
                 description, 
                 getDescription,
                 rank = 0,
                 is_unlocked = true, 
                 is_finished = false,
                 types = [], //{type, xp_gain}
                 enemy_groups_list = [],
                 enemies_list = [], 
                 enemy_group_size = [1,1],
                 enemy_count = 30,
                 enemy_stat_variation = 0,
                 enemy_stat_halo = 0,
                 parent_location, 
                 leave_text,
                 first_reward = {},
                 repeatable_reward = {},
                 otherUnlocks,
                 unlock_text,
                 spec_hint,
                 is_challenge = false,
                 tags = {},
                 bgm = "",
                }) {

        this.name = name;
        this.bgm = bgm,
        this.id = id || name;
        this.unlock_text = unlock_text;
        this.spec_hint = spec_hint;
        this.description = description;
        this.getDescription = getDescription || function(){return description;}
        this.otherUnlocks = otherUnlocks || function() {return;}
        this.is_unlocked = is_unlocked;
        this.is_finished = is_finished;
        this.rank = rank;
        this.types = types; //special properties of the location, e.g. "narrow" or "dark"
        this.enemy_groups_list = enemy_groups_list; //predefined enemy teams, names only
        this.enemies_list = enemies_list; //possible enemies (to be used if there's no enemy_groups_list), names only
        this.enemy_group_size = enemy_group_size; // [min, max], used only if enemy_groups_list is not provided
        if(!this.enemy_groups_list){
            if(this.enemy_group_size[0] < 1) {
                this.enemy_group_size[0] = 1;
                console.error(`Minimum enemy group size in zone "${this.name}" is set to unallowed value of ${this.enemy_group_size[0]} and was corrected to lowest value possible of 1`);
            }
            if(this.enemy_group_size[0] > 8) {
                this.enemy_group_size[0] = 8;
                console.error(`Minimum enemy group size in zone "${this.name}" is set to unallowed value of ${this.enemy_group_size[0]} and was corrected to highest value possible of 8`);
            }
            if(this.enemy_group_size[1] < 1) {
                this.enemy_group_size[1] = 1;
                console.error(`Maximum enemy group size in zone "${this.name}" is set to unallowed value of ${this.enemy_group_size[1]} and was corrected to lowest value possible of 1`);
            }
            if(this.enemy_group_size[1] > 8) {
                this.enemy_group_size[1] = 8;
                console.error(`Maximum enemy group size in zone "${this.name}" is set to unallowed value of ${this.enemy_group_size[1]} and was corrected to highest value possible of 8`);
            }
        }
        this.enemy_count = enemy_count; //how many enemy groups need to be killed for the clearing reward

        if(this.enemy_groups_list.length == 0 && this.enemies_list.length == 0 ) {
            throw new Error(`No enemies provided for zone "${this.name}"`);
        }

        this.enemy_groups_killed = 0; //killcount for clearing

        this.enemy_stat_variation = enemy_stat_variation; // e.g. 0.1 means each stat can go 10% up/down from base value; random for each enemy in group
        if(this.enemy_stat_variation < 0) {
            this.enemy_stat_variation = 0;
            console.error(`Stat variation for enemies in zone "${this.name}" is set to unallowed value and was corrected to a default 0`);
        }

        this.enemy_stat_halo = enemy_stat_halo;//improving

        this.parent_location = parent_location;
        if(!this.parent_location) {
            throw new Error(`Couldn't add parent location "${this.parent_location.name}" to zone "${this.name}"`)
        }

        this.leave_text = leave_text; //text on option to leave
        this.first_reward = first_reward; //reward for first clear
        this.repeatable_reward = repeatable_reward; //reward for each clear, including first; all unlocks should be in this, just in case

        this.is_challenge = is_challenge;
        //challenges can be completed only once 

        //skills and their xp gain on every tick, based on location types;
        this.gained_skills = this.types
            ?.map(type => {return {skill: skills[location_types[type.type].stages[type.stage || 1].related_skill], xp: type.xp_gain}})
            .filter(skill => skill.skill);
       
        const temp_types = this.types.map(type => type.type);
        if(temp_types.includes("bright")) {
            this.light_level = "bright";
        }
        else if(temp_types.includes("dark")) {
            this.light_level = "dark";
        } else {
            this.light_level = "normal";
        }

        this.tags = tags;
        this.tags["Combat zone"] = true;
    }
    get_enemy(f_halo,f_enemy){
        
            let newEnemy;
                newEnemy = new Enemy({name: f_enemy.name,
                    id: f_enemy.id,
                    description: f_enemy.description,
                    xp_value: f_enemy.xp_value * Math.pow(f_halo,1.5),
                    spec: f_enemy.spec,
                    spec_value:f_enemy.spec_value,
                    realm: f_enemy.realm,
                    rank:f_enemy.rank,
                    stats: {
                        health: f_enemy.stats.health * f_halo,
                        attack: f_enemy.stats.attack * f_halo,
                        agility: f_enemy.stats.agility * f_halo,
                        dexterity: f_enemy.stats.dexterity,
                        intuition: f_enemy.stats.intuition,
                        attack_speed: f_enemy.stats.attack_speed,
                        defense: f_enemy.stats.defense * f_halo
                    },
                    loot_list: f_enemy.loot_list,
                    image: f_enemy.image,
                    loot_multi: f_halo,
                    add_to_bestiary: f_enemy.add_to_bestiary,
                    size: f_enemy.size
                });
            //}
            if(newEnemy.spec.includes(19))
            {
                newEnemy.stats.attack += character.stats.full.attack_power * 0.1;
                newEnemy.stats.defense += character.stats.full.defense * 0.1;
                newEnemy.stats.agility += character.stats.full.agility * 0.1;
                log_message(`${f_enemy.name} absorbed ${format_number(character.stats.full.attack_power * 0.1)} attack, ${format_number(character.stats.full.defense * 0.1)} defense, and ${format_number(character.stats.full.agility * 0.1)} agility [Synchronize]`,"enemy_enhanced");
            }//同调
            if(newEnemy.spec.includes(53))
            {
                newEnemy.stats.attack += character.stats.full.attack_power * 2.0;
                log_message(`${f_enemy.name} absorbed ${format_number(character.stats.full.attack_power * 2.0)} attack [Synchronize: Demon]`,"enemy_enhanced"); // TODO: verify "同调·魔" translation
            }//同调
            if(newEnemy.spec.includes(24)){
                log_message(`${f_enemy.name} absorbed ${format_number(character.stats.full.attack_power * 0.5)} health [Sword Drain]`,"enemy_enhanced");
                newEnemy.stats.health += character.stats.full.attack_power * 0.5;//饮剑
            }
            if(newEnemy.spec.includes(25)){ 
                log_message(`${f_enemy.name} absorbed ${format_number(character.stats.full.defense * 0.5)} health [Shield Drain]`,"enemy_enhanced");
                newEnemy.stats.health += character.stats.full.defense * 0.5;//饮盾
            }
            if(newEnemy.spec.includes(46)){
                log_message(`${f_enemy.name} absorbed ${format_number(character.stats.full.attack_power * 2.5)} health [Sword Drain]`,"enemy_enhanced");
                newEnemy.stats.health += character.stats.full.attack_power * 2.5;//饮剑·改
            }
            if(newEnemy.spec.includes(47)){ 
                log_message(`${f_enemy.name} absorbed ${format_number(character.stats.full.defense * 2.5)} health [Shield Drain]`,"enemy_enhanced");
                newEnemy.stats.health += character.stats.full.defense * 2.5;//饮盾·改
            }
            if(newEnemy.spec.includes(30)){ 
                log_message(`${f_enemy.name} absorbed ${format_number(character.stats.full.agility * newEnemy.spec_value[30])} attack [Purify]`,"enemy_enhanced");
                newEnemy.stats.attack += character.stats.full.agility * newEnemy.spec_value[30];//净化
            }
            if(newEnemy.spec.includes(58)){
                let M58 = ((8-inf_combat.S3.b2)*3-inf_combat.S3.b3)*0.05 + 1;
                newEnemy.stats.health *= M58;
                newEnemy.stats.attack *= M58;
                log_message(`${f_enemy.name}'s ATK/HP changed to ${format_number(M58*100)}% [Berserk]`,"enemy_enhanced");
            }//Berserk
            if(newEnemy.id == "地宫养殖者[BOSS]")//special case
            {
                if(enemy_killcount["地宫养殖者[BOSS]"]) console.log("试图再次击杀");
                else{
                    if(character.equipment.special?.name == "Nanami")//姐姐在！
                    {
                        log_message(`[Dungeon Cultivator] Oh ho, someone dared to break in here?`,"hero_attacked_critically");
                        log_message(`[Nanami] I won't waste words with you. Tell me - why are you targeting my Na Family!`,"enemy_defeated");
                        log_message(`[Sayuki] 22 lines of the widely-known story about the Blood-Kill Hall and the Dungeon Cultivator are omitted here.`,"sayuki");
                        log_message(`[Nanami] In that case, the time has come... Koko!`,"enemy_defeated");
                        log_message(`Suddenly, a strange weapon appeared in the girl's hands. About a meter long, with a deep black void at its tip. Its overall texture radiates an overwhelming, suffocating presence.`,"enemy_enhanced");
                        log_message(`In almost a tenth of a second, the weapon in Nanami's hands burst forth with dazzling silver-white light. There was a thunderous boom, and the entire Dungeon seemed to tremble!`,"enemy_enhanced");
                        log_message(`Hit by the recoil, Nanami spat blood. Neko, realizing what happened, immediately embraced her sister, together bracing against the weapon's incredible recoil force.`,"enemy_enhanced");
                        log_message(`[Neko] Are you okay, sister—`,"enemy_defeated");
                        log_message(`[Nanami] Cough... it's not over yet, Koko. What comes next, I'll leave to you!`,"enemy_defeated");
                        log_message(`The Dungeon Cultivator, struck head-on by the weapon, almost instantly lost half its body and let out a venomous roar.`,"enemy_enhanced");
                        log_message(`[Dungeon Cultivator] What— impossible!! Damn it, I've been tricked. I'll kill you, kill all of you, slaughter everyone in Yangang Territory—`,"hero_attacked_critically");
                        log_message(`[Nanami] Koko, don't let your guard down! This is a Sky Rank cultivator's last burst of power. Just hold out for a moment longer!`,"enemy_enhanced");
                        log_message(`[Neko] Understood!`,"enemy_defeated");
                        //sleep(1000);
                        newEnemy.stats.attack *= 0.01;
                        newEnemy.stats.defense *= 0.01;
                        newEnemy.stats.agility *= 0.01;
                        newEnemy.stats.health *= 0.01;
                        log_message(`The Dungeon Cultivator is on its last legs! Attack, defense, agility, and health are all reduced to one percent of their former values!`,"enemy_enhanced");
                    }
                    else
                    {
                        log_message(`[Dungeon Cultivator] Oh ho, someone dared to break in here?`,"hero_attacked_critically");
                        log_message(`[???]...`,"enemy_defeated");
                        log_message(`[Sayuki] High-energy reaction! Nanami is not detected in the party!`,"sayuki");
                        log_message(`The Dungeon Cultivator is in full health! Attack, defense, agility, and health remain at their previous levels!`,"enemy_enhanced");
                    
                    }
                }
            }
            newEnemy.is_alive = true;
        return newEnemy;
    }

    get_next_enemies() {

        const enemies = [];
        let enemy_group = [];

        if(this.enemy_groups_list.length > 0) { // PREDEFINED GROUPS EXIST

            const index = Math.floor(Math.random() * this.enemy_groups_list.length);
            enemy_group = this.enemy_groups_list[index]; //names

        } else {  // PREDEFINED GROUPS DON'T EXIST

            const group_size =  + Math.floor(this.enemy_group_size[0] + Math.random() * (this.enemy_group_size[1] - this.enemy_group_size[0]));
            for(let i = 0; i < group_size; i++) {
                enemy_group.push(this.enemies_list[Math.floor(Math.random() * this.enemies_list.length)]);
            }
        }
 
        for(let i = 0; i < enemy_group.length; i++) {
            const enemy = enemy_templates[enemy_group[i]];
            if(!enemy || enemy.name == undefined){
                console.error("试图在 " + this.name + " 中生成未定义的敌人 [" + enemy_group[i] + "]");
                continue;
            }
            // if(this.enemy_stat_variation != 0) {

            //     const variation = Math.random() * this.enemy_stat_variation;
            //     const halo = this.enemy_stat_halo;
            //     const base = 1 + variation + halo;
            //     const vary = 2 * variation;
            //     newEnemy = new Enemy({
            //                             name: enemy.name, 
            //                             description: enemy.description, 
            //                             xp_value: enemy.xp_value,
            //                             spec: enemy.spec,
            //                             stats: {
            //                                 health: Math.round(enemy.stats.health * (base - Math.random() * vary)),
            //                                 attack: Math.round(enemy.stats.attack * (base - Math.random() * vary)),
            //                                 agility: Math.round(enemy.stats.agility * (base - Math.random() * vary)),
            //                                 dexterity: Math.round(enemy.stats.dexterity * (base - Math.random() * vary)),
            //                                 intuition: Math.round(enemy.stats.intuition * (base - Math.random() * vary)),
            //                                 attack_speed: Math.round(enemy.stats.attack_speed * (base - Math.random() * vary) * 100) / 100,
            //                                 defense: Math.round(enemy.stats.defense * (base - Math.random() * vary))
            //                             },
            //                             loot_list: enemy.loot_list,
            //                             image: enemy.image,
            //                             add_to_bestiary: enemy.add_to_bestiary,
            //                             size: enemy.size,
            //                         });

            // } else {
            let halo_fix = 0;
            if(enemy.id == "秘境心火精灵[BOSS]")//特判秘境心火
            {
                const key_id = item_templates["微花残片"].getInventoryKey();
                let key_cnt = character.inventory[key_id]?character.inventory[key_id].count:0;
                key_cnt = Math.min(key_cnt,5);
                if(key_cnt != 0)
                {
                    log_message(`Due to holding ${key_cnt} Micro-Petal Fragments, the halo is weakened: 140% -> ${140-key_cnt*8}%!`,"enemy_enhanced");
                    halo_fix -= 0.08*key_cnt;
                }
            }
            else if(this.name == "Barrier Lake - X"){
                const key_id = item_templates["微花残片"].getInventoryKey();
                let key_cnt = character.inventory[key_id]?character.inventory[key_id].count:0;
                key_cnt = Math.min(key_cnt,4);
                if(key_cnt != 0)
                {
                    log_message(`Due to holding ${key_cnt} Micro-Petal Fragments, the halo is weakened: 132% -> ${132-key_cnt*8}%!`,"enemy_enhanced");
                    halo_fix -= 0.08*key_cnt;
                }
            }
            else if(this.name == "Na Family Secret Realm - ∞"){
                inf_combat.A6.cur = Math.min(inf_combat.A6.cur,9999);
                halo_fix = (inf_combat.A6.cur - 6) * 0.08;
            }
            else if(this.name.includes("Hel Swamp")){
                inf_combat.B3 = inf_combat.B3 || 0;
                halo_fix = inf_combat.B3 * 0.01 - 0.01;
            }
            else if(this.name.includes("Pure White Arctic Tundra") && character.is_in_inventory_nanami("{\"id\":\"峰\"}")){
                remove_from_character_inventory([{item_key:"{\"id\":\"峰\"}"}]);
                log_message("[Feng] We finally made it. Worth every step I spent tailing her.","enemy_enhanced");
                log_message("[Feng] Well then, I suppose it's time for me to take my leave...","enemy_enhanced");
            }
            if(character.equipment.props?.id == "光环法杖"){
                if(enemy.rank >= 4000){
                    log_message("[一段光环法杖遇到云霄级敌人增幅不动的剧情]","enemy_enhanced");
                }
                else if(enemy.rank % 100 >= 50){
                    log_message("[光环法杖]BOSS级敌人无法被增幅!","enemy_enhanced");
                }
                else{
                    halo_fix += 0.25;
                    log_message(`[光环法杖]光环:${format_number(100*(this.enemy_stat_halo + halo_fix - 0.25))}% -> ${format_number(100*(this.enemy_stat_halo + halo_fix))}%`,"enemy_enhanced");
                }
            }//不是云霄级以上目标(4幕以后目标)
                
            const halo = this.enemy_stat_halo + 1 + halo_fix;

            enemies.push(this.get_enemy(halo,enemy)); 
            if(enemy.spec.includes(41)) {
                log_message(`Summoned 3x Purple-Rust Fetal`,"enemy_enhanced");
                enemies.push(this.get_enemy(halo,enemy_templates["紫锈胎人"])); 
                enemies.push(this.get_enemy(halo,enemy_templates["紫锈胎人"])); 
                enemies.push(this.get_enemy(halo,enemy_templates["紫锈胎人"])); 
            }//召唤
            if(enemy.spec.includes(44)) {
                log_message(`Summoned 3x Ship Weeder B1`,"enemy_enhanced");
                enemies.push(this.get_enemy(halo,enemy_templates["舰船除草机B1"])); 
                enemies.push(this.get_enemy(halo,enemy_templates["舰船除草机B1"])); 
                enemies.push(this.get_enemy(halo,enemy_templates["舰船除草机B1"])); 
            }//召唤
        }
        return enemies;
    }

    //calculates total penalty with and without hero skills
    //launches on every combat action
    get_total_effect() {
        const effects = {multipliers: {}};
        const hero_effects = {multipliers: {}};
        
        //iterate over types of location
        for(let i = 0; i < this.types.length; i++) {
            const type = location_types[this.types[i].type].stages[this.types[i].stage];

            if(!type.related_skill || !type.effects) { 
                continue; 
            }

            //iterate over effects each type has 
            //(ok there's really just only 3 that make sense: attack points, evasion points, strength, though maybe also attack speed? mainly the first 2 anyway)
            Object.keys(type.effects.multipliers).forEach((effect) => { 

                effects.multipliers[effect] = (effects.multipliers[effect] || 1) * type.effects.multipliers[effect];
                
                hero_effects.multipliers[effect] = (hero_effects.multipliers[effect] || 1) * get_location_type_penalty(this.types[i].type, this.types[i].stage, effect);
            })
        }

        

        return {base_penalty: effects, hero_penalty: hero_effects};
    }
}

class Challenge_zone extends Combat_zone {
    constructor({name, 
        description, 
        getDescription,
        is_unlocked = true, 
        types = [], //{type, xp_gain}
        enemy_groups_list = [],
        enemies_list = [], 
        enemy_group_size = [1,1],
        enemy_count = 30,
        parent_location, 
        leave_text,
        first_reward = {},
        repeatable_reward = {},
        otherUnlocks,
        is_finished,
        enemy_stat_halo,
        unlock_text,
        spec_hint,
       }) 
    {
        super(
            {   
                name, 
                description, 
                getDescription, 
                is_unlocked, 
                types, 
                enemy_groups_list, 
                enemies_list, 
                enemy_group_size, 
                enemy_count, 
                enemy_stat_variation: 0, 
                enemy_stat_halo,
                parent_location,
                leave_text,
                first_reward,
                repeatable_reward,
                is_challenge: true,
                otherUnlocks,
                is_finished,
                unlock_text,
                spec_hint,
            }
        )
    }
}

class LocationActivity{
    constructor({activity_name, 
                 starting_text, 
                 get_payment = ()=>{return 1},
                 is_unlocked = true, 
                 working_period = 60,
                 infinite = false,
                 availability_time,
                 spec = "",
                 skill_xp_per_tick = 1,
                 unlock_text,
                 gained_resources,
                 require_tool = true,
                 exp_scaling = false,
                 scaling_id = "",
                 done_actions = 0,
                 exp_o = 1.6,
                 }) 
    {
        this.activity_name = activity_name; //name of activity from activities.js
        this.starting_text = starting_text; //text displayed on button to start action

        this.get_payment = get_payment;
        this.is_unlocked = is_unlocked;
        this.spec = spec;
        this.unlock_text = unlock_text;
        this.exp_scaling = exp_scaling;
        this.scaling_id = scaling_id;
        this.done_actions = done_actions;
        this.exp_o = exp_o;
        this.working_period = working_period; //if exists -> time that needs to be worked to earn anything; only for jobs
        this.infinite = infinite; //if true -> can be done 24/7, otherwise requires availability time
        if(this.infinite && availability_time) {
            console.error("Activity is set to be available all the time, so availability_time value will be ignored!");
        }
        if(!this.infinite && !availability_time) {
            throw new Error("LocationActivities that are not infinitely available, require a specified time of availability!");
        }
        this.availability_time = availability_time; //if not infinite -> hours between which it's available
        
        this.skill_xp_per_tick = skill_xp_per_tick; //skill xp gained per game tick (default -> 1 in-game minute)

        this.require_tool = require_tool; //if false, can be started without tool equipped

        this.gained_resources = gained_resources; 
        //{scales_with_skill: boolean, resource: [{name, ammount: [[min,max], [min,max]], chance: [min,max]}], time_period: [min,max], skill_required: [min_efficiency, max_efficiency]}
        //every 2-value array is oriented [starting_value, value_with_required_skill_level], except for subarrays of ammount (which are for randomizing gained item count) and for skill_required
        //                                                                                   (ammount array itself follows the mentioned orientation)
        //value start scaling after reaching min_efficiency skill lvl, before that they are just all at min
        //skill required refers to level of every skill
        //if scales_with_skill is false, scalings will be ignored and first value will be used
        }

    getActivityEfficiency = function() {
        let skill_modifier = 1;
        if(this.gained_resources.scales_with_skill){
            let skill_level_sum = 0;
            for(let i = 0; i < activities[this.activity_name].base_skills_names?.length; i++) {
                let S_max = this.gained_resources.skill_required[1];
                let S_min = this.gained_resources.skill_required[0];
                let S_id = activities[this.activity_name].base_skills_names[i];
                skill_level_sum += Math.min(
                    S_max-S_min, Math.max(0,get_total_skill_level(S_id)-S_min)
                )/(S_max-S_min);
                
            }
            skill_modifier = (skill_level_sum/activities[this.activity_name].base_skills_names?.length) ?? 1;
        }let fixed_timemul = 1.0;
        if(this.exp_scaling)
        {
            fixed_timemul = Math.pow(this.exp_o,this.done_actions);
        }
        const gathering_time_needed = Math.floor(fixed_timemul * this.gained_resources.time_period[0]*(this.gained_resources.time_period[1]/this.gained_resources.time_period[0])**skill_modifier);
        
        const gained_resources = [];

        for(let i = 0; i < this.gained_resources.resources.length; i++) {

            const chance = this.gained_resources.resources[i].chance[0]*(this.gained_resources.resources[i].chance[1]/this.gained_resources.resources[i].chance[0])**skill_modifier;
            const min = Math.round(this.gained_resources.resources[i].ammount[0][0]*(this.gained_resources.resources[i].ammount[1][0]/this.gained_resources.resources[i].ammount[0][0])**skill_modifier);
            const max = Math.round(this.gained_resources.resources[i].ammount[0][1]*(this.gained_resources.resources[i].ammount[1][1]/this.gained_resources.resources[i].ammount[0][1])**skill_modifier);
            gained_resources.push({name: this.gained_resources.resources[i].name, count: [min,max], chance: chance});
        }

        return {gathering_time_needed, gained_resources};
    }
}

class LocationAction {
    constructor({
        action_text,
        success_text,
        failure_text,
        requirements = {},
        rewards = {},
        attempt_duration = 0,
        attempt_text = "",
        success_chance = 1,
        is_unlocked = true,
    }) {
        this.action_text = action_text;
        this.failure_text = failure_text; //text displayed on failure
        this.success_text = success_text; //text displayed on success
                                          //if action is supposed to be "impossible" for narrative purposes, just make it finish without unlocks and with text that says it failed
        this.requirements = requirements; //things needed to succeed {stats, items, money} 
        this.rewards = rewards; //mostly unlocks: {} but could be some other things
        this.completed = false;
        this.attempt_duration = attempt_duration; //0 means instantaneous, otherwise there's a progress bar
        this.attempt_text = attempt_text; //action text while attempting, useless if duration is 0
        this.success_chance = success_chance; //chance to succeed; to guarantee that multiple attempts will be needed, just make a few consecutive actions with same text
        this.is_unlocked = is_unlocked;
        this.is_finished = false;
    }

    /**
     * @returns {Boolean}
     */
    are_conditions_met() {

    }
}

class LocationType{
    constructor({name, related_skill, stages = {}}) {
        this.name = name;

        if(related_skill) {
            if(!skills[related_skill]) {
                throw new Error(`No such skill as "${related_skill}"`);
            }
            else { 
                this.related_skill = related_skill; //one per each; skill xp defined in location/combat_zone
            }
        }
        this.stages = stages; //up to 3
        /* 
        >number<: {
            description,
            related_skill,
            effects
        }

        */
    }
}

function get_location_type_penalty(type, stage, stat) {
    
    const skill = skills[location_types[type].stages[stage].related_skill];

    const base = location_types[type].stages[stage].effects.multipliers[stat];

    return base**(1- skill.current_level/skill.max_level);
}

//create location types
(function(){
    
    location_types["bright"] = new LocationType({
        name: "bright",
        stages: {
            1: {
                description: "A place that's always lit, no matter the time of the day",
            },
            2: {
                description: "An extremely bright place, excessive light makes it hard to keep eyes open",
                related_skill: "Dazzle resistance",
                effects: {
                    multipliers: {
                    }
                }
            },
            3: {
                description: "A place with so much light that an average person would go blind in an instant",
                related_skill: "Dazzle resistance",
                effects: {
                    multipliers: {
                    }
                }
            }
        }
    });
    location_types["dark"] = new LocationType({
        name: "dark",
        stages: {
            1: {
                description: "A place that's always as dim as a clear night",
                related_skill: "Night vision",
                //no effects here, since in this case they are provided via the overall "night" penalty
            },
            2: {
                description: "A very dark place, darker than most nights",
                related_skill: "Night vision",
                effects: {
                    multipliers: {
                        agility: 0.5,
                        attack_speed : 0.8
                        //they dont need to be drastic since they apply on top of 'night' penalty
                    }
                }
            },
            3: {
                description: "Pure darkness, not even a glimmer of light",
                related_skill: "Presence sensing",
                effects: {
                    multipliers: {
                        agility: 0.1,
                        attack_speed : 0.5
                    }
                }
            }
        }
    });
    
    location_types["stress"] = new LocationType({
        name: "stress",
        stages: {
            1: {
                description: "A faint oppressive aura permeates the area, slightly affecting the power and speed of attacks",
                related_skill: "Resistance",
                effects: {
                    multipliers: {
                        attack_speed: 0.9,
                        attack_mul : 0.8
                    }
                }
            },
            2: {
                description: "A thick oppressive aura permeates the area, significantly affecting the power and speed of attacks",
                related_skill: "Resistance",
                effects: {
                    multipliers: {
                        attack_speed: 0.5,
                        attack_mul : 0.25,
                    }
                }
            },
        }
    });
    location_types["narrow"] = new LocationType({
        name: "narrow",
        stages: {
            1: {
                description: "A very narrow and tight area where there's not much place for maneuvering",
                related_skill: "Tight maneuvers",
                effects: {
                    multipliers: {
                                }
                        }
                }
            }
    });
    location_types["open"] = new LocationType({
        name: "open",
        stages: {
            1: {
                description: "A completely open area where attacks can come from any direction",
                related_skill: "Spatial awareness",
                effects: {
                    multipliers: {
                    }
                }
            },
            2: {
                description: "An area that's completely open and simultanously obstructs your view, making it hard to predict where an attack will come from",
                related_skill: "Spatial awareness",
                effects: {
                    multipliers: {
                    }
                }
            }
        }
    });
    location_types["hot"] = new LocationType({
        name: "hot",
        stages: {
            1: {
                description: "High temperature makes it hard to breath",
                related_skill: "Heat resistance",
                effects: {
                    multipliers: {
                    }
                }
            },
            2: {
                description: "It's so hot that just being here is painful",
                related_skill: "Heat resistance",
                effects: {
                    multipliers: {
                    }
                }
            },
            3: {
                description: "Temperature so high that wood ignites by itself",
                related_skill: "Heat resistance",
                //TODO: environmental damage if resistance is too low
                effects: {
                    multipliers: {
                    }
                }
            }
        }
    });
    location_types["cold"] = new LocationType({
        name: "cold",
        stages: {
            1: {
                description: "Cold makes your energy seep out...",
                related_skill: "Cold resistance",
                effects: {
                    multipliers: {
                    }
                }
            },
            2: {
                description: "So cold...",
                related_skill: "Cold resistance",
                effects: {
                    multipliers: {
                    }
                }
            },
            3: {
                description: "This place is so cold, lesser beings would freeze in less than a minute...",
                related_skill: "Cold resistance",
                //TODO: environmental damage if resistance is too low (to both hp and s.t.a.m.i.n.a?)
                effects: {
                    multipliers: {
                    }
                }
            }
        }
    });
})();

//create locations and zones
(function(){ 
    locations["Village"] = new Location({ 
        connected_locations: [], 
        getDescription: function() {
            if(locations["Infested field"].enemy_groups_killed >= 5 * locations["Infested field"].enemy_count) { 
                return "Medium-sized village, built next to a small river at the foot of the mountains. It's surrounded by many fields, a few of them infested by huge rats, which, while an annoyance, don't seem possible to fully eradicate. Other than that, there's nothing interesting around";
            }
            else if(locations["Infested field"].enemy_groups_killed >= 2 * locations["Infested field"].enemy_count) {
                return "Medium-sized village, built next to a small river at the foot of the mountains. It's surrounded by many fields, many of them infested by huge rats. Other than that, there's nothing interesting around";
            } else {
                return "Medium-sized village, built next to a small river at the foot of the mountains. It's surrounded by many fields, most of them infested by huge rats. Other than that, there's nothing interesting around"; 
            }
        },
        getBackgroundNoises: function() {
            let noises = ["*You hear some rustling*"];
            if(current_game_time.hour > 4 && current_game_time.hour <= 20) {
                noises.push("Anyone seen my cow?", "Mooooo!", "Tomorrow I'm gonna fix the roof", "Look, a bird!");

                if(locations["Infested field"].enemy_groups_killed <= 3) {
                    noises.push("These nasty rats almost ate my cat!");
                }
            }

            if(current_game_time.hour > 3 && current_game_time.hour < 10) {
                noises.push("♫♫ Heigh ho, heigh ho, it's off to work I go~ ♫♫", "Cock-a-doodle-doo!");
            } else if(current_game_time.hour > 18 && current_game_time.hour < 22) {
                noises.push("♫♫ Heigh ho, heigh ho, it's home from work I go~ ♫♫");
            } 

            return noises;
        },
        dialogues: ["village elder", "village guard", "old craftsman"],
        traders: ["village trader"],
        name: "Village", 
        crafting: {
            is_unlocked: true, 
            use_text: "Try to craft something", 
            tiers: {
                crafting: 1,
                forging: 1,
                smelting: 1,
                cooking: 1,
                alchemy: 1,
            }
        },
    });

    locations["Shack"] = new Location({
        connected_locations: [{location: locations["Village"], custom_text: "Go outside"}],
        description: "This small shack was the only spare building in the village. It's surprisingly tidy.",
        name: "Shack",
        is_unlocked: false,
        sleeping: {
            text: "Take a nap",
            xp: 1},
    })

    locations["Village"].connected_locations.push({location: locations["Shack"]});
    //remember to always add it like that, otherwise travel will be possible only in one direction and location might not even be reachable

    //NekoRPG noncombat locations below
    locations["纳家大厅"] = new Location({ 
        bgm: 1,
        connected_locations:[],
        
        description: "A bright and tidy hall, the place where Neko usually spends her time.",
        traders: ["Vending Machine"],
        dialogues: ["猫妖"],
        name: "Na Family Hall",
    });//1-1
    locations["练兵场深处"] = new Location({ 
        connected_locations: [{location: locations["纳家大厅"], custom_text: "Return to the Hall"}],
        description: "A small wooden cabin in the depths of the training grounds",

        bgm: 1,

        is_unlocked: false,
        unlock_text: "The path ahead seems unguarded... could this be the passage to the outside world?",
        name: "Training Grounds Depths",
    });



    locations["Village"].connected_locations.push({location: locations["纳家大厅"]});

    locations["纳可的房间"] = new Location({
        connected_locations: [{location: locations["纳家大厅"], custom_text: "Go to the Hall"}],
        description: "A cozy little room with a pink bed and a practice workbench.",
        name: "Neko's Room",
        is_unlocked: true,
        bgm: 1,
        sleeping: {
            text: "Take a nap",
            xp: 1},
            crafting: {
                is_unlocked: true, 
                use_text: "Go to the Workbench",
                tiers: {
                    crafting: 0,
                    forging: 0,
                    smelting: 0,
                    cooking: 0,
                    alchemy: 0,
                }
            },
        
    })
    
    locations["纳家大厅"].connected_locations.push({location: locations["纳可的房间"]});

    locations["Infested field"] = new Combat_zone({
        description: "Field infested with wolf rats. You can see the grain stalks move as these creatures scurry around.", 
        enemy_count: 15, 
        enemies_list: ["Starving wolf rat", "Wolf rat"],
        types: [{type: "open", stage: 1, xp_gain: 1}],
        enemy_stat_variation: 0.1,
        is_unlocked: false, 
        name: "Infested field", 
        parent_location: locations["Village"],
        first_reward: {
            xp: 10,
        },
        repeatable_reward: {
            textlines: [
                {dialogue: "village elder", lines: ["cleared field"]},
            ],
            xp: 5,
        }
    });

    
    locations["Village"].connected_locations.push({location: locations["Infested field"]});

    //NekoRPG conbat locations below

    locations["纳家练兵场 - 1"] = new Combat_zone({
        description: "A place where the Na family trains their younger members. Small monsters are kept here for sparring.",  //MT1
        enemy_count: 20, 
        enemies_list: ["毛茸茸","武装毛茸茸","红毛茸茸"],
        types: [],
        enemy_stat_variation: 0.1,
        is_unlocked: false, 
        name: "Na Family Training Grounds - 1", 
        parent_location: locations["纳家大厅"],
        first_reward: {
            xp: 8,
        },
        repeatable_reward: {
            xp: 4,
            
            locations: [{location: "纳家练兵场 - 2"}],
            //解锁地点必须在可重复奖励
        },
        rank:1,
        bgm:1,

        unlock_text: "To save my sister, I need to get stronger first! Let's go to the training grounds and fight some monsters.",
    });

    locations["纳家练兵场 - 2"] = new Combat_zone({
        description: "Deeper into the training grounds. Small monsters are kept here for sparring.", //MT2
        enemy_count: 20, 
        enemies_list: ["红毛茸茸","小飞蛾","骸骨","武装红毛茸茸","少年法师"],
        types: [],
        enemy_stat_variation: 0.1,
        is_unlocked: false, 
        name: "Na Family Training Grounds - 2", 
        parent_location: locations["纳家大厅"],
        first_reward: {
            xp: 12,
        },
        repeatable_reward: {
            xp: 6,
            
            locations: [{location: "纳家练兵场 - 3"}],
        },
        
        rank:2,
        bgm:1,
        unlock_text: "Not enough... don't get complacent just because you beat the weakest monsters. There's still a long road ahead!",
    });

    locations["纳家练兵场 - 3"] = new Combat_zone({
        description: "Deep within the training grounds. Growing-stage monsters are kept here for sparring.", //MT3
        enemy_count: 20, 
        enemies_list: ["骸骨","微尘级野兽","废弃傀儡","黑毛茸茸"],
        
        types: [],
        enemy_stat_variation: 0.1,
        is_unlocked: false, 
        name: "Na Family Training Grounds - 3", 
        parent_location: locations["纳家大厅"],
        first_reward: {
            xp: 16,
        },
        repeatable_reward: {
            xp: 2,
            
            locations: [{location: "练兵场深处"}],
        },
        rank:3,
        bgm:1,
    });

    locations["纳家练兵场 - 4"] = new Combat_zone({
        description: "A dark alleyway within the training grounds. Growing-stage monsters of a higher caliber.", //MT4
        enemy_count: 20, 
        enemies_list: ["黑毛茸茸","荧光飞蛾","橙毛茸茸","大飞蛾","聚灵骸骨"],
        types: [{type: "dark", stage: 1, xp_gain: 1}],
        enemy_stat_variation: 0.1,
        is_unlocked: true, 
        name: "Na Family Training Grounds - 4", 
        
        rank:4,
        bgm:1,
        parent_location: locations["练兵场深处"],
        first_reward: {
            xp: 20,
        },
        repeatable_reward: {
            xp: 3,
            
            locations: [{location: "纳家练兵场 - 5"}],
        }
    });

    locations["纳家练兵场 - 5"] = new Combat_zone({
        description: "A dark corridor within the training grounds. The darkness is now affecting combat.", //MT5~6
        enemy_count: 20, 
        enemies_list: ["聚灵骸骨","血洛游卒","石精","弱小意念","聚魂骸骨"],
        types: [{type: "dark", stage: 1, xp_gain: 2}],
        enemy_stat_variation: 0.1,
        is_unlocked: false, 
        name: "Na Family Training Grounds - 5", 
        
        rank:5,
        bgm:1,
        parent_location: locations["练兵场深处"],
        first_reward: {
            xp: 30,
        },
        repeatable_reward: {
            xp: 5,
            
            locations: [{location: "纳家练兵场 - 6"}],
        },
        unlock_text: "It's so dark... so scary... maybe I should craft some armor to protect myself.",
    });
    locations["纳家练兵场 - 6"] = new Combat_zone({
        description: "A dark corridor - there seems to be a faint light at the end?", //MT7~8
        enemy_count: 20, 
        enemies_list: ["弱小意念","聚魂骸骨","青年法师","武装橙毛茸茸","万物级凶兽","习武孩童"],
        types: [{type: "dark", stage: 1, xp_gain: 2}],
        enemy_stat_variation: 0.1,
        is_unlocked: false, 
        name: "Na Family Training Grounds - 6", 
        
        rank:6,
        bgm:1,
        parent_location: locations["练兵场深处"],
        first_reward: {
            xp: 40,
        },
        repeatable_reward: {
            xp: 7,
            
            locations: [{location: "纳家练兵场 - 7"}],
        },
        unlock_text: "Even kids can sneak in here, so this must be the right path! Yay!",
    });
    locations["纳家练兵场 - 7"] = new Combat_zone({
        description: "No longer dark, but the area near the side gate is swarming with monsters.", //MT9~10
        enemy_count: 20, 
        enemies_list: ["试炼木偶","聚魂骸骨","荧光飞蛾","出芽茸茸","万物级凶兽","习武孩童"],
        enemy_group_size: [2,2],
        types: [],
        enemy_stat_variation: 0.1,
        is_unlocked: false, 
        
        rank:7,
        bgm:1,
        name: "Na Family Training Grounds - 7", 
        parent_location: locations["练兵场深处"],
        first_reward: {
            xp: 50,
        },
        repeatable_reward: {
            xp: 10,
            locations: [{location: "纳家练兵场 - X"}],
        },
        unlock_text: "There are many suspicious doors around! But to check them out, we'll have to defeat the swarms of enemies in the way first...",
    });
    
    locations["纳家练兵场 - X"] = new Challenge_zone({
        description: "In front of a heavy door. Looks like you'll have to knock out the attendant to get through...",
        enemy_count: 1, 
        bgm:1,
        enemies_list: ["纳家待从[BOSS]"],
        enemy_group_size: [1,1],
        is_unlocked: false, 
        is_challenge: true,
        name: "Na Family Training Grounds - X", 
        leave_text: "Leave obediently",
        parent_location: locations["练兵场深处"],
        repeatable_reward: {
            //textlines: [{dialogue: "猫妖", lines: ["MT10_clear"]}],
            locations: [{location: "燕岗城"}],
        },
        unlock_text: "Please stop right there, miss.<br>Entry below the Earth Rank is not permitted here."
    });

    
    
    locations["纳家大厅"].connected_locations.push({location: locations["练兵场深处"]}); 

    locations["纳家大厅"].connected_locations.push({location: locations["纳家练兵场 - 1"]});
    locations["纳家大厅"].connected_locations.push({location: locations["纳家练兵场 - 2"]});
    locations["纳家大厅"].connected_locations.push({location: locations["纳家练兵场 - 3"]});
    locations["练兵场深处"].connected_locations.push({location: locations["纳家练兵场 - 4"]});
    locations["练兵场深处"].connected_locations.push({location: locations["纳家练兵场 - 5"]});
    locations["练兵场深处"].connected_locations.push({location: locations["纳家练兵场 - 6"]});
    locations["练兵场深处"].connected_locations.push({location: locations["纳家练兵场 - 7"]});
    locations["练兵场深处"].connected_locations.push({location: locations["纳家练兵场 - X"], custom_text: "Challenge the attendant by the gate"});



    
    locations["燕岗城"] = new Location({ 
        connected_locations: [{location: locations["练兵场深处"], custom_text: "Return to the Na Family"}],
        description: "The bustling outer city of Yangang. Even in a world that worships strength, the townsfolk always have plenty to talk about.",

        bgm: 2,
        dialogues: ["秘法石碑 - 1","路人甲"],
        traders: ["Yangang General Store"],
        is_unlocked: false,
        unlock_text: "No matter how many times you see it, the city's splendor is always striking. But right now, leaving the city as fast as possible is what matters!",
        name: "Yangang City",
    });//1-2
    locations["练兵场深处"].connected_locations.push({location: locations["燕岗城"]});

    locations["燕岗城 - 1"] = new Combat_zone({
        description: "An ordinary street in Yangang City's 14th ring.", //MT11-12
        enemy_count: 20, 
        enemies_list: ["试炼木偶","纳家待从","出芽红茸茸","轻型傀儡","万物级异兽"],
        enemy_group_size: [1,1],
        types: [],
        enemy_stat_variation: 0.1,
        is_unlocked: true, 
        name: "Yangang City - 1",
        
        rank:11, 
        bgm:2,
        parent_location: locations["燕岗城"],
        first_reward: {
            xp: 75,
        },
        repeatable_reward: {
            xp: 18,
            locations: [{location: "燕岗城 - 2"}],
        },
    });

    locations["燕岗城 - 2"] = new Combat_zone({
        description: "An ordinary street in Yangang City's 15th ring.", //MT13-14
        enemy_count: 20, 
        enemies_list: ["出芽红茸茸","轻型傀儡","万物级异兽","高速傀儡","黄毛茸茸","纳家塑像"],
        enemy_group_size: [1,1],
        types: [],
        enemy_stat_variation: 0.1,
        
        rank:12,
        bgm:2,
        is_unlocked: false, 
        name: "Yangang City - 2", 
        parent_location: locations["燕岗城"],
        first_reward: {
            xp: 90,
        },
        repeatable_reward: {
            xp: 24,
            locations: [{location: "燕岗城 - 3"},{location: "燕岗城 - 秘法石碑"}],
        },
    });

    locations["燕岗城 - 秘法石碑"] = new Challenge_zone({
        description: "A stone stele inscribed by Yangang City Lord 'Shi Fengxiong', containing basic Blood-Luo secret arts.",
        enemy_count: 1, 
        enemies_list: ["百家小卒[BOSS]"],
        enemy_group_size: [2,2],
        bgm:2,
        is_unlocked: false, 
        is_challenge: true,
        name: "Yangang City - Arcane Stele", 
        leave_text: "Retreat for now",
        parent_location: locations["燕岗城"],
        repeatable_reward: {
            //此处应有战斗姿态
            textlines: [{dialogue: "秘法石碑 - 1", lines: ["Power", "Speed"]}],
        },
        unlock_text: "Where did this little girl come from? Want to comprehend the secret arts here? Get past us first!"
    });

    locations["燕岗城 - 3"] = new Combat_zone({
        description: "An ordinary street in Yangang City's 16th ring.", //MT15-16
        enemy_count: 20, 
        enemies_list: ["高速傀儡","黄毛茸茸","纳家塑像","出芽橙茸茸","森林野蝠","血洛喽啰"],
        enemy_group_size: [1,1],
        types: [],
        enemy_stat_variation: 0.1,
        
        rank: 13,
        bgm:2,
        is_unlocked: false, 
        name: "Yangang City - 3", 
        parent_location: locations["燕岗城"],
        first_reward: {
            xp: 110,
        },
        repeatable_reward: {
            xp: 28,
            textlines: [{dialogue: "路人甲", lines: ["shop"]}],
            locations: [{location: "燕岗城 - 4"}],
        },
    });

    locations["燕岗城 - 4"] = new Combat_zone({
        description: "An ordinary street in Yangang City's 17th ring.", //MT17-18
        enemy_count: 20, 
        enemies_list: ["森林野蝠","血洛喽啰","百家小卒","下位佣兵","地龙荒兽","毒虫"],
        enemy_group_size: [1,2],
        types: [],
        enemy_stat_variation: 0.1,
        
        rank: 14,
        bgm:2,
        is_unlocked: false, 
        name: "Yangang City - 4", 
        parent_location: locations["燕岗城"],
        first_reward: {
            xp: 130,
        },
        repeatable_reward: {
            xp: 32,
            locations: [{location: "燕岗城 - 5"}],
        },
        unlock_text: "From here, the city gate is just barely visible... Yangang City has 18 rings in total; beyond that is the outskirts."
    });
    
    locations["燕岗城 - 5"] = new Combat_zone({
        description: "The outermost ring road of Yangang City.", //MT17-18
        enemy_count: 20, 
        enemies_list: ["下位佣兵","地龙荒兽","毒虫","精壮青年","法师学徒","生灵骸骨"],
        enemy_group_size: [2,3],
        types: [],
        enemy_stat_variation: 0.1,
        
        rank: 15,
        bgm:2,
        is_unlocked: false, 
        name: "Yangang City - 5", 
        parent_location: locations["燕岗城"],
        first_reward: {
            xp: 150,
        },
        repeatable_reward: {
            xp: 40,
            locations: [{location: "燕岗城 - X"}],
        },
    });

    
    locations["燕岗城 - X"] = new Challenge_zone({
        description: "The city gate of Yangang City. Just defeat the blocking Stone Spirit and you can get out!",
        enemy_count: 1, 
        bgm:2,
        enemies_list: ["腐蚀质石精[BOSS]"],
        enemy_group_size: [1,1],
        is_unlocked: false, 
        is_challenge: true,
        name: "Yangang City - X", 
        leave_text: "Retreat for now",
        parent_location: locations["燕岗城"],
        repeatable_reward: {
            locations: [{location: "燕岗近郊"}],
        },
        unlock_text: "Finally at the foot of the city gate...<br>What on earth is this granite monster?! I'll have to defeat it first."
    });

    locations["燕岗城"].connected_locations.push({location: locations["燕岗城 - 1"]});
    locations["燕岗城"].connected_locations.push({location: locations["燕岗城 - 2"]});
    locations["燕岗城"].connected_locations.push({location: locations["燕岗城 - 秘法石碑"]});
    locations["燕岗城"].connected_locations.push({location: locations["燕岗城 - 3"]});
    locations["燕岗城"].connected_locations.push({location: locations["燕岗城 - 4"]});
    locations["燕岗城"].connected_locations.push({location: locations["燕岗城 - 5"]});
    locations["燕岗城"].connected_locations.push({location: locations["燕岗城 - X"], custom_text: "Fight the Stone Spirit at the city gate"});


    
    locations["燕岗近郊"] = new Location({ 
        connected_locations: [{location: locations["燕岗城"], custom_text: "Return to city"}],
        description: "The area outside Yangang City. Birds sing and trees provide shade, but it's teeming with Tidal Rank monsters lurking in the shadows.",

        bgm: 3,
        is_unlocked: false,
        dialogues: ["百兰"],
        unlock_text: "Finally out of the city! Now, let's find someone to ask for information.",//先触发百兰剧情再解锁1-3-1！
        name: "Yangang Outskirts",
    });//1-3
    
    locations["燕岗城"].connected_locations.push({location: locations["燕岗近郊"]});


    locations["燕岗近郊 - 0"] = new Challenge_zone({
        description: "Not far from the city gate. Looks like it's time to teach this dismissive old man a lesson!",//MT22
        enemy_count: 1, 
        enemies_list: ["百兰[BOSS]"],
        enemy_group_size: [1,1],
        is_unlocked: false, 
        is_challenge: true,
        name: "Yangang Outskirts - 0", 
        leave_text: "Retreat for now",
        parent_location: locations["燕岗近郊"],
        repeatable_reward: {
            textlines: [{dialogue: "百兰", lines: ["defeat"]}],
        },
        bgm:3,
        unlock_text: "Hey uncle, at your age you're picking on a young girl? That's not very nice. Looks like you need a lesson."
    });
    locations["燕岗近郊 - 1"] = new Combat_zone({
        description: "Following the treasure map forward, a monster-infested area along the unavoidable route.", //MT23-24
        enemy_count: 20, 
        enemies_list: ["生灵骸骨","腐蚀质石精","绿毛茸茸","切叶虫茧","荒野蜂","花灵液"],
        enemy_group_size: [1,1],
        types: [],
        enemy_stat_variation: 0.1,
        is_unlocked: false, 
        name: "Yangang Outskirts - 1",
        
        rank:21, 
        bgm:3,
        parent_location: locations["燕岗近郊"],
        first_reward: {
            xp: 200,
        },
        repeatable_reward: {
            xp: 50,
            locations: [{location: "燕岗近郊 - 2"},{location:"郊区河流"}],
        },
    });
    locations["燕岗近郊 - 2"] = new Combat_zone({
        description: "Following the treasure map forward, an area where ill-intentioned cultivators lie in ambush.", //MT25-26
        enemy_count: 20, 
        enemies_list: ["荒野蜂","花灵液","燕岗领从者","野生幽灵","司雍世界修士"],//荒兽尼尔在原作中就不存在
        enemy_group_size: [1,1],
        types: [],
        enemy_stat_variation: 0.1,
        is_unlocked: false, 
        name: "Yangang Outskirts - 2",
        
        rank:22, 
        bgm:3,
        parent_location: locations["燕岗近郊"],
        first_reward: {
            xp: 220,
        },
        repeatable_reward: {
            xp: 54,
            locations: [{location: "燕岗近郊 - 3"},{location:"燕岗矿井"}],
            //activities: [{location:"燕岗矿井", activity:"miningP_copper"}],
        },
    });
    locations["燕岗近郊 - 3"] = new Combat_zone({
        description: "Following the treasure map forward, an area teeming with wild beasts.", //MT27-28
        enemy_count: 20, 
        enemies_list: ["荒兽尼尔","司雍世界修士","潮汐级荒兽","掠原蝠","黑夜傀儡"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        name: "Yangang Outskirts - 3",
        
        rank:23, 
        bgm:3,
        parent_location: locations["燕岗近郊"],
        first_reward: {
            xp: 240,
        },
        repeatable_reward: {
            xp: 60,
            locations: [{location: "燕岗近郊 - 4"}],
        },
    });
    locations["燕岗近郊 - 4"] = new Combat_zone({
        description: "An area with halo-enhanced wild beasts; their overall strength has risen by a level.", //MT29-30
        enemy_count: 20, 
        enemies_list: ["掠原蝠","黑夜傀儡","来一口","绿原行者","初生鬼","灵蔓茸茸"],//16-18三只怪放在-5
        enemy_group_size: [1,1],
        types: [],
        enemy_stat_halo: 0.1,
        is_unlocked: false, 
        name: "Yangang Outskirts - 4",
        
        rank:24, 
        bgm:3,
        parent_location: locations["燕岗近郊"],
        first_reward: {
            xp: 300,
        },
        repeatable_reward: {
            xp: 80,
            locations: [{location: "燕岗近郊 - 5"}],
        },
    });
    locations["燕岗近郊 - 5"] = new Combat_zone({
        description: "An area closer to the source of the halo, attracting Earth Rank cultivators.", //MT31-32
        enemy_count: 20, 
        enemies_list: ["绿原行者","初生鬼","燕岗领佣兵","冷冻火","缠绕骸骨","灵蔓茸茸"],//16-18三只怪放在-5
        enemy_group_size: [1,1],
        types: [],
        enemy_stat_halo: 0.1,
        is_unlocked: false, 
        name: "Yangang Outskirts - 5",
        
        rank:25, 
        bgm:3,
        parent_location: locations["燕岗近郊"],
        first_reward: {
            xp: 360,
        },
        repeatable_reward: {
            xp: 100,
            locations: [{location: "燕岗近郊 - 6"}],
        },
    });

    locations["燕岗近郊 - 6"] = new Combat_zone({
        description: "The Dungeon appears on the horizon, almost within reach. However, the nearby monsters are becoming increasingly frenzied.", //MT33-34
        enemy_count: 20, 
        enemies_list: ["绿原行者","初生鬼","燕岗领佣兵","冷冻火","缠绕骸骨","灵蔓茸茸"],
        enemy_group_size: [1,1],
        types: [],
        enemy_stat_halo: 0.2,
        is_unlocked: false, 
        name: "Yangang Outskirts - 6",
        
        rank:26, 
        bgm:3,
        parent_location: locations["燕岗近郊"],
        first_reward: {
            xp: 420,
        },
        repeatable_reward: {
            xp: 120,
            locations: [{location: "燕岗近郊 - X"}],
        },
        unlock_text: "That building ahead must be the treasure location. There are people there - that attire... are they mercenaries of Yangang Territory?"
        
    });

    
    locations["燕岗近郊 - X"] = new Challenge_zone({
        description: "The entrance to the Dungeon, source of the frenzied aura. Some possessed mercenaries are lingering here.",
        enemy_count: 1, 
        enemies_list: ["燕岗领佣兵[BOSS]"],
        enemy_group_size: [2,2],
        is_unlocked: false, 
        is_challenge: true,
        name: "Yangang Outskirts - X", 
        bgm:3,
        leave_text: "Retreat for now",
        parent_location: locations["燕岗近郊"],
        repeatable_reward: {
            locations: [{location: "地宫入口"}],
        },
        unlock_text: "Something's wrong. Why do these people look at me with such crazed eyes? Have they been cursed?"
    });

    locations["燕岗近郊"].connected_locations.push({location: locations["燕岗近郊 - 0"], custom_text: "Fight Bailan"});
    locations["燕岗近郊"].connected_locations.push({location: locations["燕岗近郊 - 1"]});
    locations["燕岗近郊"].connected_locations.push({location: locations["燕岗近郊 - 2"]});
    locations["燕岗近郊"].connected_locations.push({location: locations["燕岗近郊 - 3"]});
    locations["燕岗近郊"].connected_locations.push({location: locations["燕岗近郊 - 4"]});
    locations["燕岗近郊"].connected_locations.push({location: locations["燕岗近郊 - 5"]});
    locations["燕岗近郊"].connected_locations.push({location: locations["燕岗近郊 - 6"]});
    locations["燕岗近郊"].connected_locations.push({location: locations["燕岗近郊 - X"], custom_text: "Force entry into the Dungeon"});
    
    
    
    locations["郊区河流"] = new Location({ 
        connected_locations: [{location: locations["燕岗近郊"], custom_text: "Return to the treasure map route"}],
        description: "A bright little river, great for practicing swimming!",

        bgm: 3,
        is_unlocked: false,
        name: "Suburban River",
    });
    locations["燕岗矿井"] = new Location({ 
        connected_locations: [{location: locations["燕岗近郊"], custom_text: "Return to the treasure map route"}],
        description: "A cultivator settlement surrounding a mine, with a slightly better workbench than the practice one, a simple rest room, and some remaining A1-grade metal underground!",
        traders: ["Mine Market"],

        bgm: 3,
        is_unlocked: false,
        sleeping: {
            text: "Close the doors and windows, take a nap",
            xp: 2
        },
        crafting: {
           is_unlocked: true,
            use_text: "Use the shared Workbench [Tier+2]",
            tiers: {
                   crafting: 2,
                forging: 2,
                smelting: 2,
                cooking: 2,
                alchemy: 2,
            }
            },
        name: "Yangang Mine", 
    });
    locations["燕岗近郊"].connected_locations.push({location: locations["郊区河流"]});
    locations["燕岗近郊"].connected_locations.push({location: locations["燕岗矿井"]});
    

    
    locations["地宫入口"] = new Location({ 
        connected_locations: [{location: locations["燕岗近郊"], custom_text: "Leave the Dungeon"}],
        description: "The entrance to the Dungeon. The scent of gems is heavy in the air, but Earth Rank Tier 3 enemies guard the passage.",

        dialogues: ["地宫老人"],
        is_unlocked: false,
        //此处应有一个boss战和一个偷宝石的法子(10颗高级蓝宝石)
        name: "Dungeon Entrance",
        bgm: 4,
        unlock_text: "What a terrifying aura - and we've barely stepped through the door!"
    });//1-4pre
    locations["地宫 - 看门人"] = new Challenge_zone({
        description: "Are you sure you want to fight it... the \"get stronger through getting hit\" ability is nerfed now!",
        enemy_count: 4, 
        enemies_list: ["地宫看门人[BOSS]"],
        enemy_group_size: [1,1],
        is_unlocked: true, 
        is_challenge: true,
        name: "The Dungeon - Gatekeeper", 
        bgm:4,
        leave_text: "Leave this dangerous place",
        parent_location: locations["地宫入口"],
        repeatable_reward: {},

        //unlock_text: "不对劲，这些人看向我的时候，眼神怎么这么疯狂？难道是中了邪术吗？"
    });
    locations["地宫浅层"] = new Location({ 
        connected_locations: [{location: locations["地宫入口"], custom_text: "Return to the entrance"}],
        description: "The shallow floors of the Dungeon. Infested with wild beasts, but also hiding many treasures.",
        traders: ["Metal Wholesaler"],

        is_unlocked: true,
        name: "Dungeon Shallow Floors",
        bgm: 4,
    });//1-4
    
    locations["燕岗近郊"].connected_locations.push({location: locations["地宫入口"]});
    locations["地宫入口"].connected_locations.push({location: locations["地宫浅层"]});
    locations["地宫入口"].connected_locations.push({location: locations["地宫 - 看门人"], custom_text: "Fight the Earth Rank Tier 3 enemy for the gems"});
    locations["地宫 - 1"] = new Combat_zone({
        description: "A wide open \"treasure ground\" filled with Earth Rank cultivators.",
        enemy_count: 20, 
        enemies_list: ["夜行幽灵","石风家族剑士","能量络合球","地宫妖偶","金衣除草者"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: true, 
        name: "The Dungeon - 1",
        
        rank:31, 
        bgm:4,
        parent_location: locations["地宫浅层"],
        first_reward: {
            xp: 480,
        },
        repeatable_reward: {
            xp: 160,
            locations: [{location: "地宫 - 2"}],
        },
    });
    locations["地宫 - 2"] = new Combat_zone({
        description: "A Dungeon area filled with wild beasts and frenzied humans - the humans here seem to have become killing machines.",
        enemy_count: 20, 
        enemies_list: ["短视蝠","金衣除草者","阴暗茸茸","地宫妖偶","地宫虫卒"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        name: "The Dungeon - 2",
        
        rank:32, 
        bgm:4,
        parent_location: locations["地宫浅层"],
        first_reward: {
            xp: 540,
        },
        repeatable_reward: {
            xp: 180,
            locations: [{location: "地宫 - 3"}],
            traders: [{traders:"Metal Wholesaler"}],
        },
        unlock_text: "Should I go back and call for family backup? That would take too much time, and my sister would be in danger. No, now isn't the time to think about that."
    });
    locations["地宫 - 3"] = new Combat_zone({
        description: "A Dungeon area fraught with danger. By the way, Dungeon metals are on sale!",
        enemy_count: 20, 
        enemies_list: ["地宫虫卒","短视蝠","地刺","布菇妖","腾风塑像"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        name: "The Dungeon - 3",
        
        rank:33, 
        bgm:4,
        parent_location: locations["地宫浅层"],
        first_reward: {
            xp: 600,
        },
        repeatable_reward: {
            xp: 200,
            locations: [{location: "地宫 - 4"},{location: "地宫 - 石壁"}],
        },
        unlock_text: "A powerful cultivator once said... opportunities are always earned by oneself. Waiting around for fortune to fall into your lap just isn't realistic."
    });
    locations["地宫 - 4"] = new Combat_zone({
        description: "An ocean of wild beasts. Cultivation techniques can be found inscribed on the stone walls.",
        enemy_count: 20, 
        enemies_list: ["地刺","探险者亡魂","布菇妖","腾风塑像","出芽黄茸茸","大地级卫戍"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        name: "The Dungeon - 4",
        
        rank:34, 
        bgm:4,
        parent_location: locations["地宫浅层"],
        first_reward: {
            xp: 720,
        },
        repeatable_reward: {
            xp: 240,
            locations: [{location: "地宫 - X"}],
        },
        
        unlock_text: "There are words carved into the stone wall. They seem to be some sort of cultivation technique."
    });
    
    locations["地宫 - X"] = new Challenge_zone({
        description: "Floor 15 of the Dungeon, the end of the wild beast sea. The path forward is blocked by the Abyssal Shadow.",
        enemy_count: 1, 
        enemies_list: ["深邃之影[BOSS]"],
        enemy_group_size: [1,1],
        is_unlocked: false, 
        is_challenge: true,
        name: "The Dungeon - X", 
        bgm:4,
        leave_text: "Retreat for now",
        parent_location: locations["地宫浅层"],
        repeatable_reward: {
            locations: [{location: "地宫深层"}],
        },
        unlock_text: "Earth Rank Tier 2, and clearly not a fresh breakthrough. Is this the leader of these wild beasts?"
    });
    
    locations["地宫 - 石壁"] = new Challenge_zone({
        description: "Floor 13 of the Dungeon, a stone wall inscribed with cultivation techniques. You'll need to clear the wild beasts before you have time to study them.",
        enemy_count: 1, 
        enemies_list: ["行走树妖[BOSS]"],
        enemy_group_size: [1,1],
        is_unlocked: false, 
        is_challenge: true,
        name: "The Dungeon - Stone Wall", 
        bgm:4,
        leave_text: "Retreat for now",
        parent_location: locations["地宫浅层"],
        repeatable_reward: {
        },
    });

    locations["地宫浅层"].connected_locations.push({location: locations["地宫 - 1"]});
    locations["地宫浅层"].connected_locations.push({location: locations["地宫 - 2"]});
    locations["地宫浅层"].connected_locations.push({location: locations["地宫 - 3"]});
    locations["地宫浅层"].connected_locations.push({location: locations["地宫 - 4"]});
    locations["地宫浅层"].connected_locations.push({location: locations["地宫 - 石壁"], custom_text: "Clear the Tier 2 wild beasts around the stone wall"});
    locations["地宫浅层"].connected_locations.push({location: locations["地宫 - X"], custom_text: "Battle the wild beast leader"});
    
    
    
    locations["地宫深层"] = new Location({ 
        connected_locations: [{location: locations["地宫浅层"], custom_text: "Return to the shallow floors"}],
        description: "The area beyond the wild beast sea. Nanami is trapped here.",

        is_unlocked: false,
        name: "Dungeon Deep Floors",
        dialogues: ["纳娜米"],
        bgm: 5,
        unlock_text: "What a sinister aura. This doesn't feel like the ruins left by a strong cultivator, because when they create ruins, they usually leave guidance behind."
    });//1-5
    locations["地宫核心 - 1"] = new Combat_zone({
        description: "A chaotic corridor with a pungent, bloody smell. The environment is a notch worse than the Dungeon's shallow floors.",
        enemy_count: 20, 
        enemies_list: ["行走树妖","深邃之影","抽丝鬼","燕岗堕落狩士","二极蝠"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: true, 
        name: "Dungeon Core - 1",
        
        rank:41, 
        bgm:5,
        parent_location: locations["地宫深层"],
        first_reward: {
            xp: 1200,
        },
        repeatable_reward: {
            xp: 400,
            locations: [{location: "地宫核心 - 2"},{location:"地宫核心 - 悬空平台"}],
        }, 
    });
    locations["地宫核心 - 2"] = new Combat_zone({
        description: "Deeper into the Dungeon - a blue-purple barrier seems to be shimmering in the distance.",
        enemy_count: 20, 
        enemies_list: ["二极蝠","武装绿毛茸茸","二阶荒兽","地下岩火","初级魔法师","颂歌符文"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        name: "Dungeon Core - 2",
        
        rank:42, 
        bgm:5,
        parent_location: locations["地宫深层"],
        first_reward: {
            xp: 1500,
        },
        repeatable_reward: {
            xp: 500,
            locations: [{location: "地宫核心 - 3"}],
        },
    });
    locations["地宫核心 - 3"] = new Combat_zone({
        description: "An area close to the blue-purple barrier, with some floating platforms ahead.",
        enemy_count: 20, 
        enemies_list: ["二阶荒兽","地下岩火","初级魔法师","地宫执法者","地宫看门人","凶戾骨将"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        name: "Dungeon Core - 3",
        
        rank:43, 
        bgm:5,
        parent_location: locations["地宫深层"],
        first_reward: {
            xp: 1800,
        },
        repeatable_reward: {
            xp: 600,
            locations: [{location: "地宫核心 - 4"},{location:"地宫核心 - 光幕"}],
        },
    });
    locations["地宫核心 - 4"] = new Combat_zone({
        description: "The deep area beyond the floating platforms. Wild beasts here have commonly reached Earth Rank Tier 3.",
        enemy_count: 20, 
        enemies_list: ["地宫执法者","地宫看门人","凶戾骨将","巨型蜘蛛","出芽绿茸茸","地穴飞鸟"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        name: "Dungeon Core - 4",
        
        rank:44, 
        bgm:5,
        parent_location: locations["地宫深层"],
        first_reward: {
            xp: 2100,
        },
        repeatable_reward: {
            xp: 700,
            locations: [{location: "地宫核心 - 5"}],
        },
    });
    locations["地宫核心 - 5"] = new Combat_zone({
        description: "A deep area so packed with wild beasts they come in pairs. The source of the violent aura is not far now...",
        enemy_count: 20, 
        enemies_list: ["出芽绿茸茸","地穴飞鸟","小势力探险者","踏地荒兽","扭曲菇菇","喵咕哩"],
        enemy_group_size: [2,2],
        types: [],
        is_unlocked: false, 
        name: "Dungeon Core - 5",
        
        rank:45, 
        bgm:5,
        parent_location: locations["地宫深层"],
        first_reward: {
            xp: 2400,
        },
        repeatable_reward: {
            xp: 800,
            locations: [{location: "地宫核心 - 6"}],
        },
    });
    locations["地宫核心 - 6"] = new Combat_zone({
        description: "This is it! Beyond the sea of Tier 3 wild beasts, the source of everything...",
        enemy_count: 20, 
        enemies_list: ["踏地荒兽","扭曲菇菇","喵咕哩","温热飞蛾","苍白之触","燕岗城守卫"],
        enemy_group_size: [2,2],
        types: [],
        is_unlocked: false, 
        name: "Dungeon Core - 6",
        
        rank:46, 
        bgm:5,
        parent_location: locations["地宫深层"],
        first_reward: {
            xp: 3000,
        },
        repeatable_reward: {
            xp: 1000,
            locations: [{location: "地宫核心 - X"}],
        },
    });
    
    locations["地宫核心 - 悬空平台"] = new Challenge_zone({
        description: "A premium topaz gem is hidden behind the raging lava fire. Though extremely ferocious, its vitality is like a candle in the wind - extinguished with one touch.",
        enemy_count: 2, 
        enemies_list: ["地下岩火[BOSS]"],
        enemy_group_size: [1,1],
        is_unlocked: false, 
        is_challenge: true,
        name: "Dungeon Core - Floating Platform", 
        bgm:5,
        leave_text: "Beat a strategic retreat",
        parent_location: locations["地宫深层"],
        repeatable_reward: {        },
        unlock_text: "[Neko] I have to get it. Hehe, it must be worth a lot - I wonder how much we could sell it for... [Nanami] You couldn't even get a single red coin for it!",
    });
    locations["地宫核心 - 光幕"] = new Challenge_zone({
        description: "The green-purple barrier is right in front of you. Neko's instincts tell her there must be something good hidden behind it.",
        enemy_count: 2, 
        enemies_list: ["喵咕哩[BOSS]"],
        enemy_group_size: [1,1],
        is_unlocked: false, 
        is_challenge: true,
        name: "Dungeon Core - Light Barrier", 
        bgm:5,
        leave_text: "Go train more and come back",
        parent_location: locations["地宫深层"],
        repeatable_reward: {locations: [{location: "光幕空间"}]},
        //unlock_text: "[纳可]一定要拿到它。诶嘿，肯定很值钱的，不知道能卖到多少钱呢……[纳娜米]明明一个红色刀币都卖不到吧！",
    });
    
    locations["光幕空间"] = new Location({ 
        connected_locations: [{location: locations["地宫深层"], custom_text: "Return to the wild beast sea of the Dungeon"}],
        description: "A safe area behind the blue-purple barrier. The barrier itself has a \"refining\" ability and can also be used as a workbench.",
        //traders: ["Mine Market"],
        
        bgm: 5,
        is_unlocked: false,
        sleeping: {
            text: "Rest in place",
            xp: 4
        },
        crafting: {
           is_unlocked: true,
            use_text: "Use the Barrier to process items [Tier+4]",
            tiers: {
                   crafting: 4,
                forging: 4,
                smelting: 4,
                cooking: 4,
                alchemy: 4,
            }
            },
        name: "Light Barrier Space", 
    });


    locations["地宫核心 - X"] = new Challenge_zone({
        description: "The deepest part of the Dungeon. The [Dungeon Cultivator] is right in the center of this underground chamber on floor 35.",
        enemy_count: 1, 
        enemies_list: ["地宫养殖者[BOSS]"],
        enemy_group_size: [1,1],
        is_unlocked: false, 
        is_challenge: true,
        name: "Dungeon Core - X", 
        enemy_stat_halo: 0.2,
        bgm:5,
        leave_text: "Flee quickly",
        parent_location: locations["地宫深层"],
        repeatable_reward: {
            locations: [{location: "荒兽森林营地"}],
        },
        unlock_text: "[Nanami] There's also a terrifying cultivator's aura. Koko, we may have to face an unbeatable opponent soon. Do not make any rash moves until I play my trump card."
    });

    locations["地宫浅层"].connected_locations.push({location: locations["地宫深层"]});
    locations["地宫深层"].connected_locations.push({location: locations["地宫核心 - 1"]});
    locations["地宫深层"].connected_locations.push({location: locations["地宫核心 - 2"]});
    locations["地宫深层"].connected_locations.push({location: locations["地宫核心 - 3"]});
    locations["地宫深层"].connected_locations.push({location: locations["地宫核心 - 4"]});
    locations["地宫深层"].connected_locations.push({location: locations["地宫核心 - 5"]});
    locations["地宫深层"].connected_locations.push({location: locations["地宫核心 - 6"]});
    locations["地宫深层"].connected_locations.push({location: locations["地宫核心 - 悬空平台"]});
    locations["地宫深层"].connected_locations.push({location: locations["地宫核心 - 光幕"]});
    locations["地宫深层"].connected_locations.push({location: locations["光幕空间"]});
    locations["地宫深层"].connected_locations.push({location: locations["地宫核心 - X"], custom_text: "Challenge the Dungeon Cultivator"});

    
    
    locations["荒兽森林营地"] = new Location({ 
        connected_locations: [{location: locations["地宫深层"], custom_text: "Return to the Dungeon"},{location: locations["纳可的房间"], custom_text: "Fast Travel - Act 1"}],
        description: "After leaving the Dungeon, the safe zone of Neko's next training ground.",

        is_unlocked: false,
        name: "Wild Beast Forest Camp",
        dialogues: ["纳布"],
        traders: ["Camp Shop"],
        bgm: 6,
        //unlock_text: "好阴森的气息。这里不像是一个强者留下的遗迹，因为强者在创造遗迹时，一般都会留下引导。"
    });//2-1安全区
    locations["地宫深层"].connected_locations.push({location: locations["荒兽森林营地"]});
    locations["纳可的房间"].connected_locations.push({location: locations["荒兽森林营地"],custom_text:"Fast Travel - Act 2"});

    locations["荒兽森林"] = new Location({ 
        connected_locations: [{location: locations["荒兽森林营地"], custom_text: "Return to camp"}],
        description: "The interior of the Wild Beast Forest. Dense trees block most of the sunlight, and many wild beasts lurk in the darkness.",

        name: "Wild Beast Forest",
        is_unlocked: false,
        bgm: 6,
        //unlock_text: "好阴森的气息。这里不像是一个强者留下的遗迹，因为强者在创造遗迹时，一般都会留下引导。"
    });//2-1
    locations["荒兽森林营地"].connected_locations.push({location: locations["荒兽森林"]});


    locations["荒兽森林 - 1"] = new Combat_zone({
        description: "A forest area rampant with wild beasts, and also many Earth Rank cultivators who come to train.",
        enemy_count: 20, 
        enemies_list: ["灵能菇菇","妖灵飞蛾","飞叶级魔法师","血洛箭手"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: true, 
        name: "Wild Beast Forest - 1",
        
        rank:101, 
        bgm:6,
        parent_location: locations["荒兽森林"],
        first_reward: {
            xp: 3600,
        },
        repeatable_reward: {
            xp: 1200,
            locations: [{location: "荒兽森林 - 2"}],
        },
    });
    locations["荒兽森林 - 2"] = new Combat_zone({
        description: "A forest area rampant with wild beasts. Some wild beasts have migrated here from the now-depleted Dungeon.",
        enemy_count: 20, 
        enemies_list: ["血洛箭手","有角一族","噬血术傀儡","司雍世界行者","密林大鸟","地龙幼崽"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        name: "Wild Beast Forest - 2",
        
        rank:102, 
        bgm:6,
        parent_location: locations["荒兽森林"],
        first_reward: {
            xp: 4200,
        },
        repeatable_reward: {
            xp: 1400,
            locations: [{location: "荒兽森林 - 3"}],
            activities: [{location:"荒兽森林营地", activity: "woodcutting100"}],
        },
    });
    locations["荒兽森林 - 3"] = new Combat_zone({
        description: "A forest area rampant with wild beasts. Some wild beasts with powerful regeneration abilities have appeared.",
        enemy_count: 20, 
        enemies_list: ["地龙幼崽","人立茸茸","草木蜘蛛","持盾荒兽","芊叶蝠","深林妖偶"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        name: "Wild Beast Forest - 3",
        
        rank:103, 
        bgm:6,
        parent_location: locations["荒兽森林"],
        first_reward: {
            xp: 4800,
        },
        repeatable_reward: {
            xp: 1600,
            locations: [{location: "荒兽森林 - 4"}],
        },
        unlock_text: "Unlocked Wild Beast Forest - 3. Additionally, willow tree woodcutting at camp is now unlocked.",
    });
    locations["荒兽森林 - 4"] = new Combat_zone({
        description: "A forest area rampant with wild beasts. Some wild beasts and humans reaching Earth Rank Tier 5 have appeared.",
        enemy_count: 20, 
        enemies_list: ["深林妖偶","银杖茸茸","小门派执事","哥布林战士","刺猬精","毒枭蝎"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        name: "Wild Beast Forest - 4",
        
        rank:104, 
        bgm:6,
        parent_location: locations["荒兽森林"],
        first_reward: {
            xp: 6000,
        },
        repeatable_reward: {
            xp: 2000,
            locations: [{location: "荒兽森林 - X"}],
        },
    });
    locations["荒兽森林 - X"] = new Challenge_zone({
        description: "A battle with the Baijia Elite Guards. After defeating them, you can flee.",
        enemy_count: 2, 
        enemies_list: ["百家近卫[BOSS]"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Wild Beast Forest - X",
        bgm:6,
        parent_location: locations["荒兽森林"],
        repeatable_reward: {
            locations: [{location: "荒兽森林 - XL"},{location: "清野江畔"}],
        },
        unlock_text: "[Neko] You're right, but your brother hasn't even reached Earth Rank yet - how did you manage to cultivate all the way to Earth Rank Tier 7?",
    });
    locations["荒兽森林 - XL"] = new Challenge_zone({
        description: "A battle with Baifang. You can come back to defeat him later!",
        enemy_count: 1, 
        enemies_list: ["百方[荒兽森林 ver.][BOSS]"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Wild Beast Forest - XL",
        bgm:6,
        parent_location: locations["荒兽森林"],
        repeatable_reward: {
        },
        unlock_text: "[Baifang] She ran? This is a problem. Getting another chance to make a move won't be so easy now.",
    });

    
    locations["荒兽森林"].connected_locations.push({location: locations["荒兽森林 - 1"]});
    locations["荒兽森林"].connected_locations.push({location: locations["荒兽森林 - 2"]});
    locations["荒兽森林"].connected_locations.push({location: locations["荒兽森林 - 3"]});
    locations["荒兽森林"].connected_locations.push({location: locations["荒兽森林 - 4"]});
    locations["荒兽森林"].connected_locations.push({location: locations["荒兽森林 - X"], custom_text: "Fight the Baijia Elite Guards"});
    locations["荒兽森林"].connected_locations.push({location: locations["荒兽森林 - XL"], custom_text: "Fight Baifang"});

    locations["清野江畔"] = new Location({ 
        connected_locations: [{location: locations["荒兽森林营地"], custom_text: "Take the small path, return to camp"}],
        description: "Following this river back leads to the family estate... hurry and report this to Father!",

        traders: ["Traveling Merchant"],
        dialogues: ["清野瀑布","纳布(江畔)"],
        name: "Qingye Riverbank",
        is_unlocked: false,
        bgm: 7,
        //unlock_text: "好阴森的气息。这里不像是一个强者留下的遗迹，因为强者在创造遗迹时，一般都会留下引导。"
    });//2-2
    locations["清野江畔 - 1"] = new Combat_zone({
        description: "Along the Qingye River, on the way home. Baifang still has forces deployed in this area.",
        enemy_count: 20, 
        enemies_list: ["小门派执事","毒枭蝎","百家近卫","怨灵船夫","旱魃龟","复苏骸骨"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: true, 
        name: "Qingye Riverbank - 1",
        
        rank:111, 
        bgm:7,
        parent_location: locations["清野江畔"],
        first_reward: {
            xp: 9600,
        },
        repeatable_reward: {
            xp: 3200,
            locations: [{location: "清野江畔 - 2"},{location: "清野江畔 - 歧路"}],
        },
    });
    locations["清野江畔 - 2"] = new Combat_zone({
        description: "Along the Qingye River, on the way home. Wild beasts swarm in packs - this level of dangerous area is necessary to avoid Baifang.",
        enemy_count: 20, 
        enemies_list: ["旱魃龟","复苏骸骨","旅行魔术师","水溶茸茸","飞龙幼崽","鲜红八爪鱼"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        name: "Qingye Riverbank - 2",
        
        rank:112, 
        enemy_stat_halo: 0.05,
        bgm:7,
        parent_location: locations["清野江畔"],
        first_reward: {
            xp: 14400,
        },
        repeatable_reward: {
            xp: 4800,
            locations: [{location: "清野江畔 - 3"},{location: "清野江畔 - 瀑布"}],
        },
    });
    locations["清野江畔 - 3"] = new Combat_zone({
        description: "Along the Qingye River, on the way home. Not only do wild beasts swarm, but there's also a subtle frenzied aura in this area.",
        enemy_count: 20, 
        enemies_list: ["水溶茸茸","飞龙幼崽","鲜红八爪鱼","商船水手","深水恐怖","清野江盗匪"],
        enemy_group_size: [1.5,2.5],
        types: [],
        is_unlocked: false, 
        name: "Qingye Riverbank - 3",
        
        rank:113, 
        bgm:7,
        enemy_stat_halo: 0.1,
        parent_location: locations["清野江畔"],
        first_reward: {
            xp: 19200,
        },
        repeatable_reward: {
            xp: 6400,
            locations: [{location: "清野江畔 - 4"}],
            traders: [{traders:"Traveling Merchant"}],
        },
    });
    locations["清野江畔 - 4"] = new Combat_zone({
        description: "Along the Qingye River, on the way home. Wild beast strength has greatly increased, but the family estate is no longer far - no need to linger in battle.",
        enemy_count: 20, 
        enemies_list: ["马里奥菇菇","极冰火","清野江窃贼","礁石灵","火烧云","Traveling Merchant"],
        enemy_group_size: [1.5,2.5],
        types: [],
        is_unlocked: false, 
        name: "Qingye Riverbank - 4",
        
        rank:114, 
        bgm:7,
        parent_location: locations["清野江畔"],
        first_reward: {
            xp: 24000,
        },
        repeatable_reward: {
            xp: 8000,
            locations: [{location: "清野江畔 - X"}],
        },
    });
    
    locations["清野江畔 - 歧路"] = new Challenge_zone({
        description: "A chance encounter with a Tier 7 warrior that can't be defeated at full effort... don't forget about this encounter later (x",
        enemy_count: 1, 
        enemies_list: ["威武武士[BOSS]"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Qingye Riverbank - Crossroads",
        bgm:7,
        parent_location: locations["清野江畔"],
        repeatable_reward: {
        },
    });
    locations["清野江畔 - 瀑布"] = new Challenge_zone({
        description: "Near the waterfall that Neko visited as a child. It seems to contain some kind of insight.",
        enemy_count: 1, 
        enemies_list: ["礁石灵[BOSS]"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Qingye Riverbank - Waterfall",
        bgm:7,
        parent_location: locations["清野江畔"],
        repeatable_reward: {
            textlines: [{dialogue: "清野瀑布", lines: ["wf1"]}],
        },
    });
    locations["清野江畔 - X"] = new Challenge_zone({
        description: "Father is not far away. Just defeat this errand boy and it'll be safe!",
        enemy_count: 1, 
        enemies_list: ["大门派杂役[BOSS]"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Qingye Riverbank - X",
        bgm:7,
        parent_location: locations["清野江畔"],
        repeatable_reward: {
            textlines: [{dialogue: "纳布(江畔)", lines: ["jp1"]}],
        },
    });
    locations["荒兽森林"].connected_locations.push({location: locations["清野江畔"]});
    locations["清野江畔"].connected_locations.push({location: locations["清野江畔 - 1"]});
    locations["清野江畔"].connected_locations.push({location: locations["清野江畔 - 2"]});
    locations["清野江畔"].connected_locations.push({location: locations["清野江畔 - 3"]});
    locations["清野江畔"].connected_locations.push({location: locations["清野江畔 - 4"]});
    locations["清野江畔"].connected_locations.push({location: locations["清野江畔 - 歧路"]});
    locations["清野江畔"].connected_locations.push({location: locations["清野江畔 - 瀑布"]});
    locations["清野江畔"].connected_locations.push({location: locations["清野江畔 - X"], custom_text: "Fight the blocking Great Sect errand boy"});


    
    locations["纳家秘境"] = new Location({ 
        connected_locations: [{location: locations["清野江畔"], custom_text: "Return to the Qingye Riverbank area to train"}],
        description: "A secret training realm built by the Na Family. Contains an advanced workbench, rest area, and a storage room.",

        traders: ["Storage Chest"],
        sleeping: {
            text: "Meditate and restore energy [+100XP/s]",
            xp: 10
        },
        crafting: {
           is_unlocked: true,
            use_text: "Use the advanced Workbench [Tier+6]",
            tiers: {
                crafting: 6,
                forging: 6,
                smelting: 6,
                cooking: 6,
                alchemy: 6,
            }
            },
        name: "Na Family Secret Realm", 
        is_unlocked: false,
        bgm: 8,
        //unlock_text: "好阴森的气息。这里不像是一个强者留下的遗迹，因为强者在创造遗迹时，一般都会留下引导。"
    });//2-3
    
    locations["纳家秘境 - 战斗区"] = new Location({ 
        connected_locations: [{location: locations["纳家秘境"], custom_text: "Return to the rest area to recover"}],
        description: "A secret training realm built by the Na Family. There are five floors in total, each with more and stronger wild beasts and monsters, along with more powerful halo effects.",
        
        dialogues: ["秘境心火精灵"],
        name: "Na Family Secret Realm - Combat Zone", 
        types: [],
        is_unlocked: true,
        bgm: 8,
        
    });
    
    locations["纳家秘境 - 1"] = new Combat_zone({
        description: "The Na Family's secret training realm. This is the outermost area.",
        enemy_count: 20, 
        enemies_list: ["极冰火","清野江窃贼","火烧云","马里奥菇菇","大门派杂役"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: true, 
        is_challenge: false,
        name: "Na Family Secret Realm - 1",
        enemy_stat_halo: 0.08,
        rank:121, 
        bgm:8,
        parent_location: locations["纳家秘境 - 战斗区"],
        first_reward: {
            xp: 3e4,
        },
        repeatable_reward: {
            xp: 1e4,
            locations: [{location: "纳家秘境 - 2"}],
        },
    });
    locations["纳家秘境 - 2"] = new Combat_zone({
        description: "The Na Family's secret training realm. This is the outer area.",
        enemy_count: 20, 
        enemies_list: ["火烧云","Traveling Merchant","大门派杂役","高歌骸骨","燕岗高等散修"],
        enemy_group_size: [1.5,2.5],
        types: [],
        is_unlocked: false, 
        name: "Na Family Secret Realm - 2",
        enemy_stat_halo: 0.16,
        rank:122, 
        bgm:8,
        parent_location: locations["纳家秘境 - 战斗区"],
        first_reward: {
            xp: 6e4,
        },
        repeatable_reward: {
            xp: 2e4,
            locations: [{location: "纳家秘境 - 3"}],
        },
    });
    locations["纳家秘境 - 3"] = new Combat_zone({
        description: "The Na Family's secret training realm. This is the middle area between the inner and outer zones.",
        enemy_count: 20, 
        enemies_list: ["大门派杂役","高歌骸骨","燕岗高等散修","微花灵阵","灵慧石人"],
        enemy_group_size: [2,2],
        types: [],
        is_unlocked: false, 
        name: "Na Family Secret Realm - 3",
        enemy_stat_halo: 0.24,
        rank:123, 
        bgm:8,
        parent_location: locations["纳家秘境 - 战斗区"],
        first_reward: {
            xp: 9e4,
        },
        repeatable_reward: {
            xp: 3e4,
            locations: [{location: "纳家秘境 - 4"}],
        },
    });
    locations["纳家秘境 - 4"] = new Combat_zone({
        description: "The Na Family's secret training realm. This area is closer to the core.",
        enemy_count: 20, 
        enemies_list: ["燕岗高等散修","微花灵阵","灵慧石人","纳家探宝者","秘境蝎龙"],
        enemy_group_size: [2.5,3.5],
        types: [],
        is_unlocked: false, 
        name: "Na Family Secret Realm - 4",
        enemy_stat_halo: 0.32,
        rank:124, 
        bgm:8,
        parent_location: locations["纳家秘境 - 战斗区"],
        first_reward: {
            xp: 12e4,
        },
        repeatable_reward: {
            xp: 4e4,
            locations: [{location: "纳家秘境 - 5"}],
        },
    });
    locations["纳家秘境 - 5"] = new Combat_zone({
        description: "The Na Family's secret training realm. This is the core area.",
        enemy_count: 20, 
        enemies_list: ["微花灵阵","灵慧石人","纳家探宝者","秘境蝎龙","荒兽法兵","巨人先锋"],
        enemy_group_size: [3,3],
        types: [],
        is_unlocked: false, 
        name: "Na Family Secret Realm - 5",
        enemy_stat_halo: 0.40,
        rank:125, 
        bgm:8,
        parent_location: locations["纳家秘境 - 战斗区"],
        first_reward: {
            xp: 15e4,
        },
        repeatable_reward: {
            xp: 5e4,
            locations: [{location: "纳家秘境 - X"}],
            activities: [{location:"纳家秘境", activity:"microflower"}],
        },
    });
    
    locations["纳家秘境 - ∞"] = new Combat_zone({
        description: "The innermost core area of the Na Family's secret training realm. Spirit array intensity can be freely adjusted. (Floor manual updates may not be timely; please refer to the Heart Fire Sprite for accurate stats)",
        enemy_count: 20, 
        enemies_list: ["微花灵阵","灵慧石人","纳家探宝者","秘境蝎龙","荒兽法兵","巨人先锋"],
        enemy_group_size: [6,6],
        types: [],
        is_unlocked: false, 
        name: "Na Family Secret Realm - ∞",
        enemy_stat_halo: 0.48,
        rank:126, 
        bgm:8,
        parent_location: locations["纳家秘境 - 战斗区"],
        first_reward: {
        },
        repeatable_reward: {
        },
    });
    
    locations["纳家秘境 - X"] = new Challenge_zone({
        description: "The innermost sprite of the secret realm is here. Defeat it to take control of the entire realm!",
        enemy_count: 1, 
        enemies_list: ["秘境心火精灵[BOSS]"],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Na Family Secret Realm - X",
        enemy_stat_halo: 0.40,
        bgm:8,
        parent_location: locations["纳家秘境 - 战斗区"],
        repeatable_reward: {
            textlines: [{dialogue: "秘境心火精灵", lines: ["xh1"]}],
            locations: [{location: "结界湖" }],
        },
    });
    locations["清野江畔"].connected_locations.push({location: locations["纳家秘境"]});
    locations["纳家秘境"].connected_locations.push({location: locations["纳家秘境 - 战斗区"]});
    locations["纳家秘境 - 战斗区"].connected_locations.push({location: locations["纳家秘境 - 1"]});
    locations["纳家秘境 - 战斗区"].connected_locations.push({location: locations["纳家秘境 - 2"]});
    locations["纳家秘境 - 战斗区"].connected_locations.push({location: locations["纳家秘境 - 3"]});
    locations["纳家秘境 - 战斗区"].connected_locations.push({location: locations["纳家秘境 - 4"]});
    locations["纳家秘境 - 战斗区"].connected_locations.push({location: locations["纳家秘境 - 5"]});
    locations["纳家秘境 - 战斗区"].connected_locations.push({location: locations["纳家秘境 - ∞"]});
    locations["纳家秘境 - 战斗区"].connected_locations.push({location: locations["纳家秘境 - X"], custom_text:"Challenge the realm's guardian sprite"});

    
    
    locations["结界湖"] = new Location({ 
        connected_locations: [{location: locations["纳家秘境"], custom_text: "Return to the family's secret realm"}],
        description: "Guided here by the ancestor Na Ying, the Barrier Lake that seals the \"Spirit\".",

        dialogues: ["纳鹰"],
        name: "Barrier Lake",
        is_unlocked: false,
        bgm: 9,
    });//2-4
    locations["结界湖 - 1"] = new Combat_zone({
        description: "A lake at the core of the secret realm. Newborn \"Spirits\" and wild beasts roam here.",
        enemy_count: 20, 
        enemies_list: ["微花灵阵","威武武士","七阶卫戍","秘境帕芙之灵","秘境猬精","秘境心火精灵"],
        enemy_group_size: [2,2],
        types: [],
        is_unlocked: false, 
        name: "Barrier Lake - 1",
        enemy_stat_halo: 0.08,
        rank:131, 
        bgm:9,
        parent_location: locations["结界湖"],
        first_reward: {
            xp: 30e4,
        },
        repeatable_reward: {
            xp: 10e4,
            locations: [{location: "结界湖 - 2"}],
            //钓鱼区域！
        },
    });
    locations["结界湖 - 2"] = new Combat_zone({
        description: "A lake at the core of the secret realm. Newborn \"Spirits\", humans, and realm guardians all coexist here.",
        enemy_count: 20, 
        enemies_list: ["微花灵阵","秘境猬精","秘境心火精灵","纳家冰雪亲卫","有甲有角族","水晶傀儡"],
        enemy_group_size: [2.25,3.25],
        types: [],
        is_unlocked: false, 
        name: "Barrier Lake - 2",
        enemy_stat_halo: 0.08,
        rank:132, 
        bgm:9,
        parent_location: locations["结界湖"],
        first_reward: {
            xp: 45e4,
        },
        repeatable_reward: {
            xp: 15e4,
            locations: [{location: "结界湖 - 3"}],
        },
    });
    locations["结界湖 - 3"] = new Combat_zone({
        description: "A lake at the core of the secret realm. Quite dangerous earth-binding \"Spirits\" have appeared - fall into their grasp and it's hard to escape.",
        enemy_count: 20, 
        enemies_list: ["微花灵阵","水晶傀儡","原力刀客","秘境胖胖鸟","人立金茸茸","喵咕咕哩"],
        enemy_group_size: [2.5,3.5],
        types: [],
        is_unlocked: false, 
        name: "Barrier Lake - 3",
        enemy_stat_halo: 0.08,
        rank:133, 
        bgm:9,
        parent_location: locations["结界湖"],
        first_reward: {
            xp: 60e4,
        },
        repeatable_reward: {
            xp: 20e4,
            locations: [{location: "结界湖 - 4"}],
        },
    });
    locations["结界湖 - 4"] = new Combat_zone({
        description: "A lake at the core of the secret realm. More human bodies possessed by \"Spirits\" have appeared.",
        enemy_count: 20,
        enemies_list: ["微花灵阵","喵咕咕哩","秘境滋生魔","蓝帽行者","流云级魔法师","威武异衣士"],
        enemy_group_size: [2.75,3.75],
        types: [],
        is_unlocked: false, 
        name: "Barrier Lake - 4",
        enemy_stat_halo: 0.08,
        rank:134, 
        bgm:9,
        parent_location: locations["结界湖"],
        first_reward: {
            xp: 75e4,
        },
        repeatable_reward: {
            xp: 25e4,
            locations: [{location: "结界湖 - 5"}],
        },
    });
    locations["结界湖 - 5"] = new Combat_zone({
        description: "A lake at the core of the secret realm. Even more human bodies possessed by \"Spirits\" have appeared.",
        enemy_count: 20,
        enemies_list: ["微花灵阵","喵咕咕哩","流云级魔法师","威武异衣士","雪魅蝠","大眼八爪鱼"],
        enemy_group_size: [3,3],
        types: [],
        is_unlocked: false, 
        name: "Barrier Lake - 5",
        enemy_stat_halo: 0.08,
        rank:135, 
        bgm:9,
        parent_location: locations["结界湖"],
        first_reward: {
            xp: 90e4,
        },
        repeatable_reward: {
            xp: 30e4,
            locations: [{location: "结界湖 - X"}],
        },
    });
    locations["结界湖 - X"] = new Challenge_zone({
        description: "Wuu... so strong! Hopefully you haven't thrown away your Micro Flower Fragments.",
        enemy_count: 1, 
        enemy_groups_list : [["流云级魔法师[BOSS]","流云级魔法师[BOSS]","威武异衣士[BOSS]","威武异衣士[BOSS]","蓝帽行者[BOSS]","蓝帽行者[BOSS]","蓝帽行者[BOSS]"]],
        enemy_group_size: [7,7],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Barrier Lake - X",
        enemy_stat_halo: 0.32,
        bgm:9,
        parent_location: locations["结界湖"],
        repeatable_reward: {
            activities: [{location:"结界湖", activity:"Running"}]
            //locations: [{location: "结界湖" }],
        },
        unlock_text: "Without realizing it... you've walked all the way to the core area. The \"Spirits\" living here are among the strongest of their kind.",
    });
    
    //1-5 4-8 8-12 11-15 14-18.

    locations["纳家秘境 - 战斗区"].connected_locations.push({location: locations["结界湖"]});
    locations["结界湖"].connected_locations.push({location: locations["结界湖 - 1"]});
    locations["结界湖"].connected_locations.push({location: locations["结界湖 - 2"]});
    locations["结界湖"].connected_locations.push({location: locations["结界湖 - 3"]});
    locations["结界湖"].connected_locations.push({location: locations["结界湖 - 4"]});
    locations["结界湖"].connected_locations.push({location: locations["结界湖 - 5"]});
    locations["结界湖"].connected_locations.push({location: locations["结界湖 - X"], custom_text:"Challenge the \"Spirit\" in the deepest part of the Barrier Lake"});



    locations["声律城废墟"] = new Location({ 
        connected_locations: [{location: locations["纳家秘境"], custom_text: "Travel back to the family's secret realm"}],
        description: "The ruins of Shenglu City, destroyed by a D9-class spaceship. Many useful treasures are hidden in the chaos.",

        traders: ["Ruins Merchant"],
        dialogues: ["纳娜米(废墟)","声律城难民"],
        name: "Shenglu City Ruins",
        is_unlocked: false,
        bgm: 10,
    });//2-5

    locations["声律城废墟 - 1"] = new Combat_zone({
        description: "Shenglu City destroyed by the D9 spaceship. A chaotic mix of all sorts, perfect for fishing in troubled waters.",
        enemy_count: 20,
        enemies_list: ["威武异衣士","大眼八爪鱼","原力刀客","废墟猎兵","废墟菇灵"],
        enemy_group_size: [2,2],
        types: [],
        is_unlocked: false, 
        name: "Shenglu City Ruins - 1",
        rank:141, 
        bgm:10,
        parent_location: locations["声律城废墟"],
        first_reward: {
            xp: 120e4,
        },
        repeatable_reward: {
            xp: 40e4,
            money: 200e3,
            locations: [{location: "声律城废墟 - 2"}],
        },
    });
    locations["声律城废墟 - 2"] = new Combat_zone({
        description: "Shenglu City destroyed by the D9 spaceship. A chaotic mix of all sorts, perfect for fishing in troubled waters.",
        enemy_count: 20,
        enemies_list: ["废墟猎兵","废墟菇灵","燕岗城探险者","声律城难民","声律城骸骨"],
        enemy_group_size: [2,2],
        types: [],
        is_unlocked: false, 
        name: "Shenglu City Ruins - 2",
        rank:142, 
        bgm:10,
        parent_location: locations["声律城废墟"],
        first_reward: {
            xp: 150e4,
        },
        repeatable_reward: {
            xp: 50e4,
            money: 400e3,
            locations: [{location: "声律城废墟 - 3"}],
        },
    }); 
    locations["声律城废墟 - 3"] = new Combat_zone({
        description: "Shenglu City destroyed by the D9 spaceship. A chaotic mix of all sorts, perfect for fishing in troubled waters.",
        enemy_count: 20,
        enemies_list: ["声律城难民","声律城骸骨","锈胎人","双棱晶体","废墟恐怖"],
        enemy_group_size: [2,2],
        types: [],
        is_unlocked: false, 
        name: "Shenglu City Ruins - 3",
        rank:143, 
        bgm:10,
        parent_location: locations["声律城废墟"],
        first_reward: {
            xp: 180e4,
        },
        repeatable_reward: {
            xp: 60e4,
            money: 600e3,
            locations: [{location: "声律城废墟 - 4"}],
        },
    });
    locations["声律城废墟 - 4"] = new Combat_zone({
        description: "Shenglu City destroyed by the D9 spaceship. A chaotic mix of all sorts, perfect for fishing in troubled waters.",
        enemy_count: 20,
        enemies_list: ["双棱晶体","废墟恐怖","猫茸茸","兰陵城探险者","远古傀儡","血洛幽灵"],//兰陵城小队长，伏地精
        enemy_group_size: [3,3],
        types: [],
        is_unlocked: false, 
        name: "Shenglu City Ruins - 4",
        rank:144, 
        bgm:10,
        parent_location: locations["声律城废墟"],
        first_reward: {
            xp: 180e4,
        },
        repeatable_reward: {
            xp: 60e4,
            money: 800e3,
            locations: [{location: "声律城废墟 - 5"}],
        },
    });
    locations["声律城废墟 - 5"] = new Combat_zone({
        description: "Shenglu City destroyed by the D9 spaceship. A chaotic mix of all sorts, perfect for fishing in troubled waters.",
        enemy_count: 20,
        enemies_list: ["远古傀儡","血洛幽灵","废墟飞鸟","兰陵城小队长","伏地精"],
        enemy_group_size: [3,3],
        types: [],
        is_unlocked: false, 
        name: "Shenglu City Ruins - 5",
        rank:145, 
        bgm:10,
        parent_location: locations["声律城废墟"],
        first_reward: {
            xp: 210e4,
        },
        repeatable_reward: {
            xp: 70e4,
            money: 1e6,
            locations: [{location: "声律城废墟 - X"}],
        },
    });
    locations["声律城废墟 - X"] = new Challenge_zone({
        description: "...One-shot the moment you poke your head out?! If you can read this, I trust you've already found a way to break through.",
        enemy_count: 1, 
        enemies_list : [["废墟追光者[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Shenglu City Ruins - X",
        bgm:10,
        parent_location: locations["声律城废墟"],
        repeatable_reward: {
            money: 1e9,
            locations: [{location: "声律城战场" }],
        },
        unlock_text: "There's actually a Peak Earth Rank shadow beast blocking the way...<br>Then let me use it to test how much I've improved during this time.",
    });
    locations["纳家秘境"].connected_locations.push({location: locations["声律城废墟"]});
    locations["声律城废墟"].connected_locations.push({location: locations["声律城废墟 - 1"]});
    locations["声律城废墟"].connected_locations.push({location: locations["声律城废墟 - 2"]});
    locations["声律城废墟"].connected_locations.push({location: locations["声律城废墟 - 3"]});
    locations["声律城废墟"].connected_locations.push({location: locations["声律城废墟 - 4"]});
    locations["声律城废墟"].connected_locations.push({location: locations["声律城废墟 - 5"]});
    locations["声律城废墟"].connected_locations.push({location: locations["声律城废墟 - X"], custom_text:"Challenge the [Light-Chasing] shadow beast blocking the way"});
    
    locations["声律城战场"] = new Location({ 
        connected_locations: [{location: locations["声律城废墟"], custom_text: "Return to Shenglu City ruins"}],
        description: "The chaotic battlefield on the outskirts of Shenglu City. No need to linger - the target is the B9 spaceship!",
        dialogues: ["心魔(战场)","御兰","皎月神像"],
        name: "Shenglu City Battlefield",
        is_unlocked: false,
        bgm: 11,
    });//2-6
    locations["声律城废墟"].connected_locations.push({location: locations["声律城战场"]});

    
    locations["符文之屋"] = new Location({
        connected_locations: [{location: locations["声律城废墟"], custom_text: "Return to fight in the ruins"}],
        description: "The rune workbench set even comes with a box, a bed, and an energy-gathering array! Truly great value...",
        name: "Rune House",
        is_unlocked: false,
        bgm: 10,
        traders: ["Storage Chest"],
        sleeping: {
            text: "Cultivate in the Rune House [+10,000XP/s]",
            xp: 100
        },
            crafting: {
                is_unlocked: true,
                use_text: "Use the Rune Workbench [Tier+8]",
                tiers: {
                    crafting: 8,
                    forging: 8,
                    smelting: 8,
                    cooking: 8,
                    alchemy: 8,
                }
            },
        
    })
    
    locations["声律城废墟"].connected_locations.push({location: locations["符文之屋"]});


    locations["声律城战场 - 1"] = new Combat_zone({
        description: "The battlefield outside Shenglu City, destroyed by the D9 spaceship. Killing and looting are commonplace here.",
        enemy_count: 20,
        enemies_list: ["废墟飞鸟","兰陵城小队长","伏地精","废墟虫卒","战场亡魂"],
        enemy_group_size: [2,2],
        types: [],
        is_unlocked: false, 
        name: "Shenglu City Battlefield - 1",
        rank:151, 
        bgm:11,
        parent_location: locations["声律城战场"],
        first_reward: {
            xp: 240e4,
        },
        repeatable_reward: {
            xp: 80e4,
            locations: [{location: "声律城战场 - 2"}],
        },
    });
    
    locations["声律城战场 - 2"] = new Combat_zone({
        description: "The battlefield outside Shenglu City, destroyed by the D9 spaceship. Killing and looting are commonplace here.",
        enemy_count: 20,
        enemies_list: ["废墟虫卒","战场亡魂","废墟追风者","古寒铁石精","暗茸茸战士"],
        enemy_group_size: [2.25,3.25],
        types: [],
        is_unlocked: false, 
        name: "Shenglu City Battlefield - 2",
        rank:152, 
        bgm:11,
        parent_location: locations["声律城战场"],
        first_reward: {
            xp: 270e4,
        },
        repeatable_reward: {
            xp: 90e4,
            locations: [{location: "声律城战场 - 3"}],
            textlines: [{dialogue: "御兰", lines: ["yl1"]}],
        },
    });
    locations["声律城战场 - 3"] = new Combat_zone({
        description: "The battlefield outside Shenglu City, destroyed by the D9 spaceship. Killing and looting are commonplace here.",
        enemy_count: 20,
        enemies_list: ["古寒铁石精","暗茸茸战士","魔族潜行者","魔族潜行者","圣荒城骑士","战场凶残暴徒"],
        enemy_group_size: [2.5,3.5],
        types: [],
        is_unlocked: false, 
        name: "Shenglu City Battlefield - 3",
        rank:153, 
        bgm:11,
        parent_location: locations["声律城战场"],
        first_reward: {
            xp: 300e4,
        },
        repeatable_reward: {
            xp: 100e4,
            locations: [{location: "声律城战场 - 4"}],
            textlines: [{dialogue: "皎月神像", lines: ["jy1"]}],
        },
    });
    locations["声律城战场 - 4"] = new Combat_zone({
        description: "The battlefield outside Shenglu City, destroyed by the D9 spaceship. Killing and looting are commonplace here.",
        enemy_count: 20,
        enemies_list: ["圣荒城骑士","战场凶残暴徒","探险者队长","废墟荒兽","哥布林盾兵"],
        enemy_group_size: [2.75,3.75],
        types: [],
        is_unlocked: false, 
        name: "Shenglu City Battlefield - 4",
        rank:154, 
        bgm:11,
        parent_location: locations["声律城战场"],
        first_reward: {
            xp: 360e4,
        },
        repeatable_reward: {
            xp: 120e4,
            activities: [{location:"声律城战场", activity:"mining50kGem"}],
            locations: [{location: "声律城战场 - 5"}],
        },
    });
    locations["声律城战场 - 5"] = new Combat_zone({
        description: "The battlefield outside Shenglu City, destroyed by the D9 spaceship. Killing and looting are commonplace here.",
        enemy_count: 20,
        enemies_list: ["战场复苏骸骨","探险者队长","哥布林盾兵","鎏银幽灵","血洛老年修士"],
        enemy_group_size: [3,3],
        types: [],
        is_unlocked: false, 
        name: "Shenglu City Battlefield - 5",
        rank:155, 
        enemy_stat_halo:0.2,
        bgm:11,
        parent_location: locations["声律城战场"],
        first_reward: {
            xp: 450e4,
        },
        repeatable_reward: {
            xp: 150e4,
            locations: [{location: "声律城战场 - X"}],
        },
    });

    
    locations["声律城战场 - X"] = new Challenge_zone({
        description: "Ahead is the goal of this journey - the [B9 Spaceship]. However, there's a large blue robot blocking the way.",
        enemy_count: 1, 
        enemies_list : [["初级卫兵A9[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Shenglu City Battlefield - X",
        bgm:11,
        parent_location: locations["声律城战场"],
        repeatable_reward: {
            locations: [{location: "天外飞船" }],
        },
        spec_hint: "[Sayuki] The core of [Scattered Bloom]'s insight is weakening attacks based on the ratio of health. To break through, simply increase your max health, or deal forced damage.",
        unlock_text: "That blue thing's strength and speed... is already comparable to the Dungeon Cultivator from before. I must be fully prepared before going over there.",
    });

    locations["声律城战场"].connected_locations.push({location: locations["声律城战场 - 1"]});
    locations["声律城战场"].connected_locations.push({location: locations["声律城战场 - 2"]});
    locations["声律城战场"].connected_locations.push({location: locations["声律城战场 - 3"]});
    locations["声律城战场"].connected_locations.push({location: locations["声律城战场 - 4"]});
    locations["声律城战场"].connected_locations.push({location: locations["声律城战场 - 5"]});
    locations["声律城战场"].connected_locations.push({location: locations["声律城战场 - X"],custom_text:"Challenge the massive blue colossus"});
    locations["天外飞船"] = new Location({ 
        connected_locations: [{location: locations["声律城战场"], custom_text: "Leave this spaceship for now"}],
        description: "The ultimate goal of the Shenglu City journey. It may contain treasures rare even on the Blood-Luo continent, yet everywhere it radiates hostility and killing intent toward outsiders.",
        name: "Outer-Space Spaceship",
        traders: ["Airship Market"],
        dialogues: ["纳娜米(飞船)","核心反应堆"],
        is_unlocked: false,
        bgm: 12,
    });//2-7
    locations["声律城战场"].connected_locations.push({location: locations["天外飞船"]});


    locations["天外飞船 - 1"] = new Combat_zone({
        description: "The interior of the B9-class spaceship. Some kind of suppression field makes outsiders feel quite uncomfortable.",
        enemy_count: 20, 
        types: [{type: "stress", stage: 1, xp_gain: 1}],
        enemies_list: ["鎏银幽灵","探险者队长","初级卫兵A9","领域之械A9","荒兽电法兵"],
        enemy_group_size: [2,2],
        is_unlocked: true, 
        name: "Outer-Space Spaceship - 1",
        rank:161, 
        bgm:12,
        parent_location: locations["天外飞船"],
        first_reward: {
            xp: 600e4,
        },
        repeatable_reward: {
            xp: 200e4,
            locations: [{location: "天外飞船 - 2"},{location: "天外飞船 - 右上房间"}],
        },
    });
    locations["天外飞船 - 2"] = new Combat_zone({
        description: "The interior of the B9-class spaceship. Some heavy-duty machines that seem to share a common origin have appeared.",
        enemy_count: 20, 
        types: [{type: "stress", stage: 1, xp_gain: 1}],
        enemies_list: ["荒兽电法兵","黑桃重工A9","夹击之械A9","神权十字A9","梅花重工A9"],
        enemy_group_size: [2.25,3.25],
        is_unlocked: false, 
        name: "Outer-Space Spaceship - 2",
        rank:162, 
        bgm:12,
        parent_location: locations["天外飞船"],
        first_reward: {
            xp: 900e4,
        },
        repeatable_reward: {
            xp: 300e4,
            locations: [{location: "天外飞船 - 3"}],
        },
    });
    locations["天外飞船 - 3"] = new Combat_zone({
        description: "The interior of the B9-class spaceship. There seems to be a traitor mixed in!",
        enemy_count: 20, 
        types: [{type: "stress", stage: 1, xp_gain: 1}],
        enemies_list: ["梅花重工A9","古老符文","生命熔炉A9","血洛游侠","白银之锋A9"],
        enemy_group_size: [2.5,3.5],
        enemy_stat_halo: -0.1,
        is_unlocked: false,
        name: "Outer-Space Spaceship - 3",
        rank:163, 
        bgm:12,
        parent_location: locations["天外飞船"],
        first_reward: {
            xp: 1200e4,
        },
        repeatable_reward: {
            xp: 400e4,
            locations: [{location: "天外飞船 - 4"},{location: "天外飞船 - 歧路"}],
        },
    });
    locations["天外飞船 - 4"] = new Combat_zone({
        description: "The interior of the B9-class spaceship. All the biggest enemies are in floor -5...",
        enemy_count: 20, 
        types: [{type: "stress", stage: 1, xp_gain: 1}],
        enemies_list: ["白银之锋A9","持盾战士A9","红桃重工B1","燕岗狂战傀儡","激光炮塔A9"],
        enemy_group_size: [2.75,3.75],
        is_unlocked: false,
        name: "Outer-Space Spaceship - 4",
        rank:164, 
        bgm:12,
        parent_location: locations["天外飞船"],
        first_reward: {
            xp: 1500e4,
        },
        repeatable_reward: {
            xp: 500e4,
            locations: [{location: "天外飞船 - 5"}],
            textlines: [{dialogue: "纳娜米(飞船)", lines: ["nnm1"]}],
        },
    });
    locations["天外飞船 - 5"] = new Combat_zone({
        description: "The interior of the B9-class spaceship. Watch out for the 416 416 416 Black Iron Warrior!",
        enemy_count: 20, 
        types: [{type: "stress", stage: 1, xp_gain: 1}],
        enemies_list: ["方片重工A9","血洛游侠","舰船护卫A9","高级卫兵B1","黑铁战士B1"],
        enemy_group_size: [3,3],
        is_unlocked: false,
        name: "Outer-Space Spaceship - 5",
        rank:165, 
        bgm:12,
        parent_location: locations["天外飞船"],
        first_reward: {
            xp: 1800e4,
        },
        repeatable_reward: {
            xp: 600e4,
            locations: [{location: "天外飞船 - X"}],
        },
    });
    
    locations["天外飞船 - 右上房间"] = new Challenge_zone({
        description: "Wait, if I'm not seeing things, that guy in the top right is...!",
        enemy_count: 1, 
        enemies_list : [["百方[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Outer-Space Spaceship - Top-Right Room",
        bgm:12,
        parent_location: locations["天外飞船"],
        repeatable_reward: {
        },
        unlock_text: "Hmph, Young Master Baifang? What a small world. Running into you here of all places... it's time to make you pay!",
    });
    
    locations["天外飞船 - 歧路"] = new Challenge_zone({
        description: "There's a Sky Rank robot blocking the way here! But the gem behind it looks really big...",
        enemy_count: 1, 
        enemies_list : [["空间三角B1[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Outer-Space Spaceship - Crossroads",
        bgm:12,
        parent_location: locations["天外飞船"],
        repeatable_reward: {
            traders: [{traders:"Airship Market"}],
        },
        unlock_text: "Legend has it that beyond here is where the spaceship adventurers hold their exchange meet... I need to think of a way to defeat that blue thing!",
    });
    
    locations["天外飞船 - X"] = new Challenge_zone({
        description: "Too much story to write here right now... come to think of it, memory is so expensive, this Storage Unit B1 must be worth a lot.",
        enemy_count: 1, 
        enemies_list : [["储存姬B1[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Outer-Space Spaceship - X",
        bgm:12,
        parent_location: locations["天外飞船"],
        repeatable_reward: {
            locations: [{location: "飞船核心"}],
        },
        unlock_text: "Coo! Coo coo!",
    });
    locations["天外飞船"].connected_locations.push({location: locations["天外飞船 - 1"]});
    locations["天外飞船"].connected_locations.push({location: locations["天外飞船 - 2"]});
    locations["天外飞船"].connected_locations.push({location: locations["天外飞船 - 3"]});
    locations["天外飞船"].connected_locations.push({location: locations["天外飞船 - 4"]});
    locations["天外飞船"].connected_locations.push({location: locations["天外飞船 - 5"]});
    locations["天外飞船"].connected_locations.push({location: locations["天外飞船 - 歧路"]});
    locations["天外飞船"].connected_locations.push({location: locations["天外飞船 - 右上房间"]});
    locations["天外飞船"].connected_locations.push({location: locations["天外飞船 - X"]});


    locations["飞船核心"] = new Location({ 
        connected_locations: [{location: locations["天外飞船"], custom_text: "Leave the core area for now"}],
        description: "The core section of the outer-space spaceship. Oppressive aura fills the air, yet it contains an opportunity to reach Sky Rank.",
        name: "Spaceship Core",
        is_unlocked: false,
        bgm: 13,
        unlock_text: "I imagine we've entered the core domain. The path ahead is probably filled with powerful technological constructs.",
    });//2-8
    locations["天外飞船"].connected_locations.push({location: locations["飞船核心"]});

    locations["飞船核心 - 1"] = new Combat_zone({
        description: "The core of the B9-class spaceship. The suppression field is even more powerful; B1-class machinery is everywhere.",
        enemy_count: 20, 
        types: [{type: "stress", stage: 2, xp_gain: 2}],
        enemies_list: ["塔门战甲B1","万象天引B1","万象天引B1","镭射步兵B1","空间三角B1"],
        enemy_group_size: [2,2],
        is_unlocked: true, 
        name: "Spaceship Core - 1",
        rank:171, 
        bgm:13,
        parent_location: locations["飞船核心"],
        first_reward: {
            xp: 1200e4,
        },
        repeatable_reward: {
            xp: 4800e4,
            locations: [{location: "飞船核心 - 2"},{location: "飞船核心 - 左上房间"}],
        },
    });
    locations["飞船核心 - 2"] = new Combat_zone({
        description: "The core of the B9-class spaceship. The suppression field is even more powerful. Experience resisting the suppression field is accumulating faster and faster.",
        enemy_count: 20, 
        types: [{type: "stress", stage: 2, xp_gain: 4}],
        enemies_list: ["镭射步兵B1","空间三角B1","异化者B1","核爆能源","剧毒恐怖B1"],
        enemy_group_size: [2.5,3.5],
        is_unlocked: false, 
        name: "Spaceship Core - 2",
        rank:172, 
        bgm:13,
        parent_location: locations["飞船核心"],
        first_reward: {
            xp: 2400e4,
        },
        repeatable_reward: {
            xp: 800e4,
            locations: [{location: "飞船核心 - 3"},{location: "飞船宿舍"}],
        },
    });
    locations["飞船核心 - 3"] = new Combat_zone({
        description: "The core of the B9-class spaceship. Machinery and wild beasts coexist, and you can smell the faint fragrance of evolution crystals.",
        enemy_count: 20, 
        types: [{type: "stress", stage: 2, xp_gain: 8}],
        enemies_list: ["核爆能源","剧毒恐怖B1","黄金茸茸","银色血眼B1","游走三头蛇"],
        enemy_group_size: [3,3],
        is_unlocked: false, 
        name: "Spaceship Core - 3",
        rank:173, 
        bgm:13,
        parent_location: locations["飞船核心"],
        first_reward: {
            xp: 3600e4,
        },
        repeatable_reward: {
            xp: 1200e4,
            locations: [{location: "飞船核心 - 4"},{location: "飞船核心 - 下方房间"}],
        },
    });
    locations["飞船核心 - 4"] = new Combat_zone({
        description: "The core of the B9-class spaceship. Machinery and wild beasts coexist, and a dangerous aura is not far away.",
        enemy_count: 20, 
        types: [{type: "stress", stage: 2, xp_gain: 16}],
        enemies_list: ["银色血眼B1","游走三头蛇","质子粉碎机B1","城主府基层","深邃之暗B2"],
        enemy_group_size: [3.5,4.5],
        is_unlocked: false, 
        name: "Spaceship Core - 4",
        rank:174, 
        bgm:13,
        parent_location: locations["飞船核心"],
        first_reward: {
            xp: 4800e4,
        },
        repeatable_reward: {
            xp: 1600e4,
            locations: [{location: "飞船核心 - 5"}],
        },
    });
    locations["飞船核心 - 5"] = new Combat_zone({
        description: "This is the place! Charge forward! No need to linger - this area is full of B1-class specialized machinery even more terrifying than B2!",
        enemy_count: 10, 
        types: [{type: "stress", stage: 2, xp_gain: 32}],
        enemies_list: ["城主府基层","深邃之暗B2","鲜血之锋B1","光子石像B1","合金弹头B1"],
        enemy_group_size: [4,4],
        is_unlocked: false, 
        name: "Spaceship Core - 5",
        rank:175, 
        bgm:13,
        parent_location: locations["飞船核心"],
        first_reward: {
            xp: 4800e4,
        },
        repeatable_reward: {
            xp: 1600e4,
            locations: [{location: "飞船核心 - X"}],
        },
    });
    locations["飞船核心 - 左上房间"] = new Challenge_zone({
        description: "Two mechanical constructs seemingly guarding some kind of cultivation technique.",
        enemy_count: 1, 
        enemies_list : [["质子粉碎机B1[BOSS]"]],
        enemy_group_size: [2,2],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Spaceship Core - Top-Left Room",
        bgm:13,
        parent_location: locations["飞船核心"],
        repeatable_reward: {
            money:11038,
        },
    });
    locations["飞船核心 - 下方房间"] = new Challenge_zone({
        description: "A room behind the red door with a dense evolutionary aura. It seems someone has conducted experiments here.",
        enemy_count: 1, 
        enemies_list : [["银色血眼B1[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Spaceship Core - Lower Room",
        bgm:13,
        parent_location: locations["飞船核心"],
        repeatable_reward: {
            money:11037,
        },
        unlock_text: "[Nanami] Do you feel it, Koko? The energy nearby is a bit restless, seeming to revolve around some center.",
    });
    locations["飞船宿舍"] = new Location({
        connected_locations: [{location: locations["飞船核心"], custom_text: "Return to the Spaceship Core"}],
        description: "Lucky for those who didn't buy the rune workbench! Outer-space technology - both the energy-gathering arrays and workbenches are a tier better than the Rune House.",
        name: "Spaceship Dormitory",
        is_unlocked: false,
        bgm: 13,
        traders: ["Storage Chest"],
        sleeping: {
            text: "Use the outer-space energy-gathering array [+250,000XP/s]",
            xp: 500
        },
            crafting: {
                is_unlocked: true,
                use_text: "Use the outer-space Workbench [Tier+10]",
                tiers: {
                    crafting: 10,
                    forging: 10,
                    smelting: 10,
                    cooking: 10,
                    alchemy: 10,
                }
            },
        
    })
    locations["飞船核心 - X"] = new Challenge_zone({
        description: "Alert! Alert! Unknown origin lifeforms have reached the core area! Activating primary combat hub, executing emergency sweep protocol -",
        enemy_count: 1, 
        enemies_list : [["舰船中枢B6[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Spaceship Core - X",
        bgm:13,
        parent_location: locations["飞船核心"],
        repeatable_reward: {
            locations: [{location: "赫尔沼泽入口"}],
        },
    });

    locations["飞船核心"].connected_locations.push({location: locations["飞船核心 - 1"]});
    locations["飞船核心"].connected_locations.push({location: locations["飞船核心 - 2"]});
    locations["飞船核心"].connected_locations.push({location: locations["飞船核心 - 3"]});
    locations["飞船核心"].connected_locations.push({location: locations["飞船核心 - 4"]});
    locations["飞船核心"].connected_locations.push({location: locations["飞船核心 - 5"]});
    locations["飞船核心"].connected_locations.push({location: locations["飞船核心 - 下方房间"]});
    locations["飞船核心"].connected_locations.push({location: locations["飞船核心 - 左上房间"]});
    locations["飞船核心"].connected_locations.push({location: locations["飞船宿舍"]});
    locations["飞船核心"].connected_locations.push({location: locations["飞船核心 - X"]});

    locations["赫尔沼泽入口"] = new Location({ 
        connected_locations: [{location: locations["飞船核心"], custom_text: "Return to the Spaceship Core area"},{location: locations["荒兽森林营地"], custom_text: "Fast Travel - Act 2"}],
        description: "After the outer-space spaceship triggered the [Beast Tide], the outskirts of the beast-tide's spreading zone.",
        dialogues: ["纳布(沼泽)","结界湖转化器"],
        name: "Hel Swamp Entrance",
        is_unlocked: false,
        bgm: 14,
        unlock_text: "Two years later. Yangang Territory. The Hel Swamp.",
    });//3-1pre
    locations["飞船核心"].connected_locations.push({location: locations["赫尔沼泽入口"]});

    locations["荒兽森林营地"].connected_locations.push({location: locations["赫尔沼泽入口"],custom_text:"Fast Travel - Act 3"});
    locations["赫尔沼泽"] = new Location({ 
        connected_locations: [{location: locations["赫尔沼泽入口"], custom_text: "Return to the safe zone in the swamp"}],
        description: "After the outer-space spaceship triggered the [Beast Tide], a Sky Rank wild beast gathering ground in the beast-tide spreading zone.",
        name: "Hel Swamp",
        is_unlocked: false,
        bgm: 14,
    });//3-1
    locations["赫尔沼泽 - 1"] = new Combat_zone({
        description: "The swamp swept by the [Beast Tide]. Beast kings above the Ascendant Rank have been cleared, but early Sky Rank wild beasts are still quite common.",
        enemy_count: 20,
        enemies_list: ["无面修者","大教掌灯人","单眼蝠幼体","淳羽家族近卫","赫尔沼泽野火"],
        enemy_group_size: [2.5,3.5],
        is_unlocked: true, 
        name: "Hel Swamp - 1",
        rank:201, 
        bgm:14,
        enemy_stat_halo:0.01,
        parent_location: locations["赫尔沼泽"],
        first_reward: {
            xp: 3e8,
        },
        repeatable_reward: {
            xp: 1e8,
            locations: [{location: "赫尔沼泽 - 2"}],
        },
    });
    locations["赫尔沼泽 - 2"] = new Combat_zone({
        description: "The swamp swept by the [Beast Tide]. Beast kings above the Ascendant Rank have been cleared, but early Sky Rank wild beasts are still quite common.",
        enemy_count: 20,
        enemies_list: ["地龙成长期","圣荒杀手傀儡","小门派供奉","化灵蝶","沼泽石灵"],
        enemy_group_size: [3,3],
        is_unlocked: false, 
        name: "Hel Swamp - 2",
        rank:202, 
        bgm:14,
        enemy_stat_halo:0.01,
        parent_location: locations["赫尔沼泽"],
        first_reward: {
            xp: 6e8,
        },
        repeatable_reward: {
            xp: 2e8,
            locations: [{location: "赫尔沼泽 - 3"}],
        },
    });
    locations["赫尔沼泽 - 3"] = new Combat_zone({
        description: "The swamp swept by the [Beast Tide]. Beast kings above the Ascendant Rank have been cleared, but early Sky Rank wild beasts are still quite common.",
        enemy_count: 20,
        enemies_list: ["冈崎猫妖","沉陷死者","赫尔沼泽飞鼠","赫尔沼泽蝠","不瞑之目"],
        enemy_group_size: [3.5,4.5],
        is_unlocked: false, 
        name: "Hel Swamp - 3",
        rank:203, 
        bgm:14,
        enemy_stat_halo:0.01,
        parent_location: locations["赫尔沼泽"],
        first_reward: {
            xp: 9e8,
        },
        repeatable_reward: {
            xp: 3e8,
            locations: [{location: "赫尔沼泽 - 4"}],
        },
    });
    locations["赫尔沼泽 - 4"] = new Combat_zone({
        description: "The swamp swept by the [Beast Tide]. Beast kings above the Ascendant Rank have been cleared, but early Sky Rank wild beasts are still quite common.",
        enemy_count: 20,
        enemies_list: ["兰陵天空骑士","大教外门弟子","燕岗精英佣兵","凌空级魔法师","飞龙成长期"],
        enemy_group_size: [4,4],
        is_unlocked: false, 
        name: "Hel Swamp - 4",
        rank:204, 
        bgm:14,
        enemy_stat_halo:0.01,
        parent_location: locations["赫尔沼泽"],
        first_reward: {
            xp: 12e8,
        },
        repeatable_reward: {
            xp: 4e8,
            locations: [{location: "赫尔沼泽 - X"}],
        },
    });
    locations["赫尔沼泽 - X"] = new Challenge_zone({
        description: "The Yangang elite mercenaries accepted Baifang's commission and lured Neko here. However, danger can sometimes be an opportunity in disguise.",
        enemy_count: 1, 
        enemies_list : [["魅影幻姬[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Hel Swamp - X",
        bgm:14,
        parent_location: locations["赫尔沼泽"],
        repeatable_reward: {
            locations: [{location: "黑暗森林"}],
        },
        unlock_text : "[Yangang Elite Mercenary x2] Monster... don't come any closer!"
    });
    locations["赫尔沼泽入口"].connected_locations.push({location: locations["赫尔沼泽"]});
    locations["赫尔沼泽"].connected_locations.push({location: locations["赫尔沼泽 - 1"]});
    locations["赫尔沼泽"].connected_locations.push({location: locations["赫尔沼泽 - 2"]});
    locations["赫尔沼泽"].connected_locations.push({location: locations["赫尔沼泽 - 3"]});
    locations["赫尔沼泽"].connected_locations.push({location: locations["赫尔沼泽 - 4"]});
    locations["赫尔沼泽"].connected_locations.push({location: locations["赫尔沼泽 - X"]});
    locations["黑暗森林"] = new Location({ 
        connected_locations: [{location: locations["赫尔沼泽"], custom_text: "Return to the Hel Swamp"}],
        description: "A dark, overcast forest. Neko has lost her way here, and there seems to be no sign of human life around.",
        name: "Dark Forest",
        dialogues: ["峰"],
        is_unlocked: false,
        bgm: 15,
        unlock_text : "In novels, something bad always happens in these sinister-looking places. Wuu... I need to be very careful and slowly find my way back."
    });//3-2

    locations["赫尔沼泽"].connected_locations.push({location: locations["黑暗森林"]});

    locations["黑暗森林 - 1"] = new Combat_zone({
        description: "A dark, overcast forest. But everyone's Night Vision skill should be maxed out by now, right?",
        enemy_count: 20, 
        types: [{type: "dark", stage: 2, xp_gain: 1}],
        enemies_list: ["冈崎猫妖","沼泽石灵","有角族壮年","黑森镔铁战士","黑森异惑之花"],
        enemy_group_size: [2.5,3.5],
        is_unlocked: true, 
        name: "Dark Forest - 1",
        rank:211, 
        bgm:15,
        parent_location: locations["黑暗森林"],
        first_reward: {
            xp: 15e8,
        },
        repeatable_reward: {
            xp: 5e8,
            locations: [{location: "黑暗森林 - 2"}],
        },
    });
    locations["黑暗森林 - 2"] = new Combat_zone({
        description: "A dark, overcast forest. Ominous auras surround you on all sides.",
        enemy_count: 20, 
        types: [{type: "dark", stage: 2, xp_gain: 1}],
        enemies_list: ["黑森异惑之花","黑森骸骨","司雍世界骨干","黑森僵尸茸茸","黑森猿人战士"],
        enemy_group_size: [3,3],
        is_unlocked: false, 
        name: "Dark Forest - 2",
        rank:212, 
        bgm:15,
        parent_location: locations["黑暗森林"],
        first_reward: {
            xp: 18e8,
        },
        repeatable_reward: {
            xp: 6e8,
            locations: [{location: "黑暗森林 - 歧路"}],
        },
    });
    locations["黑暗森林 - 3"] = new Combat_zone({
        description: "A dark, overcast forest. Enemy vitality has risen by a level.",
        enemy_count: 20, 
        types: [{type: "dark", stage: 2, xp_gain: 1}],
        enemies_list: ["黑森猿人战士","怨灵探险者","兰陵城深骑士","黑森蝎龙","黑森猎兵"],
        enemy_group_size: [3.5,4.5],
        is_unlocked: false, 
        name: "Dark Forest - 3",
        rank:213, 
        bgm:15,
        parent_location: locations["黑暗森林"],
        first_reward: {
            xp: 21e8,
        },
        repeatable_reward: {
            xp: 7e8,
            locations: [{location: "黑暗森林 - 4"}],
        },
    });
    locations["黑暗森林 - 4"] = new Combat_zone({
        description: "A dark, overcast forest. With Brother Feng's guidance, the exit is right around the corner.",
        enemy_count: 20, 
        types: [{type: "dark", stage: 2, xp_gain: 1}],
        enemies_list: ["黑森猎兵","石风家族队长","凶悍树妖","人立电法茸茸","嫉妒毒虫"],
        enemy_group_size: [4,4],
        is_unlocked: false, 
        name: "Dark Forest - 4",
        rank:214, 
        bgm:15,
        parent_location: locations["黑暗森林"],
        first_reward: {
            xp: 24e8,
        },
        repeatable_reward: {
            xp: 8e8,
            locations: [{location: "黑暗森林 - X"}],
        },
    });
    locations["黑暗森林 - 歧路"] = new Challenge_zone({
        description: "There's a huge Mangou Beast near the young man eating roasted meat! Hurry and save him!",
        enemy_count: 1, 
        enemies_list : [["蛮咕兽[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Dark Forest - Crossroads",
        bgm:15,
        parent_location: locations["黑暗森林"],
        repeatable_reward: {
            textlines: [{dialogue: "峰", lines: ["lf1"]}],
        },
        unlock_text : "Huh, there's someone up ahead?"
    });

    locations["黑暗森林 - X"] = new Challenge_zone({
        description: "Brother Feng's Moon Wheel Insight - limited time free giveaway! Just beat this ferocious beast!",
        enemy_count: 1, 
        enemies_list : [["天空级凶兽[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "Dark Forest - X",
        bgm:15,
        parent_location: locations["黑暗森林"],
        repeatable_reward: {
            locations: [{location: "飞云阁"}],
            money:216,
        },
        unlock_text : "[Leidong] Ahead is a mutated wild beast - it's probably reached Peak Tier 4."
    });

    locations["黑暗森林"].connected_locations.push({location: locations["黑暗森林 - 1"]});
    locations["黑暗森林"].connected_locations.push({location: locations["黑暗森林 - 2"]});
    locations["黑暗森林"].connected_locations.push({location: locations["黑暗森林 - 3"]});
    locations["黑暗森林"].connected_locations.push({location: locations["黑暗森林 - 4"]});
    locations["黑暗森林"].connected_locations.push({location: locations["黑暗森林 - 歧路"]});
    locations["黑暗森林"].connected_locations.push({location: locations["黑暗森林 - X"]});


    locations["飞云阁"] = new Location({
        connected_locations: [{location: locations["黑暗森林"], custom_text: "Return to the Dark Forest"}],
        description: "A one-stop solution for shopping, sleeping, storage, and crafting. No wonder it's the best inn in the city - it feels like home.",
        name: "Feiyun Pavilion",
        is_unlocked: false,
        bgm: 1,//3-3的bgm是16 这个没打错 就是家里的bgm
        traders: ["Storage Chest","Treasure Pavilion"],
        dialogues: ["峰(飞云)"],
        sleeping: {
            text: "Rest at Feiyun Pavilion [+360,000XP/s]",
            xp: 600
        },
            crafting: {
                is_unlocked: true,
                use_text: "Go to the Refining Tower to craft [Tier+12]",
                tiers: {
                    crafting: 12,
                    forging: 12,
                    smelting: 12,
                    cooking: 12,
                    alchemy: 12,
                }
            },
        
    })//3-3 pre.
    locations["黑暗森林"].connected_locations.push({location: locations["飞云阁"]});


    locations["纯白冰原"] = new Location({ 
        connected_locations: [{location: locations["飞云阁"], custom_text: "Return to Feiyun Pavilion"}],
        description: "A bitterly cold world of ice and snow. The temperature stays around 240K (-33°C), and the ice element permeating the air can spell doom for Earth Rank cultivators.",
        name: "Pure White Arctic Tundra",
        dialogues: ["纳娜米(冰原)","极寒相变引擎","冰霜门户"], // Nanami (Arctic), Extreme Cold Phase Engine, Frost Gate — keys kept Chinese for dialogue system compatibility
        is_unlocked: false,
        bgm: 16,
        unlock_text : "In a silver-white world wrapped in thick snow, two girls stand on the peak of a snow mountain, overlooking the vast white expanse below."
    });//3-3

    locations["飞云阁"].connected_locations.push({location: locations["纯白冰原"]});



    locations["纯白冰原 - 1"] = new Combat_zone({
        description: "A white world made of ice and snow. The ice element makes certain ice-element insights easier to unleash - be careful!",
        enemy_count: 20, 
        enemies_list: ["冰原之痕","出芽茸茸战士","冰原骑士","冰原近卫"],
        enemy_group_size: [1,1],
        is_unlocked: true, 
        name: "Pure White Arctic Tundra - 1",
        rank:221, 
        bgm:16,
        parent_location: locations["纯白冰原"],
        first_reward: {
            xp: 30e8,
        },
        repeatable_reward: {
            xp: 10e8,
            locations: [{location: "纯白冰原 - 2"}],
        },
    });
    locations["纯白冰原 - 2"] = new Combat_zone({
        description: "Make sure to always keep your health in a safe range. Once it drops out of range, the Ice Seal combo...",
        enemy_count: 20, 
        enemies_list: ["天空级死士","冰原出芽茸茸","出芽红茸战士","司雍传道士"],
        enemy_group_size: [2,2],
        is_unlocked: false, 
        name: "Pure White Arctic Tundra - 2",
        rank:222, 
        bgm:16,
        parent_location: locations["纯白冰原"],
        first_reward: {
            xp: 60e8,
        },
        repeatable_reward: {
            xp: 20e8,
            locations: [{location: "纯白冰原 - 3"}],
        },
    });
    locations["纯白冰原 - 3"] = new Combat_zone({
        description: "Ice Seal also comes in different tiers! Being able to block the previous area's level is different from the next area's - it's fine...",
        enemy_count: 20, 
        enemies_list: ["冰原之空骸","掠冰之蝠","霜傀儡","冰原荒兽"],
        enemy_group_size: [3,3],
        is_unlocked: false, 
        name: "Pure White Arctic Tundra - 3",
        rank:223, 
        bgm:16,
        parent_location: locations["纯白冰原"],
        first_reward: {
            xp: 90e8,
        },
        repeatable_reward: {
            xp: 30e8,
            locations: [{location: "纯白冰原 - 4"},{location: "纯白冰原 - 冰霜门户"}],
        },
    });
    locations["纯白冰原 - 4"] = new Combat_zone({
        description: "There should be a Scattered Bloom with 130 million defense here. But since there's no magic-attack potion, it can only be taken away.",
        enemy_count: 20, 
        enemies_list: ["射击卫戍","冰原老人","冰原骸骨骑士","冰山石灵"],
        enemy_group_size: [4,4],
        is_unlocked: false, 
        name: "Pure White Arctic Tundra - 4",
        rank:224, 
        bgm:16,
        parent_location: locations["纯白冰原"],
        first_reward: {
            xp: 120e8,
        },
        repeatable_reward: {
            xp: 40e8,
            locations: [{location: "纯白冰原 - XS"}],
        },
    });
    locations["纯白冰原 - 冰霜门户"] = new Challenge_zone({
        description: "A stone gate ahead, its sides blanketed in ice and snow. Defeat the wrathful creature blocking the way to touch it.",
        enemy_count: 1,
        enemies_list : [["探险者的怨恨[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false,
        is_challenge: true,
        name: "Pure White Arctic Tundra - Frost Gate",
        bgm:16,
        parent_location: locations["纯白冰原"],
        repeatable_reward: {
            textlines: [{dialogue: "冰霜门户", lines: ["bs1"]}],
        },
        unlock_text : "System: Touch the Frost Gate — you may discover something unexpected.",
    });
    locations["纯白冰原 - X"] = new Challenge_zone({
        description: "A stone gate ahead, its sides blanketed in ice and snow. Defeat the wrathful creatures blocking the way to pass through.",
        enemy_count: 1,
        enemy_groups_list : [["敌意女巫[BOSS]","敌意猎兵[BOSS]","敌意猎兵[BOSS]","敌意猎兵[BOSS]","敌意猎兵[BOSS]","敌意猎兵[BOSS]","敌意猎兵[BOSS]"]],
        enemy_group_size: [7,7],
        types: [],
        enemy_stat_halo:0.24,
        is_unlocked: false,
        is_challenge: true,
        name: "Pure White Arctic Tundra - X",
        bgm:16,
        parent_location: locations["纯白冰原"],
        repeatable_reward: {
            locations: [{location: "极寒冰宫"}],
        },
        unlock_text : "[Hunter] Nothing to say — if you really want to apologize, then stay here forever! Kill!",
    });
    locations["纯白冰原 - XS"] = new Challenge_zone({
        description: "A stone gate ahead, its sides blanketed in ice and snow. Defeat the wrathful creatures blocking the way to pass through.",
        enemy_count: 1,
        enemy_groups_list : [["敌意女巫[BOSS]","敌意猎兵[BOSS]","敌意猎兵[BOSS]","敌意猎兵[BOSS]","敌意猎兵[BOSS]","敌意猎兵[BOSS]","敌意猎兵[BOSS]"]],
        enemy_group_size: [7,7],
        types: [],
        enemy_stat_halo:0.24,
        is_unlocked: false,
        is_challenge: true,
        name: "Pure White Arctic Tundra - XS",
        bgm:16,
        parent_location: locations["纯白冰原"],
        repeatable_reward: {
            locations: [{location: "极寒冰宫"}],
        },
        unlock_text : "[Hunter] Nothing to say — if you really want to apologize, then stay here forever! Kill!",
    });

    locations["纯白冰原"].connected_locations.push({location: locations["纯白冰原 - 1"]});
    locations["纯白冰原"].connected_locations.push({location: locations["纯白冰原 - 2"]});
    locations["纯白冰原"].connected_locations.push({location: locations["纯白冰原 - 3"]});
    locations["纯白冰原"].connected_locations.push({location: locations["纯白冰原 - 4"]});
    locations["纯白冰原"].connected_locations.push({location: locations["纯白冰原 - 冰霜门户"]});
    locations["纯白冰原"].connected_locations.push({location: locations["纯白冰原 - X"], custom_text: "Challenge Ice Palace Guardian [old]"});
    locations["纯白冰原"].connected_locations.push({location: locations["纯白冰原 - XS"], custom_text: "Challenge Ice Palace Guardian"});
    
    locations["极寒冰城"] = new Location({
        connected_locations: [{location: locations["极寒冰宫"], custom_text: "Go to [Extreme Cold Ice Palace]"}],
        description: "So sorry — the last character of this location's name was changed... This location was added to prevent cats from falling into the void!",
        name: "Extreme Cold Ice City",
        is_unlocked: true,
        bgm: 17,
    });//3-4(D)
    
    locations["极寒冰宫"] = new Location({
        connected_locations: [{location: locations["纯白冰原"], custom_text: "Return to Pure White Arctic Tundra"}],
        description: "Located at the heart of the Pure White Arctic Tundra, a city built entirely of ice. The witch hoped to keep Nako and Nanami here, not realizing the tables had quietly turned.",
        name: "Extreme Cold Ice Palace",
        traders: ["冰宫商人"],
        dialogues: ["溪月"],
        is_unlocked: false,
        bgm: 17,
        unlock_text : "[Witch] Little outsiders — I expected you to give up and leave, but you actually broke into this ice city.",
    });//3-4
    locations["纯白冰原"].connected_locations.push({location: locations["极寒冰宫"]});
    locations["极寒冰宫 - 1"] = new Combat_zone({
        description: "A city of ice filled with hostility — witches directing raging beasts.",
        enemy_count: 20, 
        enemies_list: ["探险者的怨恨","出芽橙茸战士","敌意猎兵","大眼霜冻鱼","敌意女巫"],
        enemy_group_size: [3,3],
        enemy_stat_halo:0.12,
        is_unlocked: true, 
        name: "Extreme Cold Ice Palace - 1",
        rank:231, 
        bgm:17,
        parent_location: locations["极寒冰宫"],
        first_reward: {
            xp: 150e8,
        },
        repeatable_reward: {
            xp: 50e8,
            locations: [{location: "极寒冰宫 - 2"}],
        },
    });locations["极寒冰宫 - 2"] = new Combat_zone({
        description: "A city of ice filled with hostility — more witches constantly releasing auras over the beasts.",
        enemy_count: 20, 
        enemies_list: ["敌意女巫","出芽黄茸战士","绝对低温能源","敌意骑士","出芽绿茸战士"],
        enemy_group_size: [3,3],
        enemy_stat_halo:0.12,
        is_unlocked: false, 
        name: "Extreme Cold Ice Palace - 2",
        rank:232,
        bgm:17,
        parent_location: locations["极寒冰宫"],
        first_reward: {
            xp: 225e8,
        },
        repeatable_reward: {
            xp: 75e8,
            locations: [{location: "极寒冰宫 - 3"}],
        },
    });locations["极寒冰宫 - 3"] = new Combat_zone({
        description: "A city of ice filled with hostility — the witches have left... even they couldn't control the Ice-Blood Weeders' power.",
        enemy_count: 20, 
        enemies_list: ["冰血除草者","夹击卫戍","敌意傀儡","雪茸茸战士","大教内门弟子","敌意美杜莎"],
        enemy_group_size: [3,3],
        is_unlocked: false, 
        name: "Extreme Cold Ice Palace - 3",
        rank:233,
        bgm:17,
        parent_location: locations["极寒冰宫"],
        first_reward: {
            xp: 300e8,
        },
        repeatable_reward: {
            xp: 100e8,
            locations: [{location: "极寒冰宫 - 4"}],
        },
    });locations["极寒冰宫 - 4"] = new Combat_zone({
        description: "A city of ice filled with hostility — a more central zone... a strange pink-haired girl seems to be nearby! Should you follow her?",
        enemy_count: 20, 
        enemies_list: ["冰兽龙龙","敌意巫师","出芽青茸战士","自爆步兵","敌意老人"],
        enemy_group_size: [3,3],
        is_unlocked: false, 
        name: "Extreme Cold Ice Palace - 4",
        rank:234,
        bgm:17,
        parent_location: locations["极寒冰宫"],
        first_reward: {
            xp: 450e8,
        },
        repeatable_reward: {
            xp: 150e8,
            locations: [{location: "极寒冰宫 - X"}],
        },
    });
    locations["极寒冰宫 - X"] = new Challenge_zone({
        description: "Under the protection of the aura, we shall charge to the death! Graaaaaaaaah!",
        enemy_count: 1,
        enemies_list : [["敌意老人[BOSS]"]],
        enemy_group_size: [4,4],
        types: [],
        is_unlocked: false,
        is_challenge: true,
        enemy_stat_halo:0.50,
        name: "Extreme Cold Ice Palace - X",
        bgm:17,
        parent_location: locations["极寒冰宫"],
        repeatable_reward: {
            textlines: [{dialogue: "溪月", lines: ["xy1"]}],
        },
        unlock_text : "[Hostile Elder] Arrogant outsiders — slaying my kin is a sin punishable by death!"
    });
    locations["极寒冰宫"].connected_locations.push({location: locations["极寒冰宫 - 1"]});
    locations["极寒冰宫"].connected_locations.push({location: locations["极寒冰宫 - 2"]});
    locations["极寒冰宫"].connected_locations.push({location: locations["极寒冰宫 - 3"]});
    locations["极寒冰宫"].connected_locations.push({location: locations["极寒冰宫 - 4"]});
    locations["极寒冰宫"].connected_locations.push({location: locations["极寒冰宫 - X"]});
    locations["时封水牢"] = new Location({
        connected_locations: [{location: locations["极寒冰宫"], custom_text: "Return to Extreme Cold Ice Palace"}],
        description: "A strange realm brimming with water elements. You ended up here after being knocked out by a strange pink-haired girl!",
        name: "Time-Sealed Water Prison",
        dialogues: ["竺虎","莫尔"],
        is_unlocked: false,
        bgm: 18,
        unlock_text : "[Elder] You... are... finished... our master... will... avenge us...",
    });//3-5
    
    locations["极寒冰宫"].connected_locations.push({location: locations["时封水牢"]});

    locations["时封水牢 - I"] = new Challenge_zone({
        description: "There are quite a few mini-bosses in this area — split into zones I through IV!",
        enemy_count: 1,
        enemies_list : [["竺虎[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false,
        is_challenge: true,
        name: "Time-Sealed Water Prison - I",
        bgm:18,
        parent_location: locations["时封水牢"],
        repeatable_reward: {
            textlines: [{dialogue: "竺虎", lines: ["zh5"]}],
        },
    });
    locations["时封水牢 - II"] = new Challenge_zone({
        description: "Mor has a very good temper, and is a good person too... there won't be a kill button.",
        enemy_count: 1,
        enemies_list : [["莫尔[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false,
        is_challenge: true,
        name: "Time-Sealed Water Prison - II",
        bgm:18,
        parent_location: locations["时封水牢"],
        repeatable_reward: {
            textlines: [{dialogue: "莫尔", lines: ["mr6"]}],
        },
    });

    
    locations["时封水牢 - 1"] = new Combat_zone({
        description: "A water prison holding many Sky Rank powerhouses — and home to many [Spirits] useful for accumulating experience.",
        enemy_count: 20,
        enemies_list: ["大门派先锋","水牢雪怪","水牢花妖","成熟期蛟龙","出芽蓝茸战士"],
        enemy_group_size: [4,4],
        is_unlocked: false,
        name: "Time-Sealed Water Prison - 1",
        rank:241, 
        bgm:18,
        parent_location: locations["时封水牢"],
        first_reward: {
            xp: 900e8,
        },
        repeatable_reward: {
            xp: 300e8,
            locations: [{location: "时封水牢 - 2"}],
        },
    });
    locations["时封水牢 - 2"] = new Combat_zone({
        description: "A water prison holding many Sky Rank powerhouses — and home to many [Spirits] useful for accumulating experience.",
        enemy_count: 20,
        enemies_list: ["出芽蓝茸战士","燕岗迷途强者","水牢嗜血哥布林","识灵水藻","徘徊的紫乌"],
        enemy_group_size: [4,4],
        is_unlocked: false,
        name: "Time-Sealed Water Prison - 2",
        rank:242, 
        bgm:18,
        parent_location: locations["时封水牢"],
        first_reward: {
            xp: 1200e8,
        },
        repeatable_reward: {
            xp: 400e8,
            locations: [{location: "时封水牢 - 3"}],
        },
    });
    locations["时封水牢 - 3"] = new Combat_zone({
        description: "A water prison holding many Sky Rank powerhouses — and home to many [Spirits] useful for accumulating experience.",
        enemy_count: 20,
        enemies_list: ["徘徊的紫乌","夜巡傀儡","水猫茸茸","徘徊的骸骨","水牢骨角茸茸"],
        enemy_group_size: [4,4],
        is_unlocked: false,
        name: "Time-Sealed Water Prison - 3",
        enemy_stat_halo: 0.06,
        rank:243, 
        bgm:18,
        parent_location: locations["时封水牢"],
        first_reward: {
            xp: 1500e8,
        },
        repeatable_reward: {
            xp: 500e8,
            textlines: [{dialogue: "莫尔", lines: ["mr1"]}],
            locations: [{location: "水牢深处"},{location: "水牢洞府"}],
        },
    });
    locations["时封水牢"].connected_locations.push({location: locations["时封水牢 - I"]});
    locations["时封水牢"].connected_locations.push({location: locations["时封水牢 - II"]});
    locations["时封水牢"].connected_locations.push({location: locations["时封水牢 - 1"]});
    locations["时封水牢"].connected_locations.push({location: locations["时封水牢 - 2"]});
    locations["时封水牢"].connected_locations.push({location: locations["时封水牢 - 3"]});

    
    locations["水牢洞府"] = new Location({
        connected_locations: [{location: locations["时封水牢"], custom_text: "Return to the Water Prison to fight"}],
        description: "A cave dwelling \"voluntarily\" vacated by a Power Rankings expert after hearing of the Nako sisters' combat record.",
        name: "Water Prison Cave Dwelling",
        is_unlocked: false,
        bgm: 18,
        traders: ["物品存储箱"],
        sleeping: {
            text: "Cultivate in the Water Prison Cave Dwelling [+0.36M XP/s]",
            xp: 6000
        },
            crafting: {
                is_unlocked: true,
                use_text: "Use Smelting Formation [Tier+14]",
                tiers: {
                    crafting: 14,
                    forging: 14,
                    smelting: 14,
                    cooking: 14,
                    alchemy: 14,
                }
            },
        
    })
    
    locations["时封水牢"].connected_locations.push({location: locations["水牢洞府"]});

    
    
    locations["水牢深处"] = new Location({
        connected_locations: [{location: locations["时封水牢"], custom_text: "Return to Time-Sealed Water Prison"}],
        description: "A realm brimming with water elements. Set out from here to challenge Power Rankings experts!",
        name: "Water Prison Depths",
        dialogues: ["秋兴","蓝柒"],
        is_unlocked: false,
        bgm: 18,
    });//3-5II
    locations["时封水牢"].connected_locations.push({location: locations["水牢深处"]});

    locations["时封水牢 - 4"] = new Combat_zone({
        description: "A water prison holding many Sky Rank powerhouses. Set out from here to reach the residences of Power Rankings experts.",
        enemy_count: 20, 
        enemies_list: ["水牢石灵","仙旅城强战士","城主府骨干","火箭卫戍","小门派长老"],
        enemy_group_size: [4,4],
        is_unlocked: true, 
        name: "时封水牢 - 4",
        rank:244, 
        bgm:18,
        parent_location: locations["水牢深处"],
        first_reward: {
            xp: 1800e8,
        },
        repeatable_reward: {
            xp: 600e8,
            textlines: [{dialogue: "秋兴", lines: ["qx1"]}],
        },
    });
    locations["时封水牢 - 5"] = new Combat_zone({
        description: "A water prison holding many Sky Rank powerhouses. Set out from here to reach the residences of Power Rankings experts.",
        enemy_count: 20, 
        enemies_list: ["小门派长老","水牢幽暗人形","出芽紫茸战士","星月幻术师","绿皮怪物"],
        enemy_group_size: [4,4],
        is_unlocked: false, 
        name: "时封水牢 - 5",
        rank:245, 
        enemy_stat_halo: 0.10,
        bgm:18,
        parent_location: locations["水牢深处"],
        first_reward: {
            xp: 2400e8,
        },
        repeatable_reward: {
            xp: 800e8,
            textlines: [{dialogue: "蓝柒", lines: ["lq1"]}],
            locations: [{location: "时封水牢 - 6"}],
        },
    });
    locations["时封水牢 - 6"] = new Combat_zone({
        description: "A water prison holding many Sky Rank powerhouses. The shore where the water ends is drawing ever closer.",
        enemy_count: 20, 
        enemies_list: ["星月幻术师","魔化枭蝎","古龙幼崽","血杀殿余孽","城主府骨干"],
        enemy_group_size: [4,4],
        is_unlocked: false, 
        name: "时封水牢 - 6",
        rank:246, 
        enemy_stat_halo: 0.10,
        bgm:18,
        parent_location: locations["水牢深处"],
        first_reward: {
            xp: 3000e8,
        },
        repeatable_reward: {
            xp: 1000e8,
            locations: [{location: "时封水牢 - X"}],
        },
    });
    
    locations["时封水牢 - III"] = new Challenge_zone({
        description: "Defeat her to unlock Time-Sealed Water Prison - 5!",
        enemy_count: 1, 
        enemies_list : [["秋兴[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "时封水牢 - III",
        bgm:18,
        parent_location: locations["水牢深处"],
        repeatable_reward: {
            locations: [{location: "时封水牢 - 5"}],
            textlines: [{dialogue: "秋兴", lines: ["qx5"]}],
        },
    });
    locations["时封水牢 - IV"] = new Challenge_zone({
        description: "Defeat her to... get three legendary rubies?",
        enemy_count: 1, 
        enemies_list : [["蓝柒[放水 ver.][BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "时封水牢 - IV",
        bgm:18,
        parent_location: locations["水牢深处"],
        repeatable_reward: {
            textlines: [{dialogue: "蓝柒", lines: ["lq5"]}],
        },
    });
    locations["时封水牢 - X"] = new Challenge_zone({
        description: "Defeat her to escape the Water Prison!",
        enemy_count: 1, 
        enemies_list : [["蓝柒[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "时封水牢 - X",
        bgm:18,
        parent_location: locations["水牢深处"],
        repeatable_reward: {
            textlines: [{dialogue: "蓝柒", lines: ["lq7"]}],
        },
    });


    locations["水牢深处"].connected_locations.push({location: locations["时封水牢 - 4"]});    
    locations["水牢深处"].connected_locations.push({location: locations["时封水牢 - 5"]});    
    locations["水牢深处"].connected_locations.push({location: locations["时封水牢 - 6"]});
    locations["水牢深处"].connected_locations.push({location: locations["时封水牢 - III"]});  
    locations["水牢深处"].connected_locations.push({location: locations["时封水牢 - IV"]});  
    locations["水牢深处"].connected_locations.push({location: locations["时封水牢 - X"]});  


    
    locations["水牢走廊"] = new Location({
        connected_locations: [{location: locations["时封水牢"], custom_text: "Return to Time-Sealed Water Prison"}],
        description: "You've left the bounds of the Time-Sealed Water Prison... Wait! That pink-haired girl!",
        name: "Water Prison Corridor",
        dialogues: ["溪月 II"],
        is_unlocked: false,
        bgm: 19,
    });//3-5III
    locations["水牢深处"].connected_locations.push({location: locations["水牢走廊"]});  

    locations["传承幻境"] = new Location({
        connected_locations: [{location: locations["时封水牢"], custom_text: "Return to Time-Sealed Water Prison"}],
        description: "A space radiating five-colored radiance, surrounded by many wild beasts of similar strength(?). Awakened — time to hunt!",
        dialogues: ["传承水晶"],
        traders: ["窥秘商人"],
        name: "Heritage Illusory Realm",
        is_unlocked: false,
        bgm: 19,
    });//3-6
    locations["水牢走廊"].connected_locations.push({location: locations["传承幻境"]});  


    locations["传承幻境 - 1"] = new Combat_zone({
        description: "A space radiating five-colored radiance. Whatever Zuo'a ultimately wants, at least there are genuinely many breakthrough opportunities here.",
        enemy_count: 20, 
        enemies_list: ["奇异菇菇","幻境掌灯人","蓝皮怪物","幻境通识者","幻境翠绿行者"],
        enemy_group_size: [2.5,3.5],
        is_unlocked: true, 
        name: "传承幻境 - 1",
        rank:251, 
        bgm:19,
        parent_location: locations["传承幻境"],
        first_reward: {
            xp: 3600e8,
        },
        repeatable_reward: {
            xp: 1200e8,
            locations: [{location: "传承幻境 - 2"}],
        },
    });
    locations["传承幻境 - 2"] = new Combat_zone({
        description: "A space radiating five-colored radiance. Whatever Zuo'a ultimately wants, at least there are genuinely many breakthrough opportunities here.",
        enemy_count: 20, 
        enemies_list: ["幻境翠绿行者","幻境飞蛾","风尘的窃贼","深邃级魔法师","荒野守尸人"],
        enemy_group_size: [3,3],
        is_unlocked: false, 
        name: "传承幻境 - 2",
        rank:252, 
        bgm:19,
        parent_location: locations["传承幻境"],
        first_reward: {
            xp: 4200e8,
        },
        repeatable_reward: {
            xp: 1400e8,
            locations: [{location: "传承幻境 - 3"},{location: "传承幻境 - 水晶空间"}],
        },
    });
    locations["传承幻境 - 3"] = new Combat_zone({
        description: "A space radiating five-colored radiance. Whatever Zuo'a ultimately wants, at least there are genuinely many breakthrough opportunities here.",
        enemy_count: 20, 
        enemies_list: ["火烈茸茸","幻境火蝶","出芽粉茸战士","凶恶的金乌","幻境血魔"],
        enemy_group_size: [3.5,4.5],
        is_unlocked: false, 
        name: "传承幻境 - 3",
        rank:253, 
        bgm:19,
        parent_location: locations["传承幻境"],
        first_reward: {
            xp: 4800e8,
        },
        repeatable_reward: {
            xp: 1600e8,
            locations: [{location: "传承幻境 - 4"}],
            traders: [{traders:"窥秘商人"}],
        },
    });
    locations["传承幻境 - 4"] = new Combat_zone({
        description: "A space radiating five-colored radiance. Whatever Zuo'a ultimately wants, at least there are genuinely many breakthrough opportunities here.",
        enemy_count: 20, 
        enemies_list: ["幻境血魔","窥秘商人","燕岗领独行侠","幻境石灵","磐石蜘蛛"],
        enemy_group_size: [4,4],
        is_unlocked: false, 
        name: "传承幻境 - 4",
        rank:254, 
        bgm:19,
        parent_location: locations["传承幻境"],
        first_reward: {
            xp: 5400e8,
        },
        repeatable_reward: {
            xp: 1800e8,
            locations: [{location: "传承幻境 - ?"},{location: "传承幻境 - X"}],
        },
    });

    locations["传承幻境"].connected_locations.push({location: locations["传承幻境 - 1"]});
    locations["传承幻境"].connected_locations.push({location: locations["传承幻境 - 2"]});
    locations["传承幻境"].connected_locations.push({location: locations["传承幻境 - 3"]});
    locations["传承幻境"].connected_locations.push({location: locations["传承幻境 - 4"]});    

    locations["传承幻境 - 水晶空间"] = new Challenge_zone({
        description: "Defeat the sentient Monster Manual to obtain Five-Colored Crystals — and of course, Stargazing Purple Jade.",
        enemy_count: 1, 
        enemies_list : [["怪物手册[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "传承幻境 - 水晶空间",
        bgm:19,
        parent_location: locations["传承幻境"],
        repeatable_reward: {
            textlines: [{dialogue: "传承水晶", lines: ["sj1"]}],
        },
    });
    locations["传承幻境"].connected_locations.push({location: locations["传承幻境 - 水晶空间"]});   
    
    
    locations["传承幻境 - ?"] = new Challenge_zone({
        description: "Test to see if damage is working correctly! (It's totally not because Shaxue's save file is still at 3-5 and I can't test there. That's definitely not why this map is here.)",
        enemy_count: 1, 
        enemies_list : [["心魔木偶[SP]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "传承幻境 - ?",
        bgm:19,
        parent_location: locations["传承幻境"],
        repeatable_reward: {
        },
    });
    locations["传承幻境"].connected_locations.push({location: locations["传承幻境 - ?"]});   
    locations["传承幻境 - X"] = new Challenge_zone({
        description: "If you can't beat it, go consume two Restraint Books! Maybe there are other tricks up your sleeve?",
        enemy_count: 1, 
        enemies_list : [["心魔[BOSS]"]],
        enemy_group_size: [4,4],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "传承幻境 - X",
        bgm:19,
        parent_location: locations["传承幻境"],
        repeatable_reward: {
            locations: [{location: "幻境核心·地宫"}],
        },
    });
    locations["传承幻境"].connected_locations.push({location: locations["传承幻境 - X"]});   


    locations["幻境核心·地宫"] = new Location({
        connected_locations: [{location: locations["传承幻境"], custom_text: "Return to Heritage Illusory Realm"}],
        description: "The illusory journey should end here... Wait, you've got to be kidding — this place is an underground palace? There's the sound of my sister's voice!",
        name: "Illusory Realm Core · Underground Palace",
        dialogues: ["纳娜米?"],
        is_unlocked: false,
        bgm: 20,
    });//3-7(1区)
    locations["传承幻境"].connected_locations.push({location: locations["幻境核心·地宫"]});   

    locations["幻境核心 - 1"] = new Combat_zone({
        description: "Can faintly hear my sister's voice?! My sister can't be — right there —",
        enemy_count: 30, 
        enemies_list: ["心魔","燕岗辉煌佣兵","地宫虫将","地宫不眠者","地下焚天火","燕岗城卫队长"],
        enemy_group_size: [4,4],
        is_unlocked: true, 
        name: "幻境核心 - 1",
        rank:261, 
        bgm:20,
        parent_location: locations["幻境核心·地宫"],
        first_reward: {
            xp: 6000e8,
        },
        repeatable_reward: {
            xp: 2000e8,
            textlines: [{dialogue: "纳娜米?", lines: ["hx1"]}],
        },
    });
    locations["幻境核心 - I"] = new Challenge_zone({
        description: "Insolent Ronglong! I could tell at a glance you're not my sister! My sister can use spirit forms, but she's nowhere near as strong as you.",
        enemy_count: 1, 
        enemies_list : [["喵咕啦[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "幻境核心 - I",
        bgm:20,
        parent_location: locations["幻境核心·地宫"],
        repeatable_reward: {
            locations: [{location: "幻境核心·结界湖"}],
        },
    });
    locations["幻境核心·地宫"].connected_locations.push({location: locations["幻境核心 - 1"]});   
    locations["幻境核心·地宫"].connected_locations.push({location: locations["幻境核心 - I"]});  



    locations["幻境核心·结界湖"] = new Location({
        connected_locations: [{location: locations["幻境核心·地宫"], custom_text: "Return to the First Illusory Layer"}],
        description: "So this time it's — the family's secret realm, Barrier Lake? Wonder if there are any Icestalagmite Fish here. This place is also... somewhere that has had a deep influence on me.",
        name: "Illusory Realm Core · Barrier Lake",
        dialogues: ["纳鹰?"],
        is_unlocked: false,
        bgm: 20,
    });//3-7(2区)

    locations["幻境核心·地宫"].connected_locations.push({location: locations["幻境核心·结界湖"]});  

    locations["幻境核心 - 2"] = new Combat_zone({
        description: "It was here that Senior Naying imparted many cultivation insights to me, guiding me step by step to grow into who I am now.",
        enemy_count: 30, 
        enemies_list: ["心魔","残雪灵阵","秘境荧光帕芙","秘境闪耀精灵","喵咕啦","晓雪魅蝠","威武星骑士"],
        enemy_group_size: [4,4],
        is_unlocked: true, 
        name: "幻境核心 - 2",
        enemy_stat_halo:0.1,
        rank:262, 
        bgm:20,
        parent_location: locations["幻境核心·结界湖"],
        first_reward: {
            xp: 7500e8,
        },
        repeatable_reward: {
            xp: 2500e8,
            textlines: [{dialogue: "纳鹰?", lines: ["hx5"]}],
        },
    });
    locations["幻境核心·结界湖"].connected_locations.push({location: locations["幻境核心 - 2"]});  



    locations["幻境核心·战场"] = new Location({
        connected_locations: [{location: locations["幻境核心·结界湖"], custom_text: "Return to the Second Illusory Layer"}],
        description: "Two illusory layers have now been shattered. That catastrophe that devastated all life... being immersed in it, you can't help but feel rage welling up.",
        name: "Illusory Realm Core · Battlefield",
        dialogues: ["烈日神像"],
        is_unlocked: false,
        bgm: 20,
    });//3-7(3区)

    locations["幻境核心·结界湖"].connected_locations.push({location: locations["幻境核心·战场"]});  

    locations["幻境核心 - 3"] = new Combat_zone({
        description: "You must believe — all these disasters are... illusions... illusions!",
        enemy_count: 30, 
        enemies_list: ["心魔","威武星骑士","兰陵城头目","圣荒城头目","战场不朽骸骨","血腥追风者"],
        enemy_group_size: [4,4],
        is_unlocked: true, 
        name: "幻境核心 - 3",
        enemy_stat_halo:0.18,
        rank:263, 
        bgm:20,
        parent_location: locations["幻境核心·战场"],
        first_reward: {
            xp: 9000e8,
        },
        repeatable_reward: {
            xp: 3000e8,
            locations: [{location: "幻境核心 - II"}],
        },
    });
    locations["幻境核心 - II"] = new Challenge_zone({
        description: "Come to think of it, what clever use would a Penrose triangle have in offense and defense? Feels like a nice theme for creative tactics.",
        enemy_count: 1, 
        enemies_list : [["不可能三角B9[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "幻境核心 - II",
        bgm:20,
        parent_location: locations["幻境核心·战场"],
        repeatable_reward: {
            locations: [{location: "幻境核心·飞船"}],
        },
    });
    locations["幻境核心·战场"].connected_locations.push({location: locations["幻境核心 - 3"]});  
    locations["幻境核心·战场"].connected_locations.push({location: locations["幻境核心 - II"]});  

    locations["幻境核心·飞船"] = new Location({
        connected_locations: [{location: locations["幻境核心·战场"], custom_text: "Return to the Third Illusory Layer"}],
        description: "So, the fourth illusory layer... the core of the alien visitors' spacecraft? Come to think of it, the surrounding area seems to have a strange, inexplicable resentment gathering.",
        name: "Illusory Realm Core · Spacecraft",
        dialogues: ["末世天骄","十连扭蛋机"],
        is_unlocked: false,
        bgm: 20,
    });//3-7(4区)

    locations["幻境核心·战场"].connected_locations.push({location: locations["幻境核心·飞船"]});  


    locations["幻境核心 - 4"] = new Combat_zone({
        description: "This resentment... is something I never sensed in the previous three illusory layers. What could it be this time?",
        enemy_count: 30, 
        enemies_list: ["心魔","黄桃重工B9","不可能三角B9","极寒之锋B9","金色血眼B9","恐怖机人B9"],
        enemy_group_size: [4,4],
        is_unlocked: true, 
        name: "幻境核心 - 4",
        rank:264, 
        bgm:20,
        parent_location: locations["幻境核心·飞船"],
        first_reward: {
            xp: 12000e8,
        },
        repeatable_reward: {
            xp: 4000e8,
            locations: [{location: "幻境核心 - III"}],
        },
    });
    locations["幻境核心 - 歧路"] = new Challenge_zone({
        description: "Looks like talking it out won't work! Plan B — physical transcendence!",
        enemy_count: 1,
        enemies_list : [["末世天骄[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false,
        is_challenge: true,
        name: "Illusory Realm Core - Crossroads",
        bgm:20,
        parent_location: locations["幻境核心·飞船"],
        repeatable_reward: {
            textlines: [{dialogue: "十连扭蛋机", lines: ["nd1"]}],
        },
    });
    locations["幻境核心 - III"] = new Challenge_zone({
        description: "Truly ferocious! Brute-ling, Savage-ling, Special-ling — taking suggestions for the next name! How about Berserk-ling?",
        enemy_count: 1, 
        enemies_list : [["狠咕兽[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "幻境核心 - III",
        bgm:20,
        parent_location: locations["幻境核心·飞船"],
        repeatable_reward: {
            locations: [{location: "幻境核心·森林"}],
        },
    });
    locations["幻境核心·飞船"].connected_locations.push({location: locations["幻境核心 - 4"]});  
    locations["幻境核心·飞船"].connected_locations.push({location: locations["幻境核心 - III"]});  
    locations["幻境核心·飞船"].connected_locations.push({location: locations["幻境核心 - 歧路"]});  


    locations["幻境核心·森林"] = new Location({
        connected_locations: [{location: locations["幻境核心·飞船"], custom_text: "Return to the Fourth Illusory Layer"}],
        description: "Such thick fog... but I can still make out things in front of me. This is the forest where I met Big Brother Feng.",
        name: "Illusory Realm Core · Forest",
        dialogues: ["心魔之主","草场"],
        is_unlocked: false,
        bgm: 20,
    });//3-7(5区)

    locations["幻境核心·飞船"].connected_locations.push({location: locations["幻境核心·森林"]});  



    locations["幻境核心 - 5"] = new Combat_zone({
        description: "Come to think of it, if not for the Hundred Clans Alliance and many factions scheming together, I never would have met Big Brother Feng, and none of what followed would have happened.",
        enemy_count: 30, 
        enemies_list: ["心魔","冈崎喵妖","血洛大陆骨干","扭曲毒虫","狠咕兽","超量凶悍树妖"],
        enemy_group_size: [4,4],
        is_unlocked: true, 
        name: "幻境核心 - 5",
        rank:265, 
        bgm:20,
        parent_location: locations["幻境核心·森林"],
        first_reward: {
            xp: 15000e8,
        },
        repeatable_reward: {
            xp: 5000e8,
            textlines: [{dialogue: "心魔之主", lines: ["xm1"]}],
        },
    });
    locations["幻境核心 - IV"] = new Challenge_zone({
        description: "This guy's confidence depends on how badly the Restraint debuff has sapped him! At the end of the day it's just a 2x difference... if your demon form isn't cutting it, don't blame the Restraint.",
        enemy_count: 1, 
        enemies_list : [["心魔之主[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "幻境核心 - IV",
        bgm:20,
        parent_location: locations["幻境核心·森林"],
        repeatable_reward: {
            locations: [{location: "幻境核心·现世"}],
        },
    });
    locations["幻境核心·森林"].connected_locations.push({location: locations["幻境核心 - 5"]});  
    locations["幻境核心·森林"].connected_locations.push({location: locations["幻境核心 - IV"]});  


    locations["幻境核心·现世"] = new Location({
        connected_locations: [{location: locations["幻境核心·森林"], custom_text: "Return to the Fifth Illusory Layer"}],
        description: "After breaking free from the heart demons' assault, colorful light blooms. All five illusory layers are shattered — this is the true core of the Illusory Realm. Also, Zuo'a is busy erasing seal marks, so the formation arrays here can be borrowed!",
        dialogues: ["溪月(核心)"],
        name: "Illusory Realm Core · Present World",

        traders: ["物品存储箱"],
        sleeping: {
            text: "\"Borrow\" the Illusory Realm Formation to Cultivate [+2.5B XP/s]",
            xp: 50000
        },
            crafting: {
                is_unlocked: true,
                use_text: "\"Borrow\" the Smelting Formation [Tier+16]",
                tiers: {
                    crafting: 16,
                    forging: 16,
                    smelting: 16,
                    cooking: 16,
                    alchemy: 16,
                }
            },
        is_unlocked: false,
        bgm: 20,
    });//3-7(6区)

    locations["幻境核心·森林"].connected_locations.push({location: locations["幻境核心·现世"]});  
    
    locations["幻境核心 - 6"] = new Combat_zone({
        description: "Head to the final battle site and defeat Zuo'a! [To be added in V2.69]",
        enemy_count: 30, 
        enemies_list: ["暗杀飞蛾","巨人强豪","古龙小兽","血洛流浪剑客","大门派精英"],
        enemy_group_size: [4,4],
        is_unlocked: false, 
        name: "幻境核心 - 6",
        rank:266, 
        bgm:20,
        parent_location: locations["幻境核心·现世"],
        first_reward: {
            xp: 18000e8,
        },
        repeatable_reward: {
            xp: 6000e8,
            textlines: [{dialogue: "溪月(核心)", lines: ["hx35"]}],
        },
    });
    locations["幻境核心·现世"].connected_locations.push({location: locations["幻境核心 - 6"]});  




    locations["幻境核心·决战"] = new Location({
        connected_locations: [],//没有退路可言！
        description: "This is the ultimate end of Act 3! By the way, you can't go back. Even resurrection happens right here.",
        name: "Illusory Realm Core · Final Battle",
        dialogues: ["左阿(决战)","决战木牌"],
        is_unlocked: false,
        bgm: 20,
    });//3-7(最终)
    locations["幻境核心·现世"].connected_locations.push({location: locations["幻境核心·决战"],custom_text:"Enter the Final Battle [⚠️ No return until victory]"});  


    locations["幻境核心 - B1"] = new Challenge_zone({
        description: "Soul Spirit·Confinement — choose your enemies!",
        enemy_count: 1, 
        enemies_list : [["心之灵·禁锢[BOSS]"]],
        enemy_group_size: [1,1],
        enemy_stat_halo: 0.25,
        types: [],
        is_unlocked: true, 
        is_challenge: true,
        name: "幻境核心 - B1",
        bgm:20,
        parent_location: locations["幻境核心·决战"],
        repeatable_reward: {},
    });
    locations["幻境核心 - B2"] = new Challenge_zone({
        description: "Soul Spirit·Proliferation — choose your enemies!",
        enemy_count: 1, 
        enemies_list : [["心之灵·滋生[BOSS]"]],
        enemy_group_size: [1,1],
        enemy_stat_halo: 0.25,
        types: [],
        is_unlocked: true, 
        is_challenge: true,
        name: "幻境核心 - B2",
        bgm:20,
        parent_location: locations["幻境核心·决战"],
        repeatable_reward: {},
    });
    locations["幻境核心 - B3"] = new Challenge_zone({
        description: "Soul Spirit·Berserk — choose your enemies!",
        enemy_count: 1, 
        enemies_list : [["心之灵·暴走[BOSS]"]],
        enemy_group_size: [1,1],
        enemy_stat_halo: 0.25,
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "幻境核心 - B3",
        bgm:20,
        parent_location: locations["幻境核心·决战"],
        repeatable_reward: {},
    });
    locations["幻境核心 - X"] = new Challenge_zone({
        description: "Zuo'a's final battle!",
        enemy_count: 1, 
        enemies_list : [["左阿(垂死)[BOSS]"]],
        enemy_stat_halo: 0.1,
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "幻境核心 - X",
        bgm:20,
        parent_location: locations["幻境核心·决战"],
        repeatable_reward: {
            locations: [{location: "幻境核心·出口"}],
        },
    });
    
    locations["幻境核心·决战"].connected_locations.push({location: locations["幻境核心 - B1"],custom_text:"Challenge Soul Spirit·Confinement"});
    locations["幻境核心·决战"].connected_locations.push({location: locations["幻境核心 - B2"],custom_text:"Challenge Soul Spirit·Proliferation"});
    locations["幻境核心·决战"].connected_locations.push({location: locations["幻境核心 - B3"],custom_text:"Challenge Soul Spirit·Berserk"});
    locations["幻境核心·决战"].connected_locations.push({location: locations["幻境核心 - X"],custom_text:"Challenge Zuo'a!!!"});

    

    locations["幻境核心·出口"] = new Location({
        connected_locations: [{location: locations["幻境核心·现世"], custom_text: "Return to the Sixth Illusory Layer"}],
        description: "Zuo'a's battle... is over!",
        name: "Illusory Realm Core · Exit",
        dialogues: ["冰溪月"],//出口剧情！
        is_unlocked: false,
        bgm: 20,
    });//3-7(5区)
    locations["幻境核心·现世"].connected_locations.push({location: locations["幻境核心·出口"]});
    locations["幻境核心·决战"].connected_locations.push({location: locations["幻境核心·出口"],custom_text:"Leave the Battle Site"});

    locations["纳家宝库"] = new Location({
        connected_locations: [{location: locations["幻境核心·出口"], custom_text: "Return to Illusory Realm Core"},{location: locations["赫尔沼泽入口"], custom_text: "Fast Travel - Act 3"}],
        description: "Finally back to the family! Time to seize the clan head seat... [Pre-V2.70 endpoint]",
        name: "Na Family Treasury",
        dialogues: ["纳布(宝库)"],//老登剧情！
        is_unlocked: false,
        bgm: 21,
    });//4-1(初始区)
    locations["纳家宝库 - X"] = new Challenge_zone({
        description: "Dad made a breakthrough. Taking the treasures won't be as easy as it was in the original story!",
        enemy_count: 1, 
        enemies_list : [["纳布[BOSS]"]],
        enemy_group_size: [1,1],
        types: [],
        is_unlocked: false, 
        is_challenge: true,
        name: "纳家宝库 - X",
        bgm:21,
        parent_location: locations["纳家宝库"],
        repeatable_reward: {
            textlines: [{dialogue: "纳布(宝库)", lines: ["bk6"]}],
        },
    });
    locations["幻境核心·出口"].connected_locations.push({location: locations["纳家宝库"]});
    locations["纳家宝库"].connected_locations.push({location: locations["纳家宝库 - X"]});
    locations["赫尔沼泽入口"].connected_locations.push({location: locations["纳家宝库"],custom_text:"Fast Travel - Act 4"});
    locations["狩猎大赛·城门战"] = new Location({
        connected_locations: [{location: locations["纳家宝库"], custom_text: "Return to Na Family Treasury"}],
        description: "The thrilling Yangang Hunting Competition. This is Phase 1! [Pre-V2.74 endpoint]",
        name: "Hunting Competition · City Gate Battle",
        dialogues: [],
        is_unlocked: false,
        bgm: 21,
    });//4-1
    locations["纳家宝库"].connected_locations.push({location: locations["狩猎大赛·城门战"]});








    locations["Nearby cave"] = new Location({ 
        connected_locations: [{location: locations["Village"], custom_text: "Go outside and to the village"}], 
        getDescription: function() {
            if(locations["Pitch black tunnel"].enemy_groups_killed >= locations["Pitch black tunnel"].enemy_count) { 
                return "A big cave near the village, once used as a storeroom. Groups of fluorescent mushrooms cover the walls, providing a dim light. Your efforts have secured a decent space and many of the tunnels. It seems like you almost reached the deepest part.";
            }
            else if(locations["Hidden tunnel"].enemy_groups_killed >= locations["Hidden tunnel"].enemy_count) { 
                return "A big cave near the village, once used as a storeroom. Groups of fluorescent mushrooms cover the walls, providing a dim light. Your efforts have secured a major space and some tunnels, but there are still more places left to clear out.";
            }
            else if(locations["Cave depths"].enemy_groups_killed >= locations["Cave depths"].enemy_count) { 
                return "A big cave near the village, once used as a storeroom. Groups of fluorescent mushrooms cover the walls, providing a dim light. Your efforts have secured a decent space and even a few tunnels, yet somehow you can still hear the sounds of the wolf rats.";
            }
            else if(locations["Cave room"].enemy_groups_killed >= locations["Cave room"].enemy_count) {
                return "A big cave near the village, once used as a storeroom. Groups of fluorescent mushrooms cover the walls, providing a dim light. Your efforts have secured some space, but you can hear more wolf rats in some deeper tunnels.";
            } else {
                return "A big cave near the village, once used as a storeroom. Groups of fluorescent mushrooms cover the walls, providing a dim light. You can hear sounds of wolf rats from the nearby room.";
            }
        },
        getBackgroundNoises: function() {
            let noises = ["*You hear rocks rumbling somewhere*", "Squeak!", ];
            return noises;
        },
        name: "Nearby cave",
        is_unlocked: false,
    });
    locations["Village"].connected_locations.push({location: locations["Nearby cave"]});
    //remember to always add it like that, otherwise travel will be possible only in one direction and location might not even be reachable

    locations["Cave room"] = new Combat_zone({
        description: "It's full of rats. At least the glowing mushrooms provide some light.", 
        enemy_count: 25, 
        types: [{type: "narrow", stage: 1,  xp_gain: 3}, {type: "bright", stage:1}],
        enemies_list: ["Wolf rat"],
        enemy_group_size: [2,3],
        enemy_stat_variation: 0.2,
        is_unlocked: true, 
        name: "Cave room", 
        leave_text: "Go back to entrance",
        parent_location: locations["Nearby cave"],
        first_reward: {
            xp: 20,
        },
        repeatable_reward: {
            locations: [{location: "Cave depths"}],
            xp: 10,
            activities: [{location:"Nearby cave", activity:"weightlifting"}, {location:"Nearby cave", activity:"mining"}, {location:"Village", activity:"balancing"}],
        }
    });
    locations["Nearby cave"].connected_locations.push({location: locations["Cave room"]});

    locations["Cave depths"] = new Combat_zone({
        description: "It's dark. And full of rats.", 
        enemy_count: 50, 
        types: [{type: "narrow", stage: 1,  xp_gain: 3}, {type: "dark", stage: 2, xp_gain: 3}],
        enemies_list: ["Wolf rat"],
        enemy_group_size: [5,8],
        enemy_stat_variation: 0.2,
        is_unlocked: false, 
        name: "Cave depths", 
        leave_text: "Climb out",
        parent_location: locations["Nearby cave"],
        first_reward: {
            xp: 30,
        },
        repeatable_reward: {
            textlines: [{dialogue: "village elder", lines: ["cleared cave"]}],
            locations: [{location: "Suspicious wall", required_clears: 4}],
            xp: 15,
        }
    });
    
    locations["Hidden tunnel"] = new Combat_zone({
        description: "There is, in fact, even more rats here.", 
        enemy_count: 50, 
        types: [{type: "narrow", stage: 1,  xp_gain: 3}, {type: "dark", stage: 3, xp_gain: 1}],
        enemies_list: ["Elite wolf rat"],
        enemy_group_size: [2,2],
        enemy_stat_variation: 0.2,
        is_unlocked: false, 
        name: "Hidden tunnel", 
        leave_text: "Retreat for now",
        parent_location: locations["Nearby cave"],
        first_reward: {
            xp: 100,
        },
        repeatable_reward: {
            locations: [{location: "Pitch black tunnel"}],
            xp: 50,
            activities: [{location:"Nearby cave", activity:"mining2"}],
        },
        unlock_text: "As the wall falls apart, you find yourself in front of a new tunnel, leading even deeper. And of course, it's full of wolf rats."
    });
    locations["Pitch black tunnel"] = new Combat_zone({
        description: "There is no light here. Only rats.", 
        enemy_count: 50, 
        types: [{type: "narrow", stage: 1,  xp_gain: 6}, {type: "dark", stage: 3, xp_gain: 3}],
        enemies_list: ["Elite wolf rat"],
        enemy_group_size: [6,8],
        enemy_stat_variation: 0.2,
        is_unlocked: false, 
        name: "Pitch black tunnel", 
        leave_text: "Retreat for now",
        parent_location: locations["Nearby cave"],
        first_reward: {
            xp: 200,
        },
        repeatable_reward: {
            xp: 100,
            locations: [{location: "Mysterious gate", required_clears: 4}],
        },
        unlock_text: "As you keep going deeper, you barely notice a pitch black hole. Not even a tiniest speck of light reaches it."
    });

    locations["Mysterious gate"] = new Combat_zone({
        description: "It's dark. And full of rats.", 
        enemy_count: 50, 
        types: [{type: "dark", stage: 3, xp_gain: 5}],
        enemies_list: ["Elite wolf rat guardian"],
        enemy_group_size: [6,8],
        enemy_stat_variation: 0.2,
        is_unlocked: false,
        name: "Mysterious gate", 
        leave_text: "Get away",
        parent_location: locations["Nearby cave"],
        first_reward: {
            xp: 500,
        },
        repeatable_reward: {
            xp: 250,
        },
        unlock_text: "After a long and ardous fight, you reach a chamber that ends with a massive stone gate. You can see it's guarded by some kind of wolf rats, but much bigger than the ones you fought until now."
    });


    locations["Nearby cave"].connected_locations.push(
        {location: locations["Cave depths"]}, 
        {location: locations["Hidden tunnel"], custom_text: "Enter the hidden tunnel"}, 
        {location: locations["Pitch black tunnel"], custom_text: "Go into the pitch black tunnel"},
        {location: locations["Mysterious gate"], custom_text: "Go to the mysterious gate"}),

    locations["Forest road"] = new Location({ 
        connected_locations: [{location: locations["Village"]}],
        description: "Old trodden road leading through a dark forest, the only path connecting village to the town. You can hear some animals from the surrounding woods.",
        name: "Forest road",
        getBackgroundNoises: function() {
            let noises = ["*You hear some rustling*", "Roar!", "*You almost tripped on some roots*", "*You hear some animal running away*"];

            return noises;
        },
        is_unlocked: false,
    });
    locations["Village"].connected_locations.push({location: locations["Forest road"], custom_text: "Leave the village"});

    locations["Forest"] = new Combat_zone({
        description: "Forest surrounding the village, a dangerous place", 
        enemies_list: ["Starving wolf", "Young wolf"],
        enemy_count: 30, 
        enemy_stat_variation: 0.2,
        name: "Forest", 
        parent_location: locations["Forest road"],
        first_reward: {
            xp: 40,
        },
        repeatable_reward: {
            xp: 20,
            locations: [{location:"Deep forest"}],
            activities: [{location:"Forest road", activity: "herbalism"}],
        },
    });
    locations["Forest road"].connected_locations.push({location: locations["Forest"], custom_text: "Leave the safe path"});

    locations["Deep forest"] = new Combat_zone({
        description: "Deeper part of the forest, a dangerous place", 
        enemies_list: ["Wolf", "Starving wolf", "Young wolf"],
        enemy_count: 50, 
        enemy_group_size: [2,3],
        enemy_stat_variation: 0.2,
        is_unlocked: false,
        name: "Deep forest", 
        parent_location: locations["Forest road"],
        first_reward: {
            xp: 70,
        },
        repeatable_reward: {
            xp: 35,
            flags: ["is_deep_forest_beaten"],
            activities: [{location:"Forest road", activity: "woodcutting"}],
        }
    });
    locations["Forest road"].connected_locations.push({location: locations["Deep forest"], custom_text: "Venture deeper into the woods"});

    locations["Forest clearing"] = new Combat_zone({
        description: "A surprisingly big clearing hidden in the northern part of the forest, covered with very tall grass and filled with a mass of wild boars",
        enemies_list: ["Boar"],
        enemy_count: 50, 
        enemy_group_size: [4,7],
        is_unlocked: false,
        enemy_stat_variation: 0.2,
        name: "Forest clearing", 
        types: [{type: "open", stage: 2, xp_gain: 3}],
        parent_location: locations["Forest road"],
        first_reward: {
            xp: 200,
        },
        repeatable_reward: {
            xp: 100,
            textlines: [{dialogue: "farm supervisor", lines: ["defeated boars"]}],
        }
    });
    locations["Forest road"].connected_locations.push({location: locations["Forest clearing"], custom_text: "Go towards the clearing in the north"});

    locations["Town outskirts"] = new Location({ 
        connected_locations: [{location: locations["Forest road"], custom_text: "Return to the forest"}],
        description: "The town is surrounded by a tall stone wall. The only gate seems to be closed, with a lone guard outside. You can see farms to the north and slums to the south.",
        name: "Town outskirts",
        is_unlocked: true,
        dialogues: ["gate guard"],
    });
    locations["Forest road"].connected_locations.push({location: locations["Town outskirts"], custom_text: "Go towards the town"});

    locations["Slums"] = new Location({ 
        connected_locations: [{location: locations["Town outskirts"]}],
        description: "A wild settlement next to city walls, filled with decaying buildings and criminals",
        name: "Slums",
        is_unlocked: true,
        dialogues: ["suspicious man"],
        traders: ["suspicious trader"],
        getBackgroundNoises: function() {
            let noises = ["Cough cough", "*You hear a scream*", "*You hear someone sobbing*"];

            if(current_game_time.hour > 4 && current_game_time.hour <= 20) {
                noises.push("Please, do you have a coin to spare?");
            } else {
                noises.push("*Sounds of someone getting repeatedly stabbed*", "Scammed some fools for money today, time to get drunk");
            }
            return noises;
        },
    });
    locations["Town farms"] = new Location({ 
        connected_locations: [{location: locations["Town outskirts"]}],
        description: "Semi-private farms under jurisdiction of the city council. Full of life and sounds of heavy work.",
        name: "Town farms",
        is_unlocked: true,
        dialogues: ["farm supervisor"],
        getBackgroundNoises: function() {
            let noises = [];
            if(current_game_time.hour > 4 && current_game_time.hour <= 20) {
                noises.push("Mooooo!", "Look, a bird!", "Bark bark!", "*You notice a goat staring at you menacingly*", "Neigh!", "Oink oink");
            } else {
                noises.push("*You can hear some rustling*", "*You can hear snoring workers*");
            }

            if(current_game_time.hour > 3 && current_game_time.hour < 10) {
                noises.push("♫♫ Heigh ho, heigh ho, it's off to work I go~ ♫♫", "Cock-a-doodle-doo!");
            } else if(current_game_time.hour > 18 && current_game_time.hour < 22) {
                noises.push("♫♫ Heigh ho, heigh ho, it's home from work I go~ ♫♫");
            } 

            return noises;
        },
    });

    locations["Town outskirts"].connected_locations.push({location: locations["Town farms"]}, {location: locations["Slums"]});
})();

//challenge zones
(function(){
    locations["Sparring with the village guard (heavy)"] = new Challenge_zone({
        description: "He's showing you a technique that makes his attacks slow but deadly",
        enemy_count: 1, 
        enemies_list: ["Village guard (heavy)"],
        enemy_group_size: [1,1],
        is_unlocked: false, 
        name: "Sparring with the village guard (heavy)", 
        leave_text: "Give up",
        parent_location: locations["Village"],
        first_reward: {
            xp: 30,
        },
        repeatable_reward: {
            textlines: [{dialogue: "village guard", lines: ["heavy"]}],
        },
        unlock_text: "You can now spar with the guard (heavy stance) in the Village"
    });
    locations["Sparring with the village guard (quick)"] = new Challenge_zone({
        description: "He's showing you a technique that makes his attacks slow but deadly",
        enemy_count: 1, 
        enemies_list: ["Village guard (quick)"],
        enemy_group_size: [1,1],
        is_unlocked: false, 
        name: "Sparring with the village guard (quick)", 
        leave_text: "Give up",
        parent_location: locations["Village"],
        first_reward: {
            xp: 30,
        },
        repeatable_reward: {
            textlines: [{dialogue: "village guard", lines: ["quick"]}],
        },
        unlock_text: "You can now spar with the guard (quick stance) in the Village"
    });
    locations["Village"].connected_locations.push(
        {location: locations["Sparring with the village guard (heavy)"], custom_text: "Spar with the guard [heavy]"},
        {location: locations["Sparring with the village guard (quick)"], custom_text: "Spar with the guard [quick]"}
    );

    locations["Suspicious wall"] = new Challenge_zone({
        description: "It can be broken with enough force, you can feel it", 
        enemy_count: 1, 
        types: [],
        enemies_list: ["Suspicious wall"],
        enemy_group_size: [1,1],
        enemy_stat_variation: 0,
        is_unlocked: false, 
        name: "Suspicious wall", 
        leave_text: "Leave it for now",
        parent_location: locations["Nearby cave"],
        repeatable_reward: {
            locations: [{location: "Hidden tunnel"}],
            textlines: [{dialogue: "village elder", lines: ["new tunnel"]}],
            xp: 20,
        },
        unlock_text: "At some point, one of wolf rats tries to escape through a previously unnoticed hole in a nearby wall. There might be another tunnel behind it!"
    });
    locations["Nearby cave"].connected_locations.push({location: locations["Suspicious wall"], custom_text: "Try to break the suspicious wall"});

    locations["Fight off the assailant"] = new Challenge_zone({
        description: "He attacked you out of nowhere", 
        enemy_count: 1, 
        types: [],
        enemies_list: ["Suspicious man"],
        enemy_group_size: [1,1],
        enemy_stat_variation: 0,
        is_unlocked: false, 
        name: "Fight off the assailant", 
        leave_text: "Run away for now",
        parent_location: locations["Slums"],
        repeatable_reward: {
            textlines: [{dialogue: "suspicious man", lines: ["defeated"]}],
            xp: 40,
        },
        unlock_text: "Defend yourself!"
    });
    locations["Slums"].connected_locations.push({location: locations["Fight off the assailant"], custom_text: "Fight off the suspicious man"});
})();

//add activities
(function(){
    locations["Village"].activities = {
        "fieldwork": new LocationActivity({
            activity_name: "fieldwork",
            starting_text: "Work on the fields",
            get_payment: () => {
                return 10 + Math.round(15 * skills["Farming"].current_level/skills["Farming"].max_level);
            },
            is_unlocked: false,
            working_period: 60*2,
            availability_time: {start: 6, end: 20},
            skill_xp_per_tick: 1, 
        }),
        "weightlifting": new LocationActivity({
            activity_name: "weightlifting",
            infinite: true,
            starting_text: "Try to carry some bags of grain",
            skill_xp_per_tick: 1,
            is_unlocked: false,
        }),
        "balancing": new LocationActivity({
            activity_name: "balancing",
            infinite: true,
            starting_text: "Try to keep your balance on rocks in the river",
            unlock_text: "All this fighting while surrounded by stone and rocks gives you a new idea",
            skill_xp_per_tick: 1,
            is_unlocked: false,
        }),
        "meditating": new LocationActivity({
            activity_name: "meditating",
            infinite: true,
            starting_text: "Sit down and meditate",
            skill_xp_per_tick: 1,
            is_unlocked: true,
        }),
        "patrolling": new LocationActivity({
            activity_name: "patrolling",
            starting_text: "Go on a patrol around the village.",
            get_payment: () => {return 30},
            is_unlocked: false,
            infinite: true,
            working_period: 60*2,
            skill_xp_per_tick: 1
        }),
        "woodcutting": new LocationActivity({
            activity_name: "woodcutting",
            infinite: true,
            starting_text: "Gather some wood on the outskirts",
            skill_xp_per_tick: 1,
            is_unlocked: true,
            gained_resources: {
                resources: [{name: "Piece of rough wood", ammount: [[1,1], [1,3]], chance: [0.3, 1]}], 
                time_period: [20, 10],
                skill_required: [0, 10],
                scales_with_skill: true,
            },
            require_tool: false,
        }),
    };
    locations["Nearby cave"].activities = {
        "weightlifting": new LocationActivity({
            activity_name: "weightlifting",
            infinite: true,
            starting_text: "Try lifting some of the rocks",
            skill_xp_per_tick: 3,
            is_unlocked: false,
            unlock_text: "After the fight, you realize there's quite a lot of rocks of different sizes that could be used for exercises",
        }),
        "mining": new LocationActivity({
            activity_name: "mining",
            infinite: true,
            starting_text: "Mine the strange looking iron vein",
            skill_xp_per_tick: 1,
            is_unlocked: false,
            gained_resources: {
                resources: [{name: "Low quality iron ore", ammount: [[1,1], [1,3]], chance: [0.3, 0.7]}], 
                time_period: [60, 30],
                skill_required: [0, 10],
                scales_with_skill: true,
            },
            unlock_text: "As you clear the area of wolf rats, you notice a vein of an iron ore",
        }),
        "mining2": new LocationActivity({
            activity_name: "mining",
            infinite: true,
            starting_text: "Mine some of the deeper iron vein",
            skill_xp_per_tick: 5,
            is_unlocked: false,
            gained_resources: {
                resources: [{name: "Iron ore", ammount: [[1,1], [1,3]], chance: [0.1, 0.6]}], 
                time_period: [90, 40],
                skill_required: [7, 17],
                scales_with_skill: true,
            },
            unlock_text: "Going deeper, you find a vein of an iron ore that seems to be of much higher quality",
        }),
    };
    locations["Forest road"].activities = {
        "woodcutting": new LocationActivity({
            activity_name: "woodcutting",
            infinite: true,
            starting_text: "Gather some wood from nearby trees",
            skill_xp_per_tick: 5,
            is_unlocked: false,
            gained_resources: {
                resources: [{name: "Piece of wood", ammount: [[1,1], [1,3]], chance: [0.1, 1]}],
                time_period: [90, 40],
                skill_required: [10, 20],
                scales_with_skill: true,
            },
        }),
        "herbalism": new LocationActivity({
            activity_name: "herbalism",
            infinite: true,
            starting_text: "Gather useful herbs throughout the forest",
            skill_xp_per_tick: 2,
            is_unlocked: false,
            gained_resources: {
                resources: [
                    {name: "Oneberry", ammount: [[1,1], [1,1]], chance: [0.1, 0.5]},
                    {name: "Golmoon leaf", ammount: [[1,1], [1,1]], chance: [0.1, 0.7]},
                    {name: "Belmart leaf", ammount: [[1,1], [1,1]], chance: [0.1, 0.7]}
                ], 
                time_period: [120, 45],
                skill_required: [0, 10],
                scales_with_skill: true,
            },
            require_tool: false,
        }),
    };
    locations["Town farms"].activities = {
        "fieldwork": new LocationActivity({
            activity_name: "fieldwork",
            starting_text: "Work on the fields",
            get_payment: () => {
                return 20 + Math.round(20 * skills["Farming"].current_level/skills["Farming"].max_level);
            },
            is_unlocked: false,
            working_period: 60*2,
            availability_time: {start: 6, end: 20},
            skill_xp_per_tick: 2,
        }),
        "animal care": new LocationActivity({
            activity_name: "animal care",
            infinite: true,
            starting_text: "Take care of local sheep in exchange for some wool",
            skill_xp_per_tick: 3,
            is_unlocked: false,
            gained_resources: {
                resources: [
                    {name: "Wool", ammount: [[1,1], [1,3]], chance: [0.1, 1]},
                ], 
                time_period: [120, 60],
                skill_required: [0, 10],
                scales_with_skill: true,
            },
            require_tool: false,
        }),
    };
    locations["郊区河流"].activities = {
        
        "Running": new LocationActivity({
            activity_name: "Running",
            infinite: true,
            starting_text: "Run freely in the outskirts",
            skill_xp_per_tick: 1,
            is_unlocked: true,
        }),
        "Swimming": new LocationActivity({
            activity_name: "Swimming",
            infinite: true,
            starting_text: "Practice swimming in the river",
            skill_xp_per_tick: 1,
            is_unlocked: true,
        }),
    }
    locations["清野江畔"].activities = {
        
        "Swimming": new LocationActivity({
            activity_name: "Swimming",
            infinite: true,
            starting_text: "Resist the rapids at Qingye Waterfall [EXPx32]",
            skill_xp_per_tick: 32,
            is_unlocked: true,
        }),
    }
    
    locations["燕岗矿井"].activities = {
        
        "miningP_Copper": new LocationActivity({
            activity_name: "mining",
            infinite: true,
            starting_text: "Mine some purple copper ore",
            skill_xp_per_tick: 1,
            is_unlocked: true,
            gained_resources: {
                resources: [{name: "紫铜矿", ammount: [[1,1], [1,1]], chance: [0.4, 1.0]}], 
                time_period: [20, 8],
                skill_required: [0, 10],
                scales_with_skill: true,
            },
        }),

        "miningCoal": new LocationActivity({
            activity_name: "mining",
            infinite: true,
            starting_text: "Mine coal ore",
            skill_xp_per_tick: 2,
            is_unlocked: true,
            gained_resources: {
                resources: [{name: "煤炭", ammount: [[1,1], [1,1]], chance: [0.4, 1.0]}], 
                time_period: [24, 10],
                skill_required: [3, 13],
                scales_with_skill: true,
            },
        }),
    };
    locations["地宫入口"].activities = {
        "mining40Gem": new LocationActivity({
            activity_name: "mining",
            infinite: true,
            starting_text: "Secretly mine out gems with a pickaxe",
            skill_xp_per_tick: 10,
            is_unlocked: true,
            exp_scaling: true,
            scaling_id: "40G",
            exp_o:1.5,//每完成一次需要的时间指数提升
            gained_resources: {
                resources: [{name: "高级蓝宝石", ammount: [[1,1], [1,1]], chance: [1.0, 1.0]}], 
                time_period: [10, 2],
                skill_required: [0, 10],
                scales_with_skill: true,
            },
        }),
    }
    locations["荒兽森林营地"].activities = {
        "woodcutting100": new LocationActivity({
            activity_name: "woodcutting",
            infinite: true,
            starting_text: "Chop willow trees in the Wild Beast Forest",
            skill_xp_per_tick: 20,
            is_unlocked: false,
            gained_resources: {
                resources: [{name: "百年柳木", ammount: [[1,1], [1,3]], chance: [1, 1]}],
                time_period: [30, 6],
                skill_required: [8, 30],
                scales_with_skill: true,
            },
        }),
    }
    
    locations["纳家秘境"].activities = {
        "Running": new LocationActivity({
            activity_name: "Running",
            infinite: true,
            starting_text: "Run laps in the secret realm [EXPx32]",
            skill_xp_per_tick: 32,
            is_unlocked: true,
        }),
        "microflower": new LocationActivity({
            activity_name: "mining",
            infinite: true,
            starting_text: "Destroy the halo with a pickaxe",
            skill_xp_per_tick: 50,
            is_unlocked: false,
            exp_scaling: true,
            scaling_id: "microflower",
            exp_o:2,//每完成一次需要的时间指数提升
            gained_resources: {
                resources: [{name: "微花残片", ammount: [[1,1], [1,1]], chance: [1.0, 1.0]}], 
                time_period: [30, 10],
                skill_required: [0, 10],
                scales_with_skill: true,
            },
        }),
    }

    locations["结界湖"].activities = {
        "fishing": new LocationActivity({
            activity_name: "fishing",
            infinite: true,
            starting_text: "Fish in the Barrier Lake",
            skill_xp_per_tick: 1,
            is_unlocked: true,
            gained_resources: {
                resources: [{name: "湖鲤鱼", ammount: [[1,1], [1,1]], chance: [0.00000001, 0.00000001]},{name: "青花鱼", ammount: [[1,1], [1,1]], chance: [0.00000001, 0.00000001]},{name: "冰柱鱼", ammount: [[1,1], [1,1]], chance: [0.00000001, 0.00000001]}],
                time_period: [15, 3],
                skill_required: [0, 20],
                scales_with_skill: true,
            },
        }),
        "Running": new LocationActivity({
            activity_name: "Running",
            infinite: true,
            starting_text: "Rush toward Shenglu City [EXPx64]",
            skill_xp_per_tick: 64,
            spec: "goto2-5",
            is_unlocked: false,
        }),
    }
    
    locations["声律城战场"].activities = {
        "mining50kGem": new LocationActivity({
            activity_name: "mining",
            infinite: true,
            starting_text: "Secretly mine out even larger gems with a pickaxe",
            skill_xp_per_tick: 100,
            is_unlocked: true,
            exp_scaling: true,
            scaling_id: "50K",
            exp_o:1.33,//每完成一次需要的时间指数提升
            gained_resources: {
                resources: [{name: "殿堂红宝石", ammount: [[1,1], [1,1]], chance: [1.0, 1.0]},{name: "殿堂绿宝石", ammount: [[1,1], [1,1]], chance: [0.01, 0.25]}], 
                time_period: [12, 2],
                skill_required: [10, 20],
                scales_with_skill: true,
            },
        }),
    }
    locations["极寒冰宫"].activities = {
        "miningIce": new LocationActivity({
            activity_name: "mining",
            infinite: true,
            starting_text: "Break open ice blocks and rescue the trapped merchant",
            skill_xp_per_tick: 200,
            is_unlocked: true,
            gained_resources: {
                resources: [{name: "冰块", ammount: [[1,1], [9,10]], chance: [0.96, 1.0]},{name: "万载冰髓锭", ammount: [[1,1], [1,1]], chance: [0.03, 0.3]},{name: "冰宫商人", ammount: [[1,1], [1,1]], chance: [0.01, 0.1]},], 
                time_period: [24, 1],
                skill_required: [40, 60],
                scales_with_skill: true,
            },
        }),
    }
    
    locations["时封水牢"].activities = {
        
        "AquaElement": new LocationActivity({
            activity_name: "AquaElement",
            infinite: true,
            starting_text: "Sense the water elements filling the Time-Sealed Water Prison",
            skill_xp_per_tick: 1,
            is_unlocked: true,
        }),
    }
    
    locations["幻境核心·地宫"].activities = {
        "mining100MGem": new LocationActivity({
            activity_name: "mining",
            infinite: true,
            starting_text: "偷偷用镐子挖出……血杀剑？",
            skill_xp_per_tick: 1000,
            is_unlocked: true,
            exp_scaling: true,
            scaling_id: "100M",
            exp_o:1.8,//每完成一次需要的时间指数提升
            gained_resources: {
                resources: [{name: "血杀剑", ammount: [[1,1], [1,1]], chance: [1.0, 1.0]}], 
                time_period: [40, 2],
                skill_required: [50, 70],
                scales_with_skill: true,
            },
        }),
    }
    locations["幻境核心·结界湖"].activities = {
        "fishing2": new LocationActivity({
            activity_name: "fishing",
            infinite: true,
            starting_text: "在幻境·结界湖中垂钓(2D)",
            skill_xp_per_tick: 4,
            is_unlocked: true,
            gained_resources: {
                resources: [{name: "冰柱鱼", ammount: [[1,1], [1,1]], chance: [0.00000001, 0.00000001]},{name: "血莲鱼", ammount: [[1,1], [1,1]], chance: [0.00000001, 0.00000001]},{name: "冰柱鱼王", ammount: [[1,1], [1,1]], chance: [0.00000001, 0.00000001]}],
                time_period: [15, 3],
                skill_required: [15, 35],
                scales_with_skill: true,
            },
        }),
    }
})();

//add actions

export {locations, location_types, get_location_type_penalty};

/*
TODO:
    some "quick travel" location that would connect all important ones? (e.g. some towns?)
*/