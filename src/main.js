"use strict";

import { current_game_time } from "./game_time.js";
import { item_templates, getItem, book_stats, setLootSoldCount, loot_sold_count, recoverItemPrices, rarity_multipliers, getArmorSlot, WeaponComponent} from "./items.js";
import { locations } from "./locations.js";
import { skills, weapon_type_to_skill, which_skills_affect_skill } from "./skills.js";
import { dialogues } from "./dialogues.js";
import { enemy_killcount } from "./enemies.js";
import { traders } from "./traders.js";
import { is_in_trade, start_trade, cancel_trade, accept_trade, exit_trade, add_to_trader_inventory,
         add_to_buying_list, remove_from_buying_list, add_to_selling_list, remove_from_selling_list} from "./trade.js";
import { character, 
         add_to_character_inventory, remove_from_character_inventory,
         equip_item_from_inventory, unequip_item, equip_item,
         update_character_stats, get_total_skill_level,
         get_skill_xp_gain } from "./character.js";
import { activities } from "./activities.js";
import { end_activity_animation, 
         update_displayed_character_inventory, update_displayed_trader_inventory, sort_displayed_inventory, sort_displayed_skills,
         update_displayed_money, log_message,
         update_displayed_enemies, update_displayed_health_of_enemies,
         update_displayed_combat_location, update_displayed_normal_location,
         log_loot, update_displayed_equipment,
         update_displayed_health, 
         update_displayed_stats,
         format_money,
         update_displayed_effects, update_displayed_effect_durations,
         update_displayed_time, update_displayed_character_xp, 
         update_displayed_dialogue, update_displayed_textline_answer,
         start_activity_display, start_sleeping_display,
         create_new_skill_bar, update_displayed_skill_bar, update_displayed_skill_description,
         update_displayed_ongoing_activity, 
         update_enemy_attack_bar, update_character_attack_bar,
         update_displayed_location_choices,
         create_new_bestiary_entry,
         add_bestiary_lines,
         create_new_levelary_entry,
         update_bestiary_entry,
         start_reading_display,
         update_displayed_xp_bonuses, 
         update_displayed_skill_xp_gain, update_all_displayed_skills_xp_gain, update_displayed_stance_list, update_displayed_stance, update_displayed_faved_stances, update_stance_tooltip,
         update_gathering_tooltip,
         open_crafting_window,
         update_displayed_location_types,
         close_crafting_window,
         switch_crafting_recipes_page,
         switch_crafting_recipes_subpage,
         create_displayed_crafting_recipes,
         update_displayed_component_choice,
         update_displayed_material_choice,
         update_recipe_tooltip,
         update_displayed_crafting_recipes,
         update_item_recipe_visibility,
         update_item_recipe_tooltips,
         update_displayed_book,
         update_backup_load_button,
         update_other_save_load_button,
         format_number,add_bestiary_zones,
         unlock_moonwheel,
         add_bestiary_tooltip,
         clear_bestiary_tooltip,
         add_levelary_tooltip,
         clear_levelary_tooltip,
        } from "./display.js";
import { compare_game_version, get_hit_chance } from "./misc.js";
import { stances } from "./combat_stances.js";
import { get_recipe_xp_value, recipes } from "./crafting_recipes.js";
import { game_version, get_game_version } from "./game_version.js";
import { ActiveEffect, effect_templates } from "./active_effects.js";

window.add_bestiary_tooltip = add_bestiary_tooltip;
window.clear_bestiary_tooltip = clear_bestiary_tooltip;
window.add_levelary_tooltip = add_levelary_tooltip;
window.clear_levelary_tooltip = clear_levelary_tooltip;

const save_key = "save data";
const dev_save_key = "dev save data";
const backup_key = "backup save";
const dev_backup_key = "dev backup save";

window.REALMS=[
[0,"Dust Rank: Novice",0,0,0,"basic"],
[1,"Dust Rank: Adept",1,50,5,"basic"],
[2,"Dust Rank: Expert",3,200,100,"basic"],
[3,"Myriad Rank: Novice",6,700,1200,"basic"],//0.1spd
[4,"Myriad Rank: Expert",15,3000,4800,"basic"],
[5,"Myriad Rank: Pinnacle",25,6000,16000,"basic"],
[6,"Tidal Rank: Novice",50,10000,36000,"basic"],//0.1spd
[7,"Tidal Rank: Expert",100,20000,120000,"basic"],
[8,"Tidal Rank: Pinnacle",250,40000,2400000,"basic"],

[9,"Earth Rank: Stage 1",550,120000,60000000,"terra"],
[10,"Earth Rank: Stage 2",1000,250000,80000000,"terra"],
[11,"Earth Rank: Stage 3",2000,550000,1.6e8,"terra"],
[12,"Earth Rank: Stage 4",3000,1000000,4.8e8,"terra"],//200w
[13,"Earth Rank: Stage 5",5000,1500000,12e8,"terra"],//350w
[14,"Earth Rank: Stage 6",9000,2500000,36e8,"terra"],//600w
[15,"Earth Rank: Stage 7",15000,6500000,108e8,"terra"],//1250w
[16,"Earth Rank: Stage 8",36000,12500000,216e8,"terra"],//2500w
[17,"Earth Rank: Pinnacle",72000,22500000,432e8,"terra"],
[18,"Earth Rank: Breakthrough",126000,32500000,1080e8,"terra"],

[19,"Sky Rank: Stage 1",180000,1.2e8,10000e8,"sky"],//2e
[20,"Sky Rank: Stage 2",550000,3e8,4e12,"sky"],//5e
[21,"Sky Rank: Stage 3",1500000,10e8,16e12,"sky"],//15e
[22,"Sky Rank: Stage 4",4000000,25e8,80e12,"sky"],//40e
[23,"Sky Rank: Stage 5",16000000,60e8,320e12,"sky"],//100e
[24,"Sky Rank: Stage 6",40000000,150e8,1120e12,"sky"],//250e
[25,"Sky Rank: Stage 7",72500000,350e8,6000e12,"sky"],//600e
[26,"Sky Rank: Stage 8",3e8,900e8,2.4e16,"sky"],//1500e
[27,"Sky Rank: Pinnacle",8e8,1500e8,7.2e16,"sky"],//3000e
[28,"Sky Rank: Breakthrough",16e8,3000e8,170.1411e36,"sky"],//6000e
[29,"Ascendant Rank: Stage 1",40e8,6000e8,99.9999e16,"cloudy"],//1.2z
[30,"Ascendant Rank: Stage 2",150e8,28000e8,500e16,"cloudy"],//4z
[31,"Ascendant Rank: Stage 3",600e8,6.5e12,4000e16,"cloudy"],//10.5z
[32,"Ascendant Rank: Stage 4",1200e8,10.5e12,1.2e20,"cloudy"],//21.0z
[33,"Ascendant Rank: Stage 5",1,1,1,"cloudy"],
[34,"Ascendant Rank: Stage 6",1,1,1,"cloudy"],
[35,"Ascendant Rank: Stage 7",1,1,1,"cloudy"],
[36,"Ascendant Rank: Stage 8",1,1,1,"cloudy"],
[37,"Ascendant Rank: Pinnacle",1,1,1,"cloudy"],

];
//境界，X级存储了该等级的数据
//命名空间：0为境界编号，1为境界名（含颜色），2为提升属性，3为增加血量，4为需要经验值，5为display时使用realm_xxx类

const global_flags = {
    is_gathering_unlocked: false,
    is_crafting_unlocked: false,
    is_deep_forest_beaten: false,
    is_realm_enabled: false,
    is_family_enabled: false,
    is_evolve_studied:false,
    is_moonwheel_unlocked: false,
    qx_status: 0,
    lq_status: 0,//0:离开 1:杀害 2:侵犯
    qz_percent: 0,//牵制-从入门到精通 获取的百分比

    
};
const flag_unlock_texts = {
    is_gathering_unlocked: "You have gained the ability to gather materials!",
    is_crafting_unlocked: "You have gained the ability to craft items and equipment!",
    is_realm_enabled: "The path of evolution through [Tiny Flame] has been opened!",
    is_evolve_studied: "You have mastered the method to condense [Basic Evolution Crystal]!",
    is_moonwheel_unlocked: "You have mastered the crafting method for [Silver Frost Moonwheel]!",
    is_family_enabled: "【Family System】activated! (bottom-right third tab)",
}

// special stats

//infinity combat
let inf_combat = {"A6":{cur:6,cap:8},"A7":{cur:0}, "VP":{num:0}, "RM":0,"MP":0,"B3":0,"ST":0,"S3":{live:false,sp:0,b1:8,b2:8,b3:0}};
//A6:秘境
//A7:赶往声律城
//VP:心境一重价值点
//RM:不是现实机器。是Realm(领域)层数
//MP:心境二重宝钱数
//B3:辐射扩散程度(赫尔沼泽)
//B6:拯救商人数
//ST:SaveTime(上次保存时间)
//S3:第三幕最终战，live表示开战与否，sp灵魂之力,b1b2b3是怪物数。


//in seconds
let total_playtime = 0;

let total_deaths = 0;
let total_crafting_attempts = 0;
let total_crafting_successes = 0;
let total_kills = 0;

//current enemy
let current_enemies = null;

const enemy_attack_loops = {};
let enemy_attack_cooldowns;
let enemy_timer_variance_accumulator = [];
let enemy_timer_adjustment = [];
let enemy_timers = [];
let character_attack_loop;

//current location
let current_location;

let current_activity;

//resting, true -> health regenerates
let is_resting = true;

//sleeping, true -> health regenerates, timer goes up faster
let is_sleeping = false;

let last_location_with_bed = null; //actually last location where player slept!
let last_combat_location = null;

//reading, either null or book name
let is_reading = null;

//ticks between saves, 60 = ~1 minute
let save_period = 60;
let save_counter = 0;

//ticks between saves, 60 = ~1 minute
let backup_period = 3600;
let backup_counter = 0;

//accumulates deviations
let time_variance_accumulator = 0;
//all 3 used for calculating and adjusting tick durations
let time_adjustment = 0;
let start_date;
let end_date;

let current_dialogue;
const active_effects = {};
//e.g. health regen from food

let selected_stance = "normal";
let current_stance = "normal";
const faved_stances = {};

const trader_save_key_aliases = {
    "自动售货机": "Vending Machine",
    "矿井集市": "Mine Market",
    "营地商铺": "Camp Shop",
    "百宝楼": "Treasure Pavilion",
    "物品存储箱": "Storage Chest",
};

const skill_save_key_aliases = {
    "战斗": "Combat",
    "赤手空拳": "Unarmed",
    "拳法": "Unarmed",
    "武术": "Unarmed",
    "秘法入门": "Stance mastery",
    "秘法精通": "Stance mastery",
    "融血术": "MergeBlood",
    "三月断宵": "3Moon/Night",
    "星解之术": "StarDestruction",
    "微火": "Neko_Realm",
    "燃灼术": "Neko_Realm",
    "水无心": "WaterHeartless",
    "映星花": "ReflectStarFlower",
    "武器熟练": "Weapon mastery",
    "武器精通": "Weapon mastery",
    "剑术": "Swords",
    "戟术": "Tridents",
    "银霜月轮·未入门": "Moonwheels",
    "坚韧皮肤": "Iron skin",
    "铁制皮肤": "Iron skin",
    "精钢皮肤": "Iron skin",
    "讨价还价": "Haggling",
};

function resolve_trader_key(saved_key) {
    if(traders[saved_key]) {
        return saved_key;
    }

    const aliased_key = trader_save_key_aliases[saved_key];
    if(aliased_key && traders[aliased_key]) {
        return aliased_key;
    }

    const trader_by_name = Object.keys(traders).find((trader_key) => traders[trader_key].name === saved_key);
    return trader_by_name || null;
}

function resolve_skill_key(saved_key) {
    if(skills[saved_key]) {
        return saved_key;
    }

    const aliased_key = skill_save_key_aliases[saved_key];
    if(aliased_key && skills[aliased_key]) {
        return aliased_key;
    }

    const skill_by_name = Object.keys(skills).find((skill_key) => Object.values(skills[skill_key].names || {}).includes(saved_key));
    return skill_by_name || null;
}

function resolve_stance_key(saved_key) {
    if(stances[saved_key]) {
        return saved_key;
    }

    const stance_by_name_or_id = Object.keys(stances).find((stance_key) => stances[stance_key].id === saved_key || stances[stance_key].name === saved_key);
    return stance_by_name_or_id || null;
}

const tickrate = 1;
//how many ticks per second
//1 is the default value; going too high might make the game unstable

//stuff from options panel
const options = {
    uniform_text_size_in_action: false,
    auto_return_to_bed: false,
    remember_message_log_filters: false,
    remember_sorting_options: false,
    combat_disable_autoswitch: true,
    option_combat_filter: false,
    option_format_change: false,
};

let message_log_filters = {
    unlocks: true,
    events: true,
    combat: true,
    loot: true,
    crafting: true,
    background: true,
};

//enemy crit stats
const enemy_crit_chance = 0.1;
const enemy_crit_damage = 2; 

//character name
const name_field = document.getElementById("character_name_field");
name_field.value = character.name;
name_field.addEventListener("change", () => character.name = name_field.value.toString().trim().length>0?name_field.value:"Hero");

const time_field = document.getElementById("time_div");
time_field.innerHTML = current_game_time.toString();

(function setup(){
    Object.keys(skills).forEach(skill => {
        character.xp_bonuses.total_multiplier[skill] = 1;
    });
})();


function option_bed_return(option) {
    const checkbox = document.getElementById("options_bed_return");
    if(checkbox.checked || option) {
        options.auto_return_to_bed = true;
    } else {
        options.auto_return_to_bed = false;
    }

    if(option) {
        checkbox.checked = option;
    }
}

function option_remember_filters(option) {
    const checkbox = document.getElementById("options_save_messagelog_settings");
    if(checkbox.checked || option) {
        options.remember_message_log_filters = true;
    } else {
        options.remember_message_log_filters = false;
    }

    if(option) {
        checkbox.checked = option;

        if(message_log_filters.unlocks){
            document.documentElement.style.setProperty('--message_unlocks_display', 'inline-block');
        } else {
            document.documentElement.style.setProperty('--message_unlocks_display', 'none');
            document.getElementById("message_show_unlocks").classList.remove("active_selection_button");
        }

        if(message_log_filters.combat) {
            document.documentElement.style.setProperty('--message_combat_display', 'inline-block');
        } else {
            document.documentElement.style.setProperty('--message_combat_display', 'none');
            document.getElementById("message_show_combat").classList.remove("active_selection_button");
        }

        if(message_log_filters.events) {
            document.documentElement.style.setProperty('--message_events_display', 'inline-block');
        } else {
            document.documentElement.style.setProperty('--message_events_display', 'none');
            document.getElementById("message_show_events").classList.remove("active_selection_button");
        }

        if(message_log_filters.loot) {
            document.documentElement.style.setProperty('--message_loot_display', 'inline-block');
        } else {
            document.documentElement.style.setProperty('--message_loot_display', 'none');
            document.getElementById("message_show_loot").classList.remove("active_selection_button");
        }

        if(message_log_filters.crafting) {
            document.documentElement.style.setProperty('--message_crafting_display', 'inline-block');
        } else {
            document.documentElement.style.setProperty('--message_crafting_display', 'none');
            document.getElementById("message_show_crafting").classList.remove("active_selection_button");
        }

        if(message_log_filters.background) {
            document.documentElement.style.setProperty('--message_background_display', 'inline-block');
        } else {
            document.documentElement.style.setProperty('--message_background_display', 'none');
            document.getElementById("message_show_background").classList.remove("active_selection_button");
        }
    }
}

function option_combat_filter(option) {
    const checkbox = document.getElementById("options_combat_filter");

    if(checkbox.checked || option) {
        options.option_combat_filter = true;
    } else {
        options.option_combat_filter = false;
    }

    if(option) {
        checkbox.checked = option;
    }
}
function option_format_change(option) {
    const checkbox = document.getElementById("options_format_change");

    if(checkbox.checked || option) {
        options.option_format_change = true;
    } else {
        options.option_format_change = false;
    }

    if(option) {
        checkbox.checked = option;
    }
}
function option_combat_autoswitch(option) {
    const checkbox = document.getElementById("options_dont_autoswitch_to_combat");

    if(checkbox.checked || option) {
        options.disable_combat_autoswitch = true;
    } else {
        options.disable_combat_autoswitch = false;
    }

    if(option) {
        checkbox.checked = option;
    }
}
const bgm = document.getElementById('bgm');

const musicList = {
  1: 'bgms/1.mp3',
  2: 'bgms/2.mp3',
  3: 'bgms/3.mp3',
  4: 'bgms/4.mp3',
  5: 'bgms/5.mp3',
  6: 'bgms/6.mp3',
  7: 'bgms/7.mp3',
  8: 'bgms/8.mp3',
  9: 'bgms/9.mp3',
  10: 'bgms/10.mp3',
  11: 'bgms/11.mp3',
  12: 'bgms/12.mp3',
  13: 'bgms/13.mp3',
  14: 'bgms/14.mp3',
  15: 'bgms/15.mp3',
  16: 'bgms/16.mp3',
  17: 'bgms/17.mp3',
  18: 'bgms/18.mp3',
  19: 'bgms/19.mp3',
  20: 'bgms/20.mp3',
  21: 'bgms/21.mp3',
};

let hasPlayed = false;  // 确保只触发一次
let enableBGM = true;
let bgmUnlockedByUser = false;

function unlockBGMPlayback() {
    bgmUnlockedByUser = true;

    if(enableBGM && bgm.src) {
        hasPlayed = true;
        bgm.play().catch(error => {
            console.log("播放失败:", error);
            hasPlayed = false;
        });
    }
}

window.addEventListener("pointerdown", unlockBGMPlayback, {once: true});
window.addEventListener("keydown", unlockBGMPlayback, {once: true});

function switchBGM(key) {
    if(!enableBGM) return;
    const track = musicList[key];
    if(!track) return;

    if (!(bgm.src.includes(track) && bgm.src.length >= 5 && track.length >= 5)) {
        bgm.pause();
        bgm.src = track;
        bgm.load();
    }

    bgm.volume = 0.5;

    if(!bgmUnlockedByUser) {
        return;
    }

    if(!hasPlayed || bgm.paused) {
        hasPlayed = true;
        bgm.play().catch(error => {
            console.log("播放失败:", error);
            hasPlayed = false;
        });
    }
}


function option_uniform_textsize(option) {
    //doesn't really force same textsize, just changes some variables so they match
    const checkbox = document.getElementById("options_textsize");
    if(checkbox.checked || option) {
        options.uniform_text_size_in_action = true;    
        //document.documentElement.style.setProperty('--options_action_textsize', '20px');
        bgm.volume = 0;
        enableBGM = false;
    } else {
        options.uniform_text_size_in_action = false;
        document.documentElement.style.setProperty('--options_action_textsize', '16px');
        enableBGM = true;
        bgm.volume = 0.5;
    }

    if(option) {
        checkbox.checked = option;
    }
}


function change_location(location_name) {
    let location = locations[location_name] || Object.values(locations).find(existing_location => {
        return existing_location?.name === location_name || existing_location?.id === location_name;
    });

    if(!location) {
        console.warn(`No such location as "${location_name}"`);
        return;
    }

    if(location.bgm != "") switchBGM(location.bgm);

    if(location.name !== current_location?.name && location.is_finished) {
        return;
    }

    clear_all_enemy_attack_loops();
    clear_character_attack_loop();
    clear_enemies();

    if(typeof current_location !== "undefined" && current_location.name !== location.name ) { 
        //so it's not called when initializing the location on page load or on reloading current location (due to new unlocks)
        log_message(`[ Entering ${location.name} ]`, "message_travel");
    }

    if(location.crafting) {
        update_displayed_crafting_recipes();
    }
    
    current_location = location;

    update_character_stats();

    if("connected_locations" in current_location) { 
        // basically means it's a normal location and not a combat zone (as combat zone has only "parent")
        update_displayed_normal_location(current_location);
    } else { //so if entering combat zone
        update_displayed_combat_location(current_location);
        start_combat();

        if(!current_location.is_challenge) {
            last_combat_location = current_location.name;
        }
    }
}


/**
 * 
 * @param {String} location_name 
 * @returns {Boolean} if there's anything that can be unlocked by clearing it
 */
/*
function does_location_have_available_unlocks(location_name) {
    //include dialogue lines
    if(!locations[location_name]) {
        throw new Error(`No such location as "${location_name}"`);
    }
    let does = false;
    
    Object.keys(locations[location_name].repeatable_reward).forEach(reward_type_key => {
        if(does) {
            return;
        }
        if(reward_type_key === "textlines") {
            Object.keys(locations[location_name].repeatable_reward[reward_type_key]).forEach(textline_unlock => {
                if(does) {
                    return;
                }
                const {dialogue, lines} = locations[location_name].repeatable_reward[reward_type_key][textline_unlock];
                for(let i = 0; i < lines.length; i++) {
                    if(!dialogues[dialogue].textlines[lines[i]].is_unlocked) {
                        does = true;
                    }
                }
            });
        }

        if(reward_type_key === "locations") {
            Object.keys(locations[location_name].repeatable_reward[reward_type_key]).forEach(location_unlock => {
                if(does) {
                    return;
                }
                locations[location_name].repeatable_reward[reward_type_key][location_unlock];
                for(let i = 0; i < locations[location_name].repeatable_reward[reward_type_key][location_unlock].length; i++) {
                    const location_key = locations[location_name].repeatable_reward[reward_type_key][location_unlock][i].location;
                    if(!locations[location_key].is_unlocked) {
                        does = true;
                    }
                }
            });
        }

        if(reward_type_key === "activities") {
            //todo: additionally need to check if gathering is unlocked (if its a gathering activity) 
            Object.keys(locations[location_name].repeatable_reward[reward_type_key]).forEach(activity_unlock => {
                if(does) {
                    return;
                }

                for(let i = 0; i < locations[location_name].repeatable_reward[reward_type_key][activity_unlock].length; i++) {
                    const {location, activity} = locations[location_name].repeatable_reward[reward_type_key][activity_unlock][i];
                    if(!locations[location].activities[activity].is_unlocked) {
                        does = true;
                    }
                }
            });
        }

    });
}
*/
/**
 * 
 * @param {String} location_name 
 * @returns {Boolean} if there's something that can be unlocked by clearing it after additional conditions are met
 */
/*
function does_location_have_unavailable_unlocks(location_name) {

    if(!locations[location_name]) {
        throw new Error(`No such location as "${location_name}"`);
    }
    let does = false;
}
*/
/**
 * 
 * @param {Object} selected_activity - {id} of activity in Location's activities list??
 */
function start_activity(selected_activity) {
    current_activity = Object.assign({},current_location.activities[selected_activity]);
    current_activity.id = selected_activity;

    if(!activities[current_activity.activity_name]) {
        throw `No such activity as ${current_activity.activity_name} could be found`;
    }
    if(current_activity.exp_scaling)
    {

        current_activity.done_actions = (character.C_scaling[current_activity.scaling_id] || 0);
    
    }

    if(activities[current_activity.activity_name].type === "JOB") {
        if(!can_work(current_activity)) {
            current_activity = null;
            return;
        }

        current_activity.earnings = 0;
        current_activity.working_time = 0;

    } else if(activities[current_activity.activity_name].type === "TRAINING") {
        //
    } else if(activities[current_activity.activity_name].type === "GATHERING") { 
        //
    } else throw `"${activities[current_activity.activity_name].type}" is not a valid activity type!`;

    current_activity.gathering_time = 0;
    if(current_activity.gained_resources) {
        current_activity.gathering_time_needed = current_activity.getActivityEfficiency().gathering_time_needed;
    }


    start_activity_display(current_activity);
}

function end_activity() {
    let ActivityEndMap = {"Running":"Running","Swimming":"Swimming","mining":"Mining","woodcutting":"Woodcutting","fishing":"Fishing","AquaElement":"Aqua Element Sensing"}
    log_message(`${character.name} finished ${ActivityEndMap[current_activity.activity_name]}`, "activity_finished");
    if(current_activity.exp_scaling)
    {
        character.C_scaling[current_activity.scaling_id] = current_activity.done_actions;
        log_message(`This action has been performed ${current_activity.done_actions} times`, "activity_finished");
    
    }
    if(current_activity.earnings) {
        character.money += current_activity.earnings;
        log_message(`${character.name} earned ${format_money(current_activity.earnings)}`, "activity_money");
        update_displayed_money();
    }
    end_activity_animation(); //clears the "animation"
    current_activity = null;
    change_location(current_location.name);
}

/**
 * @description Unlocks an activity and adds a proper message to the message log. NOT called on loading a save.
 * @param {Object} activity_data {activity, location_name}
 */
 function unlock_activity(activity_data) {
    if(!activity_data.activity.is_unlocked){
        activity_data.activity.is_unlocked = true;
        
        let message = "";
        const loc = locations[activity_data.location] || Object.values(locations).find(l => l.name === activity_data.location);
        if(loc?.activities[activity_data.activity.activity_name].unlock_text) {
           message = loc.activities[activity_data.activity.activity_name].unlock_text+":<br>";
        }
        log_message(message + `Unlocked activity "${activity_data.activity.activity_name}" - "${loc?.name || activity_data.location}"`, "activity_unlocked");
    }
}

//single tick of resting
function do_resting() {
    if(character.stats.full.health < character.stats.full.max_health)
    {
        const resting_heal_ammount = Math.max(character.stats.full.max_health * 0.02,2); 
        //todo: scale it with skill, because why not?; maybe up to x2 bonus

        character.stats.full.health += (resting_heal_ammount);
        if(character.stats.full.health > character.stats.full.max_health) {
            character.stats.full.health = character.stats.full.max_health;
        } 
        update_displayed_health();
    }

}

function do_sleeping() {
    if(character.stats.full.health < character.stats.full.max_health)
    {
        const sleeping_heal_ammount = Math.round(Math.max(character.stats.full.max_health * 0.1, 5));
        
        character.stats.full.health += (sleeping_heal_ammount);
        if(character.stats.full.health > character.stats.full.max_health) {
            character.stats.full.health = character.stats.full.max_health;
        } 
        update_displayed_health();
    }
}

function start_sleeping() {
    start_sleeping_display();
    is_sleeping = true;

    last_location_with_bed = current_location.name;
}

function end_sleeping() {
    is_sleeping = false;
    change_location(current_location.name);
    end_activity_animation();
}

function start_reading(book_key) {
    const book_id = JSON.parse(book_key).id;
    if(locations[current_location]?.parent_location) {
        return; //no reading in combat areas
    }

    if(is_reading === book_id) {
        end_reading();
        return; 
        //reading the same one, cancel
    } else if(is_reading) {
        end_reading();
    }

    if(book_stats[book_id].is_finished) {
        return; //already read
    }

    if(is_sleeping) {
        end_sleeping();
    }
    if(current_activity) {
        end_activity();
    }


    is_reading = book_id;
    start_reading_display(book_id);

    update_displayed_book(is_reading);
}

function end_reading() {
    change_location(current_location.name);
    end_activity_animation();
    
    const book_id = is_reading;
    is_reading = null;

    update_displayed_book(book_id);
}

function do_reading() {
    item_templates[is_reading].addProgress();

    update_displayed_book(is_reading);

    add_xp_to_skill({skill: skills["Literacy"], xp_to_add: book_stats.literacy_xp_rate});
    if(book_stats[is_reading].is_finished) {
        log_message(`Finished the book "${is_reading}"`);
        end_reading();
        update_character_stats();
    }
}

function get_current_book() {
    return is_reading;
}

/**
 * 
 * @param {*} selected_job location job property
 * @returns if current time is within working hours
 */
function can_work(selected_job) {
    //if can start at all
    if(!selected_job.infinite) {
        if(selected_job.availability_time.end > selected_job.availability_time.start) {
            //ends on the same day
            if(current_game_time.hour * 60 + current_game_time.minute > selected_job.availability_time.end*60
                ||  //too late
                current_game_time.hour * 60 + current_game_time.minute < selected_job.availability_time.start*60
                ) {  //too early
                
                return false;
            }
        } else {
            //ends on the next day (i.e. working through the night)        
            if(current_game_time.hour * 60 + current_game_time.minute > selected_job.availability_time.start*60
                //too late
                ||
                current_game_time.hour * 60 + current_game_time.minute < selected_job.availability_time.end*60
                //too early

            ) {  
                return false;
            }
        }
    }

    return true;
}

/**
 * 
 * @param {} selected_job location job property
 * @returns if there's enough time to earn anything
 */
function enough_time_for_earnings(selected_job) {

    if(!selected_job.infinite) {
        //if enough time for at least 1 working period
        if(selected_job.availability_time.end > selected_job.availability_time.start) {
            //ends on the same day
            if(current_game_time.hour * 60 + current_game_time.minute + selected_job.working_period - selected_job.working_time%selected_job.working_period > selected_job.availability_time.end*60
                ||  //not enough time left for another work period
                current_game_time.hour * 60 + current_game_time.minute < selected_job.availability_time.start*60
                ) {  //too early to start (shouldn't be allowed to start and get here at all)
                return false;
            }
        } else {
            //ends on the next day (i.e. working through the night)        
            if(current_game_time.hour * 60 + current_game_time.minute > selected_job.availability_time.start*60
                //timer is past the starting hour, so it's the same day as job starts
                && 
                current_game_time.hour * 60 + current_game_time.minute + selected_job.working_period  - selected_job.working_time%selected_job.working_period > selected_job.availability_time.end*60 + 24*60
                //time available on this day + time available on next day are less than time needed
                ||
                current_game_time.hour * 60 + current_game_time.minute < selected_job.availability_time.start*60
                //timer is less than the starting hour, so it's the next day
                &&
                current_game_time.hour * 60 + current_game_time.minute + selected_job.working_period  - selected_job.working_time%selected_job.working_period > selected_job.availability_time.end*60
                //time left on this day is not enough to finish
                ) {  
                return false;
            }
        }
    }

    return true;
}

/**
 * 
 * @param {String} dialogue_key 
 */
function start_dialogue(dialogue_key) {
    current_dialogue = dialogue_key;

    update_displayed_dialogue(dialogue_key);
}

function end_dialogue() {
    current_dialogue = null;
    reload_normal_location();
}
function reload_normal_location() {
    update_displayed_normal_location(current_location);
}
function get_enemy_killcount(){
    let bestiary_div =document.getElementById("bestiary_list");
    let bestiary_childs = bestiary_div.querySelectorAll('.bestiary_entry_div');
    let K_sum = 0;
    let K_num;
    bestiary_childs.forEach((div, index) => {
        K_num = div.children[1].innerHTML;
        if(K_num[0] != '<')
        {
            K_sum += Number(K_num);
        }
    });
    return K_sum;
}
function textline_special(t_key){
    let displayed_text = "";
        if(t_key == "DeathCount-1")
        {   
            displayed_text = "By now, I've experienced " + format_number(total_deaths) + " brushes with death,<br>and I finally understand what father meant.";
        }
        else if(t_key == "Realm-A3"){   
            displayed_text = `……<span class="realm_terra">${window.REALMS[character.xp.current_level][1]}</span>？！` ;
        }
        else if(t_key == "Realm-A4"){   
            let a4_realm = character.xp.current_level;
            if(a4_realm >= 12) displayed_text = `You've already reached mid-Earth Rank and you're still not going?<br>If you keep acting like this, don't call yourself my daughter!<br>` ;
            else displayed_text = `Your self-created sword technique<br>is enough to let you demonstrate strength beyond Earth Rank Stage 5.<br>` ;

            if(enemy_killcount["百方[荒兽森林 ver.][BOSS]"]) displayed_text += "...Wait, you already beat Baifang to tears???<br>";
            else displayed_text += "Once your training bears fruit, that mere Baifang will be nothing to fear!<br>";

            displayed_text += "The family secret realm opens once every half year.<br>During this time, stay with the family<br>and consolidate your current realm strength.";
            let T=(current_game_time.day-1)*10800+current_game_time.hour*60+current_game_time.minute;
            T=T%270000;
            T=270000-T;
            current_game_time.go_up(T)
            displayed_text += `<br><br>Skipped ${Math.floor(T/10800)} Xuelo days, ${Math.floor((T%10800)/60)} hours, ${T%60} minutes of in-game time.`;
            displayed_text += `<br><br>During this time, ${character.name} cultivated and gained ${format_number(Math.sqrt(T*1e10))} XP!`;
            add_xp_to_character(Math.sqrt(T*1e10),false);
            update_displayed_time();
        }
        else if(t_key == "A6-check"){
            displayed_text += `Current formation strength: ${inf_combat.A6.cur} layers, <br>cap: ${inf_combat.A6.cap} layers!`;
            displayed_text += `<br>Current effects: <br>Enemy stats +${inf_combat.A6.cur*8}%  <br>Loot +${(Math.pow(1+inf_combat.A6.cur*0.08,1)*100-100).toFixed(2)}%<br>XP +${(Math.pow(1+inf_combat.A6.cur*0.08,1.5)*100-100).toFixed(2)}%`;
        }   
        else if(t_key == "A6-up"){
            if(inf_combat.A6.cur < inf_combat.A6.cap){
                inf_combat.A6.cur++;
                if(inf_combat.A6.cur < 9999) displayed_text += `Power increased! Current strength: ${inf_combat.A6.cur-1} -> ${inf_combat.A6.cur}`;
                else displayed_text += `Formation power has reached the absolute cap [9999].`
                inf_combat.A6.cur = Math.min(inf_combat.A6.cur,9999);

            }
            else{
                displayed_text += `Formation power has reached the current cap...<br>To raise it further, clear the enemies again first.`;
            }
        }   
        else if(t_key == "A6-max"){
            if(inf_combat.A6.cur < inf_combat.A6.cap){
                let d_cur = inf_combat.A6.cur;
                inf_combat.A6.cur = inf_combat.A6.cap;
                if(inf_combat.A6.cur < 9999) displayed_text += `Power maxed! Current strength: ${d_cur} -> ${inf_combat.A6.cur}`;
                else displayed_text += `Formation power has reached the absolute cap [9999].`
                inf_combat.A6.cur = Math.min(inf_combat.A6.cur,9999);

            }
            else{
                displayed_text += `Formation power has reached the current cap...<br>To raise it further, clear the enemies again first.`;
            }
        }   
        else if(t_key == "A6-down"){
            if(inf_combat.A6.cur > 6){
                inf_combat.A6.cur--;
                displayed_text += `Power decreased! Current strength: ${inf_combat.A6.cur+1} -> ${inf_combat.A6.cur}`;
            }
            else{
                displayed_text += `If you want a formation with fewer than five layers, just go to the previous area...`;
            }
        }  
        else if(t_key == "A7-begin"){
            let age=Math.round(current_game_time.year - 1359 + (current_game_time.era-31698)*10081);
            displayed_text += `To be at the <span class="realm_terra">${window.REALMS[character.xp.current_level][1]}</span> realm, <br>at the age of ${age},<br>and make it here to the Boundary Lake - you are already a remarkable descendant of the Na family.`;

            displayed_text += `<br>  If the Na family produces a genius,<br>perhaps we can rise again and avenge my unfinished grudges.<br>`;

            if(character.xp.current_level >= 15) displayed_text += `The barrier has loosened to this extent...<br>Before, only cultivators below mid-Earth Rank could enter here.<br>`;
            if(age <= 12) displayed_text += `Wow!!! So young! The revival of the Na family is imminent!<br>`;
            if(age >= 1000) displayed_text += `I was thinking... I slept here for less than an era,<br>and the cosmic laws outside have changed?<br>Shouldn't Earth Rank only have a lifespan of 0.1 era...<br>`;
            else if(age >= 500) displayed_text += `Hey hey, isn't this a secret realm meant for young people of the Na family...<br>`;
            else if(age >= 50) displayed_text += `Hmm, what age... never mind.<br>As long as there's insight, it's never too late to start!<br>`;
            
        }
        else if(t_key == "A7-exp"){
            add_xp_to_skill({skill: skills["Stance mastery"], xp_to_add: 9.999e11});
            displayed_text += `<br><br> Gained 999.9 billion [Stance Mastery] XP.`;
        }
        else if(t_key == "A8-killcount"){
            let killcount = get_enemy_killcount();
            displayed_text += `So far, ${character.name} <br>has dealt ${killcount} kills.<br><br>`;
            if(killcount < 5e4) displayed_text += `To live in such a world<br>without causing needless slaughter,<br>${character.name} is among the most unblemished late-Earth Rank experts<br>in all of Yangang Territory.`;
            else if(killcount < 2e5) displayed_text += `On the ruthless Xuelo Continent,<br>the strong preying on the weak is natural.<br>As long as your conscience is clear,<br>enemies are merely stepping stones on the path forward.`;
            else if(killcount < 1e6) displayed_text += `Whenever cold enemies transform into warm<br><b>gems, coins, and value points,</b><br>${character.name} feels a wave of warmth rising from their heart.<br>More killing might help absorb Xuelo crystals in the distant future,<br>but more importantly, don't lose your reason to bloodlust.`;
            else{
                displayed_text += `Pure ${character.name}<br>Kind ${character.name}<br>Good child ${character.name}<br>This is a game<br>Let me see just how far<br>you can fall into corruption`;
            }
        }
        else if(t_key == "JY-check"){
            let C_HP = character.stats.full.max_health;
            let C_realm = character.xp.current_level;
            if(C_realm >= 22) displayed_text += `This idol is insufficient to bless a powerful cultivator like ${character.name}...`;
            else{
                displayed_text += `Based on ${format_number(C_HP)} HP,<br>the cost of one blessing is ${format_money(Math.round(C_HP ** 1.35))}<br>`;
                let C_moon = current_game_time.moon();
                let MM1 = ["New Moon","Crescent Moon","First Quarter","Waxing Gibbous","Full Moon","Waning Gibbous","Last Quarter","Waning Crescent"];
                let MM2 = ["HP Regen 1%","Max HP x 1.5","Crit Damage x 1.6","Normal ATK x 1.4","Attack x 1.1","Defense x 1.2","Agility x 1.2","Speed x 1.1"];
                displayed_text += `<br>Current moon phase: ${MM1[C_moon]},<br>Blessing effect: ${MM2[C_moon]}. (1800s)`
                displayed_text += `<br>⚠️ Accepting the Moonlight Blessing will clear all existing status effects ⚠️`;
                
            }
        }
        else if(t_key == "LR-check"){
            let C_HP = character.stats.full.max_health;
            let C_realm = character.xp.current_level;
            if(C_realm >= 32){
                displayed_text += `This idol can only clear status effects for a powerhouse like ${character.name}...`;
                displayed_text += `Based on ${format_number(C_HP)} max HP,<br>one blessing costs ${format_money(Math.round(C_HP ** 1.4))}<br>`;
            }
            else{
                displayed_text += `Based on ${format_number(C_HP)} max HP,<br>one blessing costs ${format_money(Math.round(C_HP ** 1.4))}<br>`;
                let C_time = current_game_time.hour + current_game_time.minute / 60;
                C_time = Math.floor(C_time / 22.5)
                let MM1 = ["0-23","23-45","45-67","67-90","90-113","113-135","135-157","157-180"];
                let MM2 = ["Max HP x 1.8","HP Regen 1.5%","Attack Damage x 1.2","Attack Speed x 1.15","Restraint [80% Efficacy]","Magic Attack [20% Ratio]","Windback [80% Multiplier]","Fortify [8% Absorb Threshold]"];
                displayed_text += `<br>Current time period: ${MM1[C_time]},<br>Blessing effect: ${MM2[C_time]} (1800s)`
                displayed_text += `<br>⚠️Accepting the Blazing Sun Blessing will clear all existing status effects⚠️`;
                /*
                
<br>·乾:血量*1.8,兑:回血+1.5%,离:攻击*1.2,震:攻速*1.15.
<br>·巽:牵制80%,坎:魔攻20%,艮:回风/普攻倍率*0.8,坤:坚固(受伤上限8%/无副作用)

                */
                
            }
        }
        else if(t_key == "JY-sacrifice"){
            let C_realm = character.xp.current_level;
            if(C_realm >= 22) displayed_text += `This idol is insufficient to bless a powerful cultivator like ${character.name}...`;
            else{
                let C_money = Math.round(character.stats.full.max_health ** 1.35);
                if(character.money < C_money)
                {
                    displayed_text += `Ding~ Insufficient funds!<br> ${format_money(character.money)} / ${format_money(C_money)}`;
                }
                else
                {
                    displayed_text += `Wallet: ${format_money(character.money)} ->`;
                    character.money -= C_money;
                    displayed_text += `${format_money(character.money)}.<br>`;
                    update_displayed_money();
                    displayed_text += `All existing status effects have been purified by the Moonlight!`;
                    
                    Object.keys(active_effects).forEach(key => {
                        delete active_effects[key];
                    });
                    let MM3 = ["New Moon","Crescent Moon","First Quarter","Waxing Gibbous","Full Moon","Waning Gibbous","Last Quarter","Waning Crescent"];
                    let C_moon = current_game_time.moon();
                    let moon_effect = "Moonlight Blessing: "+MM3[C_moon];
                    active_effects[moon_effect] = new ActiveEffect({...effect_templates[moon_effect], duration:1800});
                    
                    character.stats.add_active_effect_bonus();
                    update_character_stats();
                    update_displayed_effect_durations();
                    update_displayed_effects();


                }
            }
        }
        else if(t_key == "LR-sacrifice"){
            let C_realm = character.xp.current_level;
            
                let C_money = Math.round(character.stats.full.max_health ** 1.4);
                if(character.money < C_money)
                {
                    displayed_text += `Ding~ Insufficient funds!<br> ${format_money(character.money)} / ${format_money(C_money)}`;
                }
                else
                {
                    displayed_text += `Wallet: ${format_money(character.money)} ->`;
                    character.money -= C_money;
                    displayed_text += `${format_money(character.money)}.<br>`;
                    update_displayed_money();
                    displayed_text += `All existing status effects have been purified by the Blazing Sun!`;

                    Object.keys(active_effects).forEach(key => {
                        delete active_effects[key];
                    });
                    if(C_realm >= 32) displayed_text += `This idol can only clear status effects for a powerhouse like ${character.name}...`;
                    else{
                        let MM3 = ["乾","兑","离","震","巽","坎","艮","坤"];
                        let C_time = current_game_time.hour + current_game_time.minute / 60;
                        C_time = Math.floor(C_time / 22.5)
                        let moon_effect = "烈日祝福·"+MM3[C_time];
                        active_effects[moon_effect] = new ActiveEffect({...effect_templates[moon_effect], duration:1800});
                        
                        character.stats.add_active_effect_bonus();
                        update_character_stats();
                        update_displayed_effect_durations();
                        update_displayed_effects();
                    }
                }
        }
        else if(t_key == "A7-reactor"){
            start_reactor_minigame();
        }
        else if(t_key == "freezing-engine"){
            start_engine_minigame();
        }
        else if(t_key == "grass-field"){
            start_grass_minigame();
        }
        else if(t_key == "realm-II"){
            displayed_text += 'Upon seeing this ice-blue hexagram formation, so many things fell into place…<br>';
            displayed_text += 'The water-element secret arts I once comprehended,<br>';
            displayed_text += 'have fully merged with the fire-element domain.<br>';
            displayed_text += 'Who would have thought… such a wondrous phenomenon could emerge.<br>';
            displayed_text += 'Two mutually opposing elements that should be nearly impossible to reconcile.<br>';
            displayed_text += 'Yet once the perfect threshold is reached,<br>';
            displayed_text += 'one can step into the profound realm of [Icefire Duality],<br>';
            displayed_text += 'and unleash unimaginable power!<br>';
            if(skills["Neko_Realm"].current_level <= 29){
                    displayed_text += `, [Fire Spirit Phantom Sea] gained 51.2 × 10²⁰ XP!<br>`;
            }
            else{
                    displayed_text += `[Blazing Frost Sky] gained 51.2 × 10²⁰ XP…?<br>`;
                    displayed_text += `How did the realm break through again?! You're grinding way too fast!!<br>`;
            }
            add_xp_to_skill({skill: skills["Neko_Realm"], xp_to_add: 51.2e20,should_info:true,use_bonus:false,add_to_parent:false},);
        }
        else if(t_key == "jjhzx"){

            if(character.equipment.special?.name == "Boundary Lake Heart")
            {
                character.equipment.special = null;
                add_to_character_inventory([{item: item_templates["结界湖之心·材"], count: 1}]);
                update_displayed_equipment(); 
                character.stats.add_all_equipment_bonus();
                update_displayed_stats();
                displayed_text += `Your [Boundary Lake Heart] has been transformed into [Boundary Lake Heart (Material)],<br>and can be further upgraded to [Ship Heart].`;
                log_message("Obtained Boundary Lake Heart (Material)","combat_loot");
            }
            else displayed_text += `Please equip the [Boundary Lake Heart] and try again!`;
        }
        else if(t_key == "byzx"){

            if(character.equipment.special?.id == "冰原之心")
            {
                character.equipment.special = null;
                add_to_character_inventory([{item: item_templates["冰原之心·材"], count: 1}]);
                update_displayed_equipment(); 
                character.stats.add_all_equipment_bonus();
                update_displayed_stats();
                displayed_text += `Your [Arctic Heart] has been transformed into [Arctic Heart (Material)],<br>and can be further upgraded to [Illusory Heart].`;
                log_message("Obtained Arctic Heart (Material)","combat_loot");
            }
            else displayed_text += `Please equip the [Arctic Heart] and try again!`;
        }
        else if(t_key == "3-1-nanami"){
            if(character.equipment.special?.name == "Nanami (Spaceship)") displayed_text += `(pat) Koko, Sky Rank usually means you won't get fevers anymore.<br>Hasn't she always been dragged by your side, refusing to let go?<br>`;
            else displayed_text += `Yes, she left without a moment's hesitation.<br>Nana, that child, has the heart of a true strong one.<br>`;

            let hx_money = 1e18 / (current_game_time.day_count ** 2); 
            hx_money *= Math.random()*0.4+0.8;
            hx_money = Math.round(hx_money);
            displayed_text += `The Neko sisters have only trained for ${current_game_time.day_count} days, yet both broke through to Sky Rank,<br>an incredibly rare occurrence in all of Yangang Territory. Countless people came to congratulate them.<br>They brought a total of ${format_money(hx_money)} in gifts.<br>Nabu added another 20% of his own,<br>splitting it equally between Neko and Nanami.<br>Neko received ${format_money(Math.round(hx_money * 0.6))}`;
            character.money += Math.round(hx_money * 0.6);
            update_displayed_money();

            displayed_text += `[Nabu] Don't worry too much about your sister's matters.<br>Just focus on your cultivation until you've fully grown,<br>then you can go assist her.`;
        }
        else if(t_key.includes("pz")){
            let T_S = t_key;
            let pz_map = {"pz-Bq":"紫色刀币","pz-my":"秘银锭","pz-bs":"史诗黄宝石"};//凭证
            let cs_map = {"pz-Bq":250,"pz-my":30,"pz-bs":80};//cost
            //检查物品是否足够，扣除物品，如果不够就返回
            let pz_key = "{\"id\":\""+"荒兽凭证"+"\"}";//凭证
            let C_pz = cs_map[T_S];//Cost_凭证
            if(character.inventory[pz_key] != undefined)
            {
                let T_cnt = Math.floor(character.inventory[pz_key].count/C_pz);
                if(T_cnt != 0) remove_from_character_inventory([{ 
                    item_key: pz_key,           
                    item_count: C_pz * T_cnt,
                }]);
                if(T_cnt != 0) add_to_character_inventory([{ "item": getItem(item_templates[pz_map[T_S]]), "count": T_cnt }]);
                displayed_text += `Consumed ${C_pz * T_cnt} Wild Beast Voucher(s),<br>`;
                displayed_text += `Exchanged for ${T_cnt} x ${item_templates[pz_map[T_S]].getName()}.<br>`;

            }
            else displayed_text += `[Wild Beast Voucher] not found!<br>You need it at the exchange point to trade for items...`;
        }
        else if(t_key.includes("gacha")){
            let cnt = 1;
            if(t_key == 'gacha-10') cnt = 10;
            if(t_key == 'gacha-50') cnt = 50;
            let cur_cost = cnt==1?10:(cnt*9);
            let fj_key = "{\"id\":\""+"传承水晶·粉"+"\"}";//粉
            if(character.inventory[fj_key] != undefined)
            {

                let cur_cnt = character.inventory[fj_key].count;//目前的粉色数量
                if(cur_cnt >= cur_cost)
                    {
                    remove_from_character_inventory([{ 
                        item_key: fj_key,           
                        item_count: cur_cost,
                    }]);
                    //宝石母锭 & 幻境符文 & 紫晶碎片 & 天空级魂魄 & 传说红宝石：安慰奖，各12.4%
                    //魂晶锭 & 血莲鱼 & 传说绿宝石 & 宇宙币：罕见物品，各8% 还有8%
                    //血杀剑 & 冰柱鱼王 &中等进化结晶碎片：稀有物品，各2%
                    //【峰】：隐藏物品，兆分之一的概率
                    displayed_text += `Gacha results:<br>`;
                    for(let c_num = 1;c_num <= cnt;c_num ++){
                        let gacha_RNG = Math.random();
                        let reward_list = {1:{1:"宝石母锭",2:"幻境符文",3:"紫晶碎片",4:"天空级魂魄",5:"绝音蕨",6:"绝音蕨"},2:{1:"魂晶锭",2:"血莲鱼",3:"传说绿宝石",4:"宇宙币"},3:{1:"血杀剑",2:"冰柱鱼王",3:"中等进化结晶碎片",4:"噬芒兰"},4:{1:"峰",2:"峰"}};
                        let reward_lvl = 0;
                        if(gacha_RNG<0.62) reward_lvl = 1;
                        else if(gacha_RNG<0.94

                        ) reward_lvl = 2;
                        else if(gacha_RNG<0.9999) reward_lvl = 3;
                        else{
                            let RNG2 = Math.random(),RNG3 = Math.random();
                            if(RNG2<0.0001 && RNG3<0.0001){
                                reward_lvl = 4;
                            }
                            else reward_lvl = 3;
                        }
                        let reward_total = (reward_lvl<=2)?(8-2*reward_lvl):(10-2*reward_lvl);
                        let reward_order = Math.floor(Math.random()*(reward_total))+1;
                        if(reward_order > reward_total) reward_order = reward_total;
                        let reward_name = reward_list[reward_lvl][reward_order];
                        let reward_style = {1:"style='filter:drop-shadow(0 0 5px #0f0)'",2:"style='filter:drop-shadow(0 0 9px #0cf) drop-shadow(0 0 9px #0f0) '",3:"style='filter: drop-shadow(0 0 12px #c0f) drop-shadow(0 0 9px #00f) drop-shadow(0 0 6px #0cf)'",4:"style='filter:drop-shadow(0 0 20px #f00) drop-shadow(0 0 20px #f00) drop-shadow(0 0 20px #f00) drop-shadow(0 0 20px #f00) drop-shadow(0 0 20px #f00)"}
                        add_to_character_inventory([{ "item": getItem(item_templates[reward_name]), "count": 1 }]);
                        displayed_text += `<img src=${item_templates[reward_name].image} ${reward_style[reward_lvl]}>`;
                        if(c_num%10 == 0) displayed_text += "<br><br>";
                        else displayed_text += ` , `

                        //<img src="https://picsum.photos/100" style="filter:drop-shadow(0 0 10px #0ff) drop-shadow(0 0 25px #0ff)">
                    }
                }
                else displayed_text += `[Legacy Crystal (Pink)] insufficient! ${cur_cnt} / ${cur_cost}`;

            }
            else displayed_text += `[Legacy Crystal (Pink)] not found!<br>You need it to use the gacha...`;
        }
        else if(t_key == "lf-1"){
            displayed_text +=  `Your mental force is impressive, and you possess ${inf_combat.RM==2?"first":"second"}-layer domain,<br>
            but ${(character.equipment.weapon==undefined)?("fighting barehanded"):((character.equipment.weapon.weapon_type=="sword")?"that sword in your hand":"that trident in your hand")} doesn't suit you.<br>
            You'd be far stronger with a psychic weapon.<br><br>
            This [Silver Frost Moonwheel] I just crafted by hand,<br>
            along with the crafting method for this type of moonwheel,<br>
            I'll give to you.
            `
            unlock_moonwheel();
            add_to_character_inventory([{item: getItem({...item_templates["秘银月轮"], quality: 159}), count: 1}]);
            log_message("Hint: Wheel Blade + Wheel Core assembly is now unlocked","enemy_enhanced")
        }
        else if(t_key == "lf-leave"){
            remove_from_character_inventory([{item_key:"{\"id\":\"峰\"}"}]);
        }
        else if(t_key == "kill-zh"){
            add_to_character_inventory([{item: getItem({...item_templates["晶化剑"], quality: 239}), count: 1}]);add_to_character_inventory([{ "item": getItem(item_templates["沼泽·荒兽肉块"]), "count": 5 }]);
            character.money += 259346107197056;
            update_displayed_money();
        }
        else if(t_key == "moonwheel-lv40"){
            add_xp_to_skill({skill: skills["Moonwheels"], xp_to_add: 2.99e20,should_info:true,use_bonus:false,add_to_parent:false},);
        }
        else if(t_key == "realm-III"){
            if(skills["Neko_Realm"].current_level <= 34){
                    displayed_text += `[Blazing Frost Sky (Domain II)] gained 1.68 × 10²⁴ XP!<br>`;
            }
            else{
                    displayed_text += `[Blazing Frost Sky (Domain III)] gained 1.68 × 10²⁴ XP!<br>`;
                    displayed_text += `Breaking through early this time… honestly not surprising (lol)!<br>`;
            }
            add_xp_to_skill({skill: skills["Neko_Realm"], xp_to_add: 1.68e24,should_info:true,use_bonus:false,add_to_parent:false},);
            add_xp_to_skill({skill: skills["AquaElement"], xp_to_add: 3997e4,should_info:true,use_bonus:false,add_to_parent:false},);
        }
        else if(t_key == "realm-IV"){
            if(skills["Neko_Realm"].current_level <= 39){
                    displayed_text += `[Blazing Frost Sky (Domain III)] gained 64 × 10²⁴ XP!<br>(Up until now,<br>having faced a Domain-rank powerhouse head-on<br>and felt the overwhelming pressure of their domain,<br>the fourth-layer domain that was already on the verge of breakthrough<br>finally took its last step forward.)`;

            }
            else{
                    displayed_text += `[Rising Cloud Falling Moon (Domain IV)] gained 64 × 10²⁴ XP!<br>`;
                    displayed_text += `Sorry, Sayuki went to take the gaokao… Someone's already at level 48 and we haven't even broken through?! Meow nooo!!<br>`;
            }
            add_xp_to_skill({skill: skills["Neko_Realm"], xp_to_add: 64e24,should_info:true,use_bonus:false,add_to_parent:false},);
        }else if(t_key == "S3-start"){
            inf_combat.S3 = {live:true,sp:0,b1:8,b2:8,b3:0};

        }
        else if(t_key == "qx-kill"){
            character.money += 923124981247561;
            global_flags['qx_status'] = 1;
            update_displayed_money();
        }else if(t_key == "qx-sox"){
            global_flags['qx_status'] = 2;
            current_game_time.go_up(10800);
        }
        else if(t_key == "lq-kill"){
            character.money += 5810358643364656;
            global_flags['lq_status'] = 1;
            update_displayed_money();
        }else if(t_key == "lq-sox"){
            global_flags['lq_status'] = 2;
            current_game_time.go_up(32400);
        }
        else if(t_key == "heartdemon-lord"){
            displayed_text += `[Heart Demon Lord] Hmph, self-destruct!<br>Even a Cloudy Sky-rank powerhouse<br>couldn't withstand 16 trillion damage!<br>`;
            let qz_perc = global_flags["qz_percent"];
            displayed_text += `…Huh? Suppress ${100 - qz_perc}%, Restraint ${qz_perc}%?<br>`;
            if(qz_perc < 30) displayed_text += `Hahaha — so what if you fear Restraint?<br>A skill you don't even know — how could I possibly imitate it?<br>Forced erasure! Gathering all the power of the Heart Demon,<br>I swear to make you… fall into eternal slumber!`;
            else if(qz_perc < 70) displayed_text += `You even snuck a look at the Restraint Tome, one of the Five Forbidden Books of Yangang Territory!<br>You've never used it yourself, never even wanted to…<br>Just to set me up?!<br>…Forced erasure… gathering power…<br>I will make you… fall into eternal slumber!`;
            else displayed_text += `The Restraint Tome truly deserves its place among Yangang Territory's Five Forbidden Books…<br>Damn, less than a tenth of my power remains.<br>Where in the world did you get this?<br>Those shady merchants outside,<br>or some long-sealed ancient tomb?<br><br>Heh… any chance we could just call it even?`
        }
        else if(t_key == "save"){
                var a = window.document.createElement('a');
                a.href = window.URL.createObjectURL(new Blob([save_to_file()], {type: 'text/plain'}));
                a.download = `Autosave_corrupt_prevention`;

                document.body.appendChild(a);
                a.click();

                document.body.removeChild(a);
        }
        else if(t_key.includes("P3")){
            if(t_key == "P3-1"){
                displayed_text += global_flags['lq_status']==1?"The original #2 on the power ranking wasn't actually Lan Qi — it was <span style='color:aqua'>Bing Lan</span>.<br>But she fell in the darkness before dawn…":`Look, the one beside me isn't Lan Qi either — she's <span style='color:aqua'>Bing Lan</span><br><br>[Bing Lan] …Mm-hm…`;
            }if(t_key == "P3-2"){
                displayed_text += global_flags['qx_status']==1?"Qiu Xing is one such example…<br>Though there's no need to worry about the Bing Clan issuing a kill order.<br>As a death warrior, dying in the treacherous Water Prison<br>was an occupational hazard.":`<br>[Qiu Xing] Ehh, my lady.<br>That's a bit too cruel of a way to put it.<br>The master has treated us well,<br>we were simply following orders.`;
            }if(t_key == "P3-3"){
                displayed_text += global_flags['lq_status']==1?"[Nako] Then, the reason the power ranking was drawn up…<br><br>[Bing Xiyue] Oh my, you'd have to ask Bing Lan about that…<br>The latest power ranking was her brainchild after all.":`[Nako] Then, Lan Qi… Miss Bing Lan,<br>why exactly was the power ranking drawn up?<br><br>[Bing Lan] …Zuoa is a very suspicious person.<br>I've been keeping my strength at Sky-Rank Stage 6 —<br>if this went on, he would eventually grow suspicious.<br>The [Power Ranking] is a form of cover,<br>making Zuoa think I'm the type who enjoys<br>suppressing others and looking down from above.<br><br>[Mor] Yes, and in that old scoundrel's eyes,<br>such a ranking seemed beneficial to his rules of slaughter.<br>Heh, he thought he could easily control the whole situation.`;
            }
            if(t_key == "P3-4"){
                let kr = (global_flags['qx_status']==1?1:0) + (global_flags['lq_status']==1?1:0);
                if(kr == 0){
                    displayed_text += "[Bing Lan] You two, a great debt cannot be repaid in words.<br>From this day forward, wherever our clan's bloodline reaches,<br>you shall be honored as the highest guests,<br>and even at the cost of our lives, we will ensure your safety.<br><br>[Bing Xiyue] Ohh, quite the presence!<br>Say, Xiao Lan, you've said so much<br>all in one go today? That's rare.<br>Time to go home.<br>Miss Nako… thank you.<br>Take this — till we meet again.<br><br>With a wave of Bing Xiyue's jade hand,<br>a jade slip engraved with the character <span style='color:aqua'>Bing (Ice)</span> fell into Nako's hands."
                    add_to_character_inventory([{ "item": getItem(item_templates["冰家玉简"]), "count": 1}]);
                    //获取冰家玉简(价值1000u)
                }
                if(kr == 1){
                    displayed_text += "[Bing Xiyue] You two, despite the friction between us,<br>it's better to resolve a grudge than to nurture one —<br>after all, you were the only one who succeeded in breaking through.<br>Miss Nako… thank you.<br>Take this — till we meet again.<br><br>With a wave of Bing Xiyue's jade hand,<br>a stack of 369 <span class='coin coin_moneyQa'>Cosmic Coins</span> fell into Nako's hands."
                    character.money += 369e15;
                    //获取888u
                }
                if(kr == 2){
                    displayed_text += "[Bing Xiyue] You two…<br>while it's true you're the ones who broke through,<br>your killing intent is far too strong.<br>Before you get a chance to kill me,<br>I'd better slip away first.<br><br>Bing Xiyue's jade hand clenched,<br>crushing a jade slip engraved with the character <span style='color:aqua'>Bing (Ice)</span>,<br>and her figure dissolved into thin air."
                    //杀了俩还想要东西？
                }
            }

        }//Past-3: post-act-3 boss fight multi-branch resolution
        else if(t_key == "age-check"){
            let age=Math.round(current_game_time.year - 1374 + (current_game_time.era-31698)*10081);
            // 1374年 15岁 进入时封水牢(RPG标准世界线)
            displayed_text += `It's been ${age} years!!<br>`
            if(age<10) displayed_text += `Everyone in the family said you'd be back soon.<br>Looks like I worried for nothing.`;
            else if(age<100) displayed_text += `Even though it was Brother Feng who suggested that training spot…<br>please don't be away for so long next time, alright?<br>`;
            else if(age<1000) displayed_text += `It's a good thing you remembered to come back…<br>If you'd stayed away any longer,<br>nobody in the family would have known who to pass things down to.`
            else displayed_text += `All of Yangang City had been saying<br>that the once-brilliant Nako sisters<br>had both perished in that inescapable Ice Palace!<br>A few more years and you'd probably have come back to find no Nako Clan at all.`
        }
        return displayed_text;
}

/**
 * 
 * @param {String} textline_key 
 */
function start_textline(textline_key){
    const dialogue = dialogues[current_dialogue];
    if(!dialogue) {
        console.warn(`[Dialogue] Missing current dialogue: ${current_dialogue}`);
        return;
    }
    const textline = dialogue.textlines[textline_key];
    if(!textline) {
        console.warn(`[Dialogue] Missing textline "${textline_key}" in dialogue "${current_dialogue}"`);
        return;
    }

    for(let i = 0; i < textline.unlocks.flags.length; i++) {
        const flag = global_flags[textline.unlocks.flags[i]];
        if(!flag) {
            global_flags[textline.unlocks.flags[i]] = true;
            log_message(`${flag_unlock_texts[textline.unlocks.flags[i]]}`, "activity_unlocked");
        }
    }
    for(let i = 0; i < textline.unlocks.items.length; i++) {
        let item_id = textline.unlocks.items[i].item_name;
        log_message(`${character.name} obtained "${item_templates[item_id]?.getName?.() ?? item_id}"`);
        
        if(textline.unlocks.items[i].quality != undefined) add_to_character_inventory([{item: getItem({...item_templates[item_id], quality: textline.unlocks.items[i].quality})}]);
        else  add_to_character_inventory([{item: item_templates[item_id]}]);
    }

    if(textline.unlocks.money && typeof textline.unlocks.money === "number") {
        character.money += textline.unlocks.money;
        log_message(`${character.name} earned ${format_money(textline.unlocks.money)}`);
        update_displayed_money();
    }

    for(let i = 0; i < textline.unlocks.dialogues.length; i++) { //unlocking dialogues
        const unlocked_dialogue_key = textline.unlocks.dialogues[i];
        const unlocked_dialogue = dialogues[unlocked_dialogue_key];
        if(!unlocked_dialogue) {
            console.warn(`[Dialogue] Missing unlock target dialogue: ${unlocked_dialogue_key}`);
            continue;
        }
        if(!unlocked_dialogue.is_unlocked) {
            unlocked_dialogue.is_unlocked = true;
            log_message(`You can now talk with ${unlocked_dialogue.name}`, "activity_unlocked");
        }
    }

    for(let i = 0; i < textline.unlocks.traders.length; i++) { //unlocking traders
        const trader = traders[textline.unlocks.traders[i]];
        if(!trader) {
            console.warn(`[Dialogue] Missing unlock target trader: ${textline.unlocks.traders[i]}`);
            continue;
        }
        if(!trader.is_unlocked) {
            trader.is_unlocked = true;
            log_message(`Unlocked new trader: ${trader.name}`, "activity_unlocked");
        }
    }

    for(let i = 0; i < textline.unlocks.textlines.length; i++) { //unlocking textlines
        const dialogue_name = textline.unlocks.textlines[i].dialogue;
        const unlock_dialogue = dialogues[dialogue_name];
        if(!unlock_dialogue) {
            console.warn(`[Dialogue] Missing dialogue while unlocking textlines: ${dialogue_name}`);
            continue;
        }
        for(let j = 0; j < textline.unlocks.textlines[i].lines.length; j++) {
            const line_key = textline.unlocks.textlines[i].lines[j];
            if(!unlock_dialogue.textlines[line_key]) {
                console.warn(`[Dialogue] Missing textline "${line_key}" while unlocking from dialogue "${dialogue_name}"`);
                continue;
            }
            unlock_dialogue.textlines[line_key].is_unlocked = true;
        }
    }

    for(let i = 0; i < textline.unlocks.locations.length; i++) { //unlocking locations
        unlock_location(locations[textline.unlocks.locations[i]]);
    }

    for(let i = 0; i < textline.unlocks.stances.length; i++) { //unlocking locations
        unlock_combat_stance(textline.unlocks.stances[i]);
    }

    for(let i = 0; i < textline.locks_lines.length; i++) { //locking textlines
        dialogue.textlines[textline.locks_lines[i]].is_finished = true;
    }

    if(textline.unlocks.activities) { //unlocking activities
        for(let i = 0; i < textline.unlocks.activities.length; i++) { //unlock 
            unlock_activity({location: textline.unlocks.activities[i].location,
                             activity: locations[textline.unlocks.activities[i].location].activities[textline.unlocks.activities[i].activity]});
        }
    }
    if(textline.otherUnlocks) {
        textline.otherUnlocks();
    }
    let displayed_text = textline.text;
    if(textline.unlocks.spec != "" && textline.unlocks.spec != undefined)
    {
        displayed_text += textline_special(textline.unlocks.spec);
    }
/*
赐福消耗当前生命上限^1.40的钱币，
获取延续游戏时间1days[即1800s]的一个buff。

8种月相分别对应：
血量上限-暴击概率-暴击伤害-普攻倍率-攻击力-防御-敏捷-速度。
x1.5    x1.5     x1.6    x1.4    x1.2  x1.2 x1.2 x1.1 */
    start_dialogue(current_dialogue);
    update_displayed_textline_answer(displayed_text);
}

function unlock_combat_stance(stance_id) {
    if(!stances[stance_id]) {
        console.warn(`Tried to unlock stance "${stance_id}", but no such stance exists!`);
        return;
    }

    stances[stance_id].is_unlocked = true;
    update_displayed_stance_list();
    log_message(`Unlocked a technique: "${stances[stance_id].name}"`, "location_unlocked") 
}

function change_stance(stance_id, is_temporary = false) {
    if(is_temporary) {
        if(!stances[stance_id]) {
            throw new Error(`No such stance as "${stance_id}"`);
        }
        if(!stances[stance_id].is_unlocked) {
            throw new Error(`Stance "${stance_id}" is not yet unlocked!`)
        }

    } else {
        selected_stance = stance_id;
        update_displayed_stance();
    }
    
    current_stance = stance_id;

    update_character_stats();
    reset_combat_loops();
}

/**
 * @description handle faving/unfaving of stances
 * @param {String} stance_id 
 */
function fav_stance(stance_id) {
    if(faved_stances[stance_id]) {
        delete faved_stances[stance_id];
    } else if(stances[stance_id].is_unlocked){
        faved_stances[stance_id] = true;
    } else {
        console.warn(`Tried to fav a stance '${stance_id}' despite it not being unlocked!`);
    }
    update_displayed_faved_stances();
}

/**
 * @description sets attack cooldowns and new enemies, either from provided list or from current location, called whenever a new enemy group starts
 * @param {List<Enemy>} enemies 
 */
function set_new_combat({enemies} = {}) {
    if(!current_location.get_next_enemies){
        clear_all_enemy_attack_loops();
        clear_character_attack_loop();
        return;
    }
    current_enemies = enemies || current_location.get_next_enemies();
    clear_all_enemy_attack_loops();

    let character_attack_cooldown = 1/(character.stats.full.attack_speed);
    enemy_attack_cooldowns = [...current_enemies.map(x => 1/x.stats.attack_speed)];

    let fastest_cooldown = [character_attack_cooldown, ...enemy_attack_cooldowns].sort((a,b) => a - b)[0];
    //scale all attacks to be not faster than 10 per second
    if(fastest_cooldown < 0.1) {
        const cooldown_multiplier = 0.1/fastest_cooldown;
        
        character_attack_cooldown *= cooldown_multiplier;
        for(let i = 0; i < current_enemies.length; i++) {
            enemy_attack_cooldowns[i] *= cooldown_multiplier;
            enemy_timer_variance_accumulator[i] = 0;
            enemy_timer_adjustment[i] = 0;
            enemy_timers[i] = [Date.now(), Date.now()];
        }
    } else {
        for(let i = 0; i < current_enemies.length; i++) {
            enemy_timer_variance_accumulator[i] = 0;
            enemy_timer_adjustment[i] = 0;
            enemy_timers[i] = [Date.now(), Date.now()];
        }
    }

    //attach loops
    // 安全使用
    for(let i = 0; i < (current_enemies?.length || 0); i++) {
        do_enemy_attack_loop(i, 0, 1,true);
    }
    if((current_enemies?.length || 0)!=0)
    {
    set_character_attack_loop({base_cooldown: character_attack_cooldown});
    
    update_displayed_enemies();
    update_displayed_health_of_enemies();
    }
}

/**
 * @description Recalculates attack speeds;
 * 
 * For enemies, modifies their existing cooldowns, for hero it restarts the attack bar with a new cooldown 
 */
function reset_combat_loops() {
    if(!current_enemies) { 
        return;
    }

    let character_attack_cooldown = 1/(character.stats.full.attack_speed);
    enemy_attack_cooldowns = [...current_enemies.map(x => 1/x.stats.attack_speed)];

    let fastest_cooldown = [character_attack_cooldown, ...enemy_attack_cooldowns].sort((a,b) => a - b)[0];

    //scale all attacks to be not faster than 10 per second
    if(fastest_cooldown < 0.1) {
        const cooldown_multiplier = 0.1/fastest_cooldown;
        character_attack_cooldown *= cooldown_multiplier;
        for(let i = 0; i < current_enemies.length; i++) {
            enemy_attack_cooldowns[i] *= cooldown_multiplier;
        }
    }

    set_character_attack_loop({base_cooldown: character_attack_cooldown});
}

/**
 * @description Creates an Interval responsible for performing the attack loop of enemy and updating their attack_bar progress
 * @param {*} enemy_id 
 * @param {*} cooldown 
 */

let cd_needed = [0,0,0,0,0,0,0,0];
let cur_cd = [0,0,0,0,0,0,0,0];
function do_enemy_attack_loop(enemy_id, count, E_round = 1,isnew = false) {//E_round:回合数
    count = count || 0;
    if(!current_enemies?.[enemy_id] || !Array.isArray(current_enemies[enemy_id].spec)) {
        clearTimeout(enemy_attack_loops[enemy_id]);
        return;
    }
    let Spec_S = "";
    if(current_enemies[enemy_id].spec.includes(0)) Spec_S += "[Magic ATK]";
    if(current_enemies[enemy_id].spec.includes(5)) Spec_S += "[Suppression]";
    if(current_enemies[enemy_id].spec.includes(7)) Spec_S += "[Rend]";
    if(current_enemies[enemy_id].spec.includes(8)) Spec_S += "[Weaken]";
    if(current_enemies[enemy_id].spec.includes(9)) Spec_S += "[Reverse]";
    if(current_enemies[enemy_id].spec.includes(10)) Spec_S += "[Whirlwind]";
    if(current_enemies[enemy_id].spec.includes(17)) Spec_S += "[Tenacity]";
    if(current_enemies[enemy_id].spec.includes(18)) Spec_S += "[Greed]";
    if(current_enemies[enemy_id].spec.includes(26)) Spec_S += "[Split]";
    if(current_enemies[enemy_id].spec.includes(27)) Spec_S += "[Soft Bone]";
    if(current_enemies[enemy_id].spec.includes(39)) Spec_S += "[Greed·Gem]";
    if(current_enemies[enemy_id].spec.includes(51)) Spec_S += "[Suppress: Total]";
    if(current_enemies[enemy_id].spec.includes(52)) Spec_S += "[Pseudo-Suppress]";
    if(current_enemies[enemy_id].spec.includes(54)) Spec_S += "[Life Limit]";
    if(current_enemies[enemy_id].spec.includes(55)) Spec_S += "[Greed+]";

    if(isnew) {
        cd_needed[enemy_id] = 1000 / current_enemies[enemy_id].stats.attack_speed;
        cur_cd[enemy_id] = 0;
        if(current_enemies[enemy_id].spec.includes(2)) do_enemy_combat_action(enemy_id,"[Swift]"+Spec_S);//迅捷(开局攻击)
        if(current_enemies != null) if(current_enemies[enemy_id].spec.includes(4))
        {
            for(let cb=1;cb<=3;cb++) if(current_enemies != null){
                do_enemy_combat_action(enemy_id,"[Dash]"+Spec_S);//疾走(3连击)
            }
        }
        if(current_enemies != null) if(current_enemies[enemy_id].spec.includes(16))//飓风(4x5连击)
        {
            for(let cb=1;cb<=4;cb++) if(current_enemies != null){
                do_enemy_combat_action(enemy_id,"[Hurricane]"+Spec_S,1,5);
            }
        }
        if(current_enemies != null) if(current_enemies[enemy_id].spec.includes(22))
        {
            for(let cb=1;cb<=5;cb++) if(current_enemies != null){
            do_enemy_combat_action(enemy_id,"[Peerless]"+Spec_S,0.9,1);//绝世(0.9x5连击)
            }
        }
        if(current_enemies != null) if(current_enemies[enemy_id].spec.includes(40))//追光(50x3连击)
        {
            for(let cb=1;cb<=3;cb++) if(current_enemies != null){
                do_enemy_combat_action(enemy_id,"[Light Chaser]"+Spec_S,1,50);
            }
        }
        if(current_enemies != null) if(current_enemies[enemy_id].spec.includes(48)){
            let blj_mul = (character.stats.full.attack_power + character.stats.full.defense) / current_enemies[enemy_id].stats.attack * 20;
            let blj_nerf = character.stats.full.agility / current_enemies[enemy_id].spec_value[48] * 0.01;
            blj_nerf = 1 - blj_nerf;
            blj_nerf = Math.max(blj_nerf,0);
            do_enemy_combat_action(enemy_id,`[Ice Thorn Blade]`+Spec_S,(blj_mul*blj_nerf));
        }//冰凌剑
        if(current_enemies != null) if(current_enemies[enemy_id].spec.includes(49)){
            let bfs_mul = (current_enemies[enemy_id].spec_value[49].rnd - Math.floor(character.stats.full.health / current_enemies[enemy_id].spec_value[49].hp)) * 0.2;
            bfs_mul = Math.max(bfs_mul,0);

            for(let cb=1;cb<=5;cb++) if(current_enemies != null){
            do_enemy_combat_action(enemy_id,`[Glacial Bind${bfs_mul==0?"·Immune":""}]`+Spec_S,1,bfs_mul);
            }
        }//冰封术
        if(current_enemies != null) if(current_enemies[enemy_id].spec.includes(50)){
            let ds_mul = (character.stats.full.agility) / current_enemies[enemy_id].stats.attack * 40;
            let ds_nerf = (character.stats.full.attack_power + character.stats.full.defense) / current_enemies[enemy_id].spec_value[50] * 0.01;
            ds_nerf = 1 - ds_nerf;
            ds_nerf = Math.max(ds_nerf,0);
            do_enemy_combat_action(enemy_id,`[Frostbite]`+Spec_S,(ds_mul*ds_nerf));
        }//冻伤
    }

    let frametime = 25;
    clearTimeout(enemy_attack_loops[enemy_id]);
    enemy_attack_loops[enemy_id] = setTimeout(() => {
        if(current_enemies != null)
        {
            if(!current_enemies[enemy_id]) {
                clearTimeout(enemy_attack_loops[enemy_id]);
                return;
            }
            cur_cd[enemy_id] += frametime;
            update_enemy_attack_bar(enemy_id, cur_cd[enemy_id] / cd_needed[enemy_id]);
            let atk_sign = 0;
            if(cur_cd[enemy_id] >= cd_needed[enemy_id]) {
                cur_cd[enemy_id] -= cd_needed[enemy_id];
                count = 0;
                if(current_enemies[enemy_id].spec.includes(10))
                {
                    do_enemy_combat_action(enemy_id,Spec_S,0.8);
                    if(current_enemies != null) do_enemy_combat_action(enemy_id,Spec_S,1.2);//回风
                }
                else  if(current_enemies[enemy_id].spec.includes(12))
                {
                    do_enemy_combat_action(enemy_id,"[Time Seal]"+Spec_S,1,E_round);//时封
                }
                else  if(current_enemies[enemy_id].spec.includes(15))
                {
                    do_enemy_combat_action(enemy_id,"[Void Gate]"+Spec_S,1,E_round * 2 - 1);//异界
                }
                else do_enemy_combat_action(enemy_id,Spec_S,1);//普攻

                if(current_enemies != null) if(current_enemies[enemy_id].spec.includes(13) && E_round <= 3)//惑幻
                {
                    do_enemy_combat_action(enemy_id,"[Illusion]"+Spec_S,0);
                }
                if(current_enemies != null) if(current_enemies[enemy_id].spec.includes(14))//斩阵
                {
                    if(E_round == 2)
                    {
                        do_enemy_combat_action(enemy_id,"[Blade Array·Begin]"+Spec_S,2);
                    }
                    else if(E_round == 4)
                    {
                        do_enemy_combat_action(enemy_id,"[Blade Array·Rise]"+Spec_S,3);
                    }
                    else if(E_round == 6)
                    {
                        do_enemy_combat_action(enemy_id,"[Blade Array·End]"+Spec_S,4);
                    }
                }
                if(current_enemies != null) if(current_enemies[enemy_id].spec.includes(42))//圣阵
                {
                    if(E_round == 5)
                    {
                        do_enemy_combat_action(enemy_id,"[Holy Array·Unity]"+Spec_S,3);
                    }
                    else if(E_round == 10)
                    {
                        do_enemy_combat_action(enemy_id,"[Holy Array·Duality]"+Spec_S,9);
                    }
                    else if(E_round == 20)
                    {
                        do_enemy_combat_action(enemy_id,"[Holy Array·Trinity]"+Spec_S,27);
                    }
                }
                if(current_enemies != null) if(current_enemies[enemy_id].spec.includes(20)){//天剑
                    do_enemy_combat_action(enemy_id,"[Heaven Blade]"+Spec_S,1.5,2);
                }
                if(current_enemies != null) if(current_enemies[enemy_id].spec.includes(36) && E_round == 20){//自爆
                    do_enemy_combat_action(enemy_id,"[Self-Destruct]"+Spec_S,0);
                }
                if(current_enemies != null) if(current_enemies[enemy_id].spec.includes(45) && E_round == 10){//10回合
                    do_enemy_combat_action(enemy_id,Spec_S,0);
                }
                if(current_enemies != null) if(current_enemies[enemy_id].spec.includes(38) && E_round == 9)//冰符咒
                {
                    do_enemy_combat_action(enemy_id,"[Ice Rune Curse]"+Spec_S,20);
                }
                
                atk_sign += 1;
                if(current_enemies != null)
                {
                    if(current_enemies[enemy_id].spec.includes(3)) do_enemy_combat_action(enemy_id,"[2-Hit Combo]"+Spec_S,1);//2连击

                    if(current_enemies[enemy_id].spec.includes(6))
                    {
                        do_enemy_combat_action(enemy_id,"[3-Hit Combo]"+Spec_S,1);
                        if(current_enemies != null) do_enemy_combat_action(enemy_id,"[3-Hit Combo]"+Spec_S,1);
                    }//3连击
                    if(current_enemies[enemy_id].spec.includes(33))
                    {
                        let cnt = current_enemies[enemy_id].spec_value[33];
                        for(let cnts = 1;cnts < cnt;cnts += 1)
                        {
                            if(current_enemies == null) break;
                            do_enemy_combat_action(enemy_id,`[${cnt}-Hit Combo]`+Spec_S,1);
                        }
                    }//任意连击

                }
            }
            do_enemy_attack_loop(enemy_id, count,E_round + atk_sign,false);

        }
        else clearTimeout(enemy_attack_loops[enemy_id]);
    }, frametime);
}

function clear_enemy_attack_loop(enemy_id) {
    clearTimeout(enemy_attack_loops[enemy_id]);
}

/**
 * 
 * @param {Number} base_cooldown basic cooldown based on attack speeds of enemies and character 
 * @param {String} attack_type type of attack, not yet implemented
 */
function set_character_attack_loop({base_cooldown}) {
    clear_character_attack_loop();

    //little safety, as this function would occasionally throw an error due to not having any enemies left 
    //(can happen on forced leave after first win)
    if(!current_enemies) {
        return;
    }

    //  if(current_stance !== "normal") {
    //     change_stance("normal", true);
    //     return;
    // }
    //WTF is this?


    let target_count = stances[current_stance].target_count;
    if(target_count > 1 && stances[current_stance].related_skill) {
        target_count = target_count + Math.round(target_count * skills[stances[current_stance].related_skill].current_level/skills[stances[current_stance].related_skill].max_level);
    }

    if(stances[current_stance].randomize_target_count) {
        target_count = Math.floor(Math.random()*target_count) || 1;
    }

    let targets=[];
    const alive_targets = current_enemies.filter(enemy => enemy.is_alive).slice(-target_count);

    while(alive_targets.length>0) {
        targets.push(alive_targets.pop());
    }
    let actual_cooldown = base_cooldown;

    let attack_power = character.get_attack_power();
    do_character_attack_loop({base_cooldown, actual_cooldown, attack_power, targets});
}

/**
 * @description updates character's attack bar, performs combat action when it reaches full
 * @param {Number} base_cooldown 
 * @param {Number} actual_cooldown 
 * @param {String} attack_power 
 * @param {String} attack_type 
 */
let chara_cd = 0;
function do_character_attack_loop({base_cooldown, actual_cooldown, attack_power, targets}) {
    let count = 0;
    clear_character_attack_loop();
    let frametime = 20;
    character_attack_loop = setInterval(() => {
        update_character_attack_bar(chara_cd/(actual_cooldown * 1000));
        chara_cd += frametime;
        if(chara_cd >= actual_cooldown * 1000) {
            chara_cd -= actual_cooldown * 1000;
            let leveled = false;

            for(let i = 0; i < targets.length; i++) {
                let alive_targets = current_enemies.filter(enemy => enemy.is_alive);
                if(active_effects["Whirlwind A9"]!=undefined || active_effects["烈日祝福·艮"]!=undefined)
                {
                    do_character_combat_action({target: targets[i], attack_power}, alive_targets.length - 1,0.8,"[Whirlwind-Weak]");
                    alive_targets = current_enemies.filter(enemy => enemy.is_alive);
                    if(current_enemies.filter(enemy => enemy.is_alive).length != 0) do_character_combat_action({target: targets[i], attack_power}, alive_targets.length - 1,1.2,"[Whirlwind-Strong]");
                }
                else do_character_combat_action({target: targets[i], attack_power}, alive_targets.length - 1,1,"");
            }
            if(stances[current_stance].related_skill) {
                leveled = add_xp_to_skill({skill: skills[stances[current_stance].related_skill], xp_to_add: targets.reduce((sum,enemy)=>sum+enemy.xp_value,0)/targets.length});
                
                if(leveled) {
                    let R_skill =  skills[stances[current_stance].related_skill];
                    for(let j=0;j < R_skill.related_stances.length; j+=1){
                        
                        update_stance_tooltip(R_skill.related_stances[j]);
                    }
                    update_character_stats();
                }
            }

            if(current_enemies.filter(enemy => enemy.is_alive).length != 0) { //set next loop if there's still an enemy left;
                set_character_attack_loop({base_cooldown});
            } else { //all enemies defeated, do relevant things and set new combat

                current_location.enemy_groups_killed += 1;
                if(current_location.enemy_groups_killed > 0 && current_location.enemy_groups_killed % current_location.enemy_count == 0) {
                    get_location_rewards(current_location);
                }
                document.getElementById("enemy_count_div").children[0].children[1].innerHTML = current_location.enemy_count - current_location.enemy_groups_killed % current_location.enemy_count;
        
                set_new_combat();
            }
        }
    }, frametime);
}

function clear_character_attack_loop() {
    clearInterval(character_attack_loop);
}

function clear_all_enemy_attack_loops() {
    Object.keys(enemy_attack_loops).forEach((key) => {
        clearInterval(enemy_attack_loops[key]);
    })
}

function start_combat() {
    if(current_enemies == null) {
        set_new_combat();
    }
}

/**
 * performs a single combat action (that is attack, as there isn't really any other kind for now),
 * called when attack cooldown finishes
 * 
 * @param {String} attacker id of enemy
*/ 
function faint(c_log)
{
    total_deaths++;
    log_message(character.name + c_log, "hero_defeat");
    end_activity_animation(); //clears the "animation"
    current_activity = null;
     update_displayed_health();
    if(inf_combat.S3?.live){
        if(current_location.parent_location != undefined) change_location(current_location.parent_location.name);
        log_message("The shadow of Soul Spirit flickers. Can't fall now!","combat_loot")
        return;
    }//BOSS战正在进行
    
    if(options.auto_return_to_bed && last_location_with_bed) {
        change_location(last_location_with_bed);
        start_sleeping();
    } else {
        if(current_location.parent_location != undefined) change_location(current_location.parent_location.name);
        else{
            change_location(last_location_with_bed);
            start_sleeping();
            log_message("Collapsed from blood loss outside combat zone - automatically returned to bed!","gathering_loot")
        }
    }
    return;
}
function do_enemy_combat_action(enemy_id,spec_hint,E_atk_mul = 1,E_dmg_mul = 1) {
    
    /*
    tiny workaround, as character being defeated while facing multiple enemies,
    sometimes results in enemy attack animation still finishing before character retreats,
    launching this function and causing an error
    */
    if(!current_enemies) { 
        return;
    }
    
    const attacker = current_enemies[enemy_id];

    let evasion_agi_modifier = current_enemies.filter(enemy => enemy.is_alive).length**(-1/3); //more enemies will restrict neko resulted in harder evasion

    //it will be changed with environment or spec stat.

    const enemy_base_damage = attacker.stats.attack;

    let damage_dealt;

    let critted = false;

    let partially_blocked = false; //only used for combat info in message log

    damage_dealt = enemy_base_damage
    let vibra_d = 1;
    vibra_d =  (1.2 - Math.random() * 0.4); //basic 20% deviation for damage
    
    
    if(spec_hint == undefined) spec_hint = "";
    let spec_mul = 1;
    
    if(attacker.spec.includes(5))//牵制
    {
        spec_mul *= attacker.stats.defense/character.stats.full.defense;
        if(spec_mul == Infinity) spec_mul = 9999.99;//防止除以0
    }
    if(attacker.spec.includes(51))//压制
    {
        spec_mul *= (attacker.stats.defense+attacker.stats.attack)/(character.stats.full.defense+character.stats.full.attack_power);
        if(spec_mul == Infinity) spec_mul = 9999.99;//防止除以0
    }
    if(attacker.spec.includes(52))//压制·伪
    {
        let QZ_P = global_flags['qz_percent'] || 0;
        spec_mul *= ((attacker.stats.defense+attacker.stats.attack)/(character.stats.full.defense+character.stats.full.attack_power)) ** (1-0.01*QZ_P);
        spec_mul *= (attacker.stats.defense/character.stats.full.defense) ** (0.01*QZ_P);

        if(spec_mul == Infinity) spec_mul = 9999.99;//防止除以0
    }
    if(attacker.spec.includes(18)){//贪婪
        spec_mul *= (1 - 0.01*(character.money/attacker.spec_value[18]));
        spec_mul = Math.max(spec_mul,0);
    }
    if(attacker.spec.includes(39)){//贪婪·宝石
        inf_combat.VP = inf_combat.VP || {num:0};
        spec_mul *= (1 - 0.01*(inf_combat.VP.num/attacker.spec_value[39]));
        spec_mul = Math.max(spec_mul,0);
    }
    if(attacker.spec.includes(55)){//贪婪·改
        spec_mul *= (1 - 0.01*(character.money/attacker.spec_value[55]));
        spec_mul = Math.max(spec_mul,0.2);
    }

    if(attacker.spec.includes(7)) spec_mul *= 1.5;//撕裂
    

    let E_atk_mul_f = E_atk_mul;
    if(attacker.spec.includes(42) && E_atk_mul != 1)
    {
        E_atk_mul_f *= (character.stats.full.attack_power + character.stats.full.defense + attacker.stats.defense + attacker.stats.defense) / attacker.stats.attack //圣阵
    } 
    if(attacker.spec.includes(13) && E_atk_mul == 0)//标记
    {
        E_atk_mul_f = character.stats.full.attack_power / attacker.stats.attack;//惑幻
    }
    if(attacker.spec.includes(17)) E_atk_mul_f += character.stats.full.health / attacker.stats.attack / 200;//执着
    if(attacker.spec.includes(21))//灵体
    {
        if(character.stats.full.agility >= attacker.spec_value[21]) spec_hint += "[Specter·Immune]";
        else{
            spec_hint += "[Specter]";
            E_atk_mul_f += (attacker.spec_value[21] - character.stats.full.agility)*5/attacker.stats.attack;  
        }
    }
    if(attacker.spec.includes(26)) E_atk_mul_f *= 2;//分裂
    if(attacker.spec.includes(36) && E_atk_mul == 0)//标记
    {
        let {damage_taken, fainted} = character.take_damage([],{damage_value: attacker.stats.health * 4},0);
        log_message(attacker.name + " self-destructed at " + format_number(attacker.stats.health) + " HP remaining.","hero_attacked_critically")
        log_message("Dealt "+format_number(attacker.stats.health * 4)+" damage.", "hero_attacked_critically");
        attacker.stats.health = 1;
        update_displayed_health_of_enemies();
        if(fainted) faint(" was knocked out by the explosion");
        return;
    }//自爆/残余血量都爆了
    if(attacker.spec.includes(45) && E_atk_mul == 0)//标记
    {
        if(character.equipment.special?.name == "Nanami (Spaceship)")//姐姐在！
        {
            log_message(`In nearly a tenth of a second, the weapon in Nanami's hands blazed with a dazzling silver-white radiance. With a thunderous roar, the entire ship seemed to tremble!`,"enemy_enhanced");
            log_message(`Hit by the recoil force, Nanami didn't budge an inch. Compared to the dungeon expedition, she had advanced seven full stages, and was no longer going to be coughing blood from mere recoil.`,"enemy_enhanced");
            log_message(`[Neko] Are you okay, sis——`,"enemy_defeated");
            log_message(`[Nanami] Pfft... do I LOOK like I have a problem?! Hurry up and finish off the ship core!`,"enemy_defeated");
            log_message(`Ship Core B6, struck head-on by the weapon, suffered severe damage as components flew in all directions.`,"enemy_enhanced");
            log_message("Its HP has been reduced to 1.", "hero_attacked_critically");
            attacker.stats.health = 1;
            update_displayed_health_of_enemies();
            return;
        }
        else{
            E_atk_mul = 1;
            log_message(`In nearly a tenth of a second...... who was that? Is she even here?`,"enemy_enhanced");
            log_message(`[???]...`,"enemy_defeated");
            log_message(`[Sayuki] High-energy reaction detected! Nanami is not in the party!`,"sayuki");
            log_message(`[Sayuki] No laser cannon attacks, our attack and HP are at an absolute disadvantage...`,"sayuki");
            log_message(`[Sayuki] Then relying on high agility and speed,`,"sayuki");
            log_message(`[Sayuki] let's chip away at this big, clunky core little by little!`,"sayuki");
        }
    }//10回合/姐姐必须在场

    if(attacker.spec.includes(43)){
        let {damage_taken, fainted} = character.take_damage([],{damage_value: attacker.spec_value[43]},0);
        update_displayed_health();
        log_message(character.name + " took " + format_number(damage_taken) + " damage [Laser]", "hero_missed");
        if(fainted)
        {
            faint(" was defeated by the laser");
            return;
        }
    }//激光
    if(active_effects["Spirit Flash B9"]!=undefined){
        if(attacker.stats.attack < character.stats.full.attack_power * 2){
            spec_mul *= (1 - 0.5 *character.stats.full.defense / Math.min(1,attacker.stats.defense));
            spec_mul = Math.max(spec_mul,0);
            spec_hint += '[Spirit Flash·Positive]';
        } else {
            spec_mul *= (1 + 3 *character.stats.full.defense / Math.min(1,attacker.stats.defense));
            spec_hint += '[Spirit Flash·Reverse]';
        }
    }
    if(active_effects["Scatter B9"]!=undefined){
        E_atk_mul_f *= Math.max(( 1 - ((character.stats.full.health/attacker.stats.health) ** 0.5) * 0.1),0);
        spec_hint += '[Scatter^1/2]';
    }
    if(attacker.spec.includes(54))
    {
        E_atk_mul_f *= attacker.stats.health / character.stats.full.health;
    }//生命限制


//"如果敌人的攻击少于角色的2倍，角色受到的伤害减少(角色防御/敌人防御)的二分之一。反之，增加(角色防御/敌人防御)的两倍。该效果不会把伤害降低到0以下。", 
    
    const hit_chance = get_hit_chance(attacker.stats.agility, character.stats.full.agility * evasion_agi_modifier);


    if((hit_chance < Math.random()) && (spec_mul * E_atk_mul_f) < 25) { //EVADED ATTACK
        if(!options.option_combat_filter) log_message(character.name + " evaded an attack", "enemy_missed");
        return; //damage fully evaded, nothing more can happen
    }
    //目前25倍以上攻击是必中状态。

    if(enemy_crit_chance > Math.random())
    {
        vibra_d *= enemy_crit_damage;
        critted = true;
    }

    /*
    head: null, torso: null, 
        arms: null, ring: null, 
        weapon: null, "off-hand": null,
        legs: null, feet: null, 
        amulet: null
    */

    if(E_atk_mul_f != 1)
    {
        if(E_atk_mul_f < 10) spec_hint += "[ATK " + format_number(E_atk_mul_f * 100) + "%]";
        else spec_hint += "[ATK " + format_number(E_atk_mul_f) + "x]";
        //怪物增攻
    }
    spec_mul *= E_dmg_mul;//计算在loop函数中的增伤
    if(spec_mul != 1)
    {
        if(spec_mul < 10) spec_hint += "[DMG " + format_number(spec_mul * 100) + "%]";
        else spec_hint += "[DMG " + format_number(spec_mul) + "x]";
        //最终增伤
    }
    spec_mul *= vibra_d;//正常波动和暴击，与DMG增幅走一套算法（不过不显示）
    let sdef_mul = spec_mul;//防御乘数,在后续计算伤害时使用，默认为最终增伤
    spec_mul *= E_atk_mul_f;//绕开防御乘数
    damage_dealt *= spec_mul;
    //下面是专属防御乘数计算区
    if(attacker.spec.includes(8)) sdef_mul *= (1 - 0.01*attacker.spec_value[8]);//衰弱
    if(attacker.spec.includes(9)) sdef_mul *= character.stats.full.attack_power / character.stats.full.defense;//反转
    if(attacker.spec.includes(27)) sdef_mul *= character.stats.full.attack_power / character.stats.full.defense * 0.1 + 1;//柔骨
    
    if(attacker.spec.includes(34)){
        if(attacker.stats.defense < character.stats.full.defense){
            spec_hint += "[Dominate Weak·Immune]";
        }
        else{
            sdef_mul *= (2- attacker.stats.defense/character.stats.full.defense);
            sdef_mul = sdef_mul || 0;
            spec_hint += "[Dominate Weak]";
        }
    }//凌弱
    
    
    let {damage_taken, fainted} = character.take_damage(attacker.spec,{damage_value: damage_dealt},sdef_mul);

    if(critted)
    {
        if((!options.option_combat_filter) || damage_taken != 0) log_message(character.name + " took " + format_number(damage_taken) + " damage [CRIT]" + spec_hint, "hero_attacked_critically");
    } else {
        if((!options.option_combat_filter) || damage_taken != 0) log_message(character.name + " took " + format_number(damage_taken) + " damage" + spec_hint, "hero_attacked");
    }



    
    if(!attacker.spec.includes(28)) add_xp_to_skill({skill: skills["Iron skin"], xp_to_add: enemy_base_damage*E_atk_mul_f*spec_mul/10});
    if(attacker.spec.includes(31)){
        attacker.stats.health += attacker.stats.max_health * 0.30;
        log_message(attacker.name + " recovered " + format_number(attacker.stats.max_health * 0.30) + " HP","enemy_enhanced");
        update_displayed_health_of_enemies();
    }//回春

    if(fainted) faint(" was defeated");
    else if(active_effects["Reversal B9"]!=undefined){
        attacker.stats.health -= damage_taken * 0.50;
        log_message(attacker.name + " took " + format_number(damage_taken * 0.50) + " rebound damage","hero_attacked");
        //attacker受到damage_taken点伤害
        if(attacker.stats.health <= 0){
            total_kills++;
            attacker.stats.health = 0; //to not go negative on displayed value
            log_message(attacker.name + " was defeated by rebound damage. No experience gained.","enemy_defeated");

            var loot = attacker.get_loot();
            if(loot.length > 0) {
                log_loot(loot);
                add_to_character_inventory(loot);
            }
            
            kill_enemy(attacker);
            if(current_enemies.filter(enemy => enemy.is_alive).length == 0){ //all enemies defeated, do relevant things and set new combat
                current_location.enemy_groups_killed += 1;
                if(current_location.enemy_groups_killed > 0 && current_location.enemy_groups_killed % current_location.enemy_count == 0) {
                    get_location_rewards(current_location);
                }
                document.getElementById("enemy_count_div").children[0].children[1].innerHTML = current_location.enemy_count - current_location.enemy_groups_killed % current_location.enemy_count;
                set_new_combat();
            }
        }
    }

    update_displayed_health();
}
function get_enemy_realm(enemy){
    const match = enemy.realm.match(/<b>([^<]+)<\/b>/);
    if (!match) return 0;
    const text = match[1];

    let base = 0;
    if (text.startsWith("Myriad")) base = 3;
    else if (text.startsWith("Tidal")) base = 6;
    else if (text.startsWith("Earth")) base = 9;
    else if (text.startsWith("Sky")) base = 18;
    else if (text.startsWith("Ascendant")) base = 27;
    // else Dust: base = 0

    const stage_match = text.match(/Stage (\d+)/);
    if (stage_match) return base + (parseInt(stage_match[1]) - 1);

    if (text.includes("Pinnacle") || text.includes("Breakthrough")) {
        if (base >= 9) return base + 8; // Earth/Sky/Ascendant: pinnacle = stage 9 equivalent
        return base + 2;               // Dust/Myriad/Tidal: 3 sub-ranks
    }
    if (text.includes("Expert")) return base === 0 ? 2 : base + 1; // Dust Expert is index 2
    if (text.includes("Adept")) return base + 1;
    return base; // Novice
}
function update_neko_realm()
{
    inf_combat.RM = inf_combat.RM || 0;
    let S_level = skills["Neko_Realm"].current_level;
    if(S_level >= 10 && inf_combat.RM < 1)
    {
        add_to_character_inventory([{item: getItem({...item_templates["燃灼术"], quality: 130}), count: 1}]);
        log_message(`Gained new technique [Scorching Art]!`, "location_unlocked");
        inf_combat.RM = 1;
    }
    else if(S_level >= 20 && inf_combat.RM < 2)
    {
        add_to_character_inventory([{item: getItem({...item_templates["火灵幻海[领域一重]"], quality: 160}), count: 1}]);
        
        log_message(`A crimson hexagram slowly rises,`, "gathered_loot");
        log_message(`The temperature in this area rises sharply,`, "gathered_loot");
        log_message(`even the floor of the ship seems to warp from the intense heat.`, "gathered_loot");
        log_message(`Gained new technique [Phantom Sea of Fire]!`, "location_unlocked");
        inf_combat.RM = 2;
    }
    else if(S_level >= 30 && inf_combat.RM < 3)
    {
        add_to_character_inventory([{item: getItem({...item_templates["焰海霜天[领域二重]"], quality: 200}), count: 1}]);
        log_message(`Water nourishes all things, gentle and graceful...`, "gathered_loot");
        log_message(`Fire is cruel and violent, yet it illuminates everything, igniting hope.`, "gathered_loot");
        log_message(`Gained new insight: [Blaze Sea·Frost Sky]!`, "location_unlocked");
        log_message(`[Extreme Cold Phase Engine] - [Blaze Sea] / [Frost Sky] environments now unlocked!`, "location_unlocked");
        inf_combat.RM = 3;
    }
    else if(S_level >= 35 && inf_combat.RM < 4)
    {
        add_to_character_inventory([{item: getItem({...item_templates["焰海霜天[领域三重]"], quality: 200}), count: 1}]);
        log_message(`Domain [Blaze Sea·Frost Sky] has advanced to the 3rd Layer! Check your equipment for details!`, "location_unlocked");
        inf_combat.RM = 4;
    }
    else if(S_level >= 40 && inf_combat.RM < 5)
    {
        add_to_character_inventory([{item: getItem({...item_templates["出云落月[领域四重]"], quality: 240}), count: 1}]);
        log_message(`领悟了第四重领域【出云落月】！请检查装备栏查看详情！`, "location_unlocked");
        inf_combat.RM = 5;
    }
}
function get_spirit_buff(S3_sp){
    
    locations["幻境核心 - B1"].is_unlocked = (inf_combat.S3.b1 != 0);
    locations["幻境核心 - B2"].is_unlocked = (inf_combat.S3.b2 != 0);
    locations["幻境核心 - B3"].is_unlocked = (inf_combat.S3.b3 != 0);
    //判定自选关解锁
    if(S3_sp == 5){
        log_message(`${character.name}'s Max HP increased by 20%!`,"enemy_enhanced");
        active_effects["灵魂之力 I"] = new ActiveEffect({...effect_templates["灵魂之力 I"], duration: 99999999});
    }
    if(S3_sp == 10){
        log_message(`${character.name}'s Max HP increased by 20%!`,"enemy_enhanced");
        active_effects["灵魂之力 II"] = new ActiveEffect({...effect_templates["灵魂之力 II"], duration: 99999999});
    }
    if(S3_sp == 15){
        log_message(`${character.name}'s ATK/DEF/AGI increased by 100,000,000!`,"enemy_enhanced");
        active_effects["灵魂之力 III"] = new ActiveEffect({...effect_templates["灵魂之力 III"], duration: 99999999});
    }
    if(S3_sp == 20){
        log_message(`${character.name}'s ATK/DEF/AGI increased by 100,000,000!`,"enemy_enhanced");
        active_effects["灵魂之力 IV"] = new ActiveEffect({...effect_templates["灵魂之力 IV"], duration: 99999999});
    }
    if(S3_sp >= 25){
        locations["幻境核心 - X"].is_unlocked = true;
        log_message(`[Zuo'a] seal complete — all attributes reduced by 10081x!`,"enemy_enhanced");
        log_message(`${character.name} channeled all soul power into the illusion realm! ATK/DEF/AGI increased by 500,000,000!`,"enemy_enhanced");
        active_effects["灵魂之力 V"] = new ActiveEffect({...effect_templates["灵魂之力 V"], duration: 99999999});
    }
    
                        character.stats.add_active_effect_bonus();
                        update_character_stats();
                        update_displayed_effect_durations();
                        update_displayed_effects();
}

function do_character_combat_action({target, attack_power}, target_num,c_atk_mul,c_hint) {

    let satk_mul = 1;//角色攻击乘数
    let sdmg_mul = 1;//角色伤害乘数
    let Spec_E = c_hint;
    if(target.spec.includes(8)) satk_mul *= (1 - 0.01*target.spec_value[8]);//衰弱
    if(target.spec.includes(9)) satk_mul *= character.stats.full.defense / character.stats.full.attack_power;//反转
    if(target.spec.includes(27)) satk_mul *= 0.9;//柔骨
    
    if(target.spec.includes(23))
    {
        if(character.stats.full.attack_power > target.stats.attack){
            Spec_E += "[Spirit Flash·Immune]";
        }
        else{
            Spec_E += "[Spirit Flash]";
            sdmg_mul = 1 - (target.stats.defense / character.stats.full.defense / 2);
        }
    }//灵闪

    if(target.spec.includes(37))
    {
        Spec_E += "[Scatter]";
        satk_mul *= 1 - target.stats.health / character.stats.full.health;
        satk_mul = Math.max(satk_mul,0);
    }//散华

    const hero_base_damage = attack_power * satk_mul * c_atk_mul;

    let damage_dealt;
    
    let critted = false;
    
    let hit_agi_modifier = current_enemies.filter(enemy => enemy.is_alive).length**(1/3); //more enemies will be easier to hit
    
    //it will be changed with environment or spec stat.

    add_xp_to_skill({skill: skills["Combat"], xp_to_add: target.xp_value});

    
    const hit_chance = get_hit_chance(character.stats.full.agility * hit_agi_modifier, target.stats.agility );
    
    if(hit_chance > Math.random()) {//hero's attack hits

        damage_dealt = hero_base_damage;
        let vibra_damage = (1.2 - Math.random() * 0.4);//0.8-1.2倍率浮动
        if(character.equipment.weapon != null) {
            add_xp_to_skill({skill: skills[weapon_type_to_skill[character.equipment.weapon.weapon_type]], xp_to_add: target.xp_value}); 
        } else {
            add_xp_to_skill({skill: skills['Unarmed'], xp_to_add: target.xp_value});
        }//武器技能+空手技能
        if(character.equipment.method != null){
            if(character.equipment.method.id=="三月断宵") add_xp_to_skill({skill: skills['3Moon/Night'], xp_to_add: target.xp_value});
            if(character.equipment.method.id=="星解之术") add_xp_to_skill({skill: skills['StarDestruction'], xp_to_add: target.xp_value});
            if(character.equipment.method.id=="映星紫华") add_xp_to_skill({skill: skills['ReflectStarVioletLight'], xp_to_add: target.xp_value});
        }
        if(character.stats.full.crit_rate > Math.random()) {
            vibra_damage *= character.stats.full.crit_multiplier;
            critted = true;
        }
        else {
            critted = false;
        }
        let proto_d = damage_dealt;
        damage_dealt = Math.ceil(10*Math.max(damage_dealt - target.stats.defense,0))/10;

        if(global_flags.is_realm_enabled)
        {
            let Realm_XP = damage_dealt;
            if(skills["Neko_Realm"].current_level < 39) Realm_XP *= (skills["AquaElement"].get_coefficient("multiplicative") || 1);
            else Realm_XP *= (skills["AquaElement"].get_coefficient("multiplicative") || 1) ** 0.5;
            add_xp_to_skill({skill: skills['Neko_Realm'], xp_to_add: Realm_XP});//战斗领悟(领域)
            update_neko_realm();
        }
        if(active_effects["Magic Attack A9"]!=undefined && damage_dealt < proto_d * 0.1)
        {
            damage_dealt = proto_d * 0.1;
            Spec_E += "[Magic ATK]";
        }
        if(active_effects["烈日祝福·坎"]!=undefined && damage_dealt < proto_d * 0.2)
        {
            damage_dealt = proto_d * 0.1;
            Spec_E += "[Magic ATK·Blessing]";
        }
        if(active_effects["Suppression A9"]!=undefined)
        {
            sdmg_mul *= Math.min(character.stats.full.defense / (target.stats.defense + 0.0001) * 0.6,10);
            Spec_E += "[Suppression]";
        }
        if(active_effects["烈日祝福·巽"]!=undefined)
        {
            sdmg_mul *= Math.min(character.stats.full.defense / (target.stats.defense + 0.0001) * 0.8,10);
            Spec_E += "[Suppression·Blessing]";
        }
        
        if(active_effects["Void Gate B9"]!=undefined)
        {
            target.stats.spec_value ||= {};
            
            target.stats.spec_value[-1] ||= 1;
            sdmg_mul *= target.stats.spec_value[-1];
            target.stats.spec_value[-1] += 1;
            Spec_E += "[Void Gate]";
        }


        if(target.spec.includes(1))
        {
            if(character.equipment.special?.name == "Nanami"){
                damage_dealt=Math.min(damage_dealt,4.0);//坚固
                Spec_E += "[Fortified·Weakened]"
            }
            else{
                damage_dealt=Math.min(damage_dealt,1.0);//坚固
                Spec_E += "[Fortified]"
            }
        }
        if(target.spec.includes(8)) Spec_E += "[Weaken]";
        if(target.spec.includes(9)) Spec_E += "[Reverse]";
        if(target.spec.includes(27)) Spec_E += "[Soft Bone]";
        if(satk_mul != 1) Spec_E += `[ATK${format_number(satk_mul * 100)}%]`;
        if(sdmg_mul != 1)
        {
            Spec_E += `[DMG${format_number(sdmg_mul * 100)}%]`;
            damage_dealt *= sdmg_mul;
        }
        damage_dealt *= vibra_damage;
        let A_mul = (character.stats.full.attack_mul || 1)
        if(A_mul > 1)
        {
            damage_dealt *= A_mul;
            Spec_E += `[x${format_number(A_mul)}]`;
        }
        let b_health = target.stats.health;
        target.stats.health -= damage_dealt;
        let filter = false;
        if(options.option_combat_filter && ((damage_dealt == 0) || (target.stats.health <= 0))) filter = true;
        if(critted) {
            if(!filter) log_message(target.name + " took " + format_number(damage_dealt) + " damage [CRIT]" + Spec_E, "enemy_attacked_critically");
        }
        else {
            if(!filter) log_message(target.name + " took " + format_number(damage_dealt) + " damage" + Spec_E, "enemy_attacked");
        }
        
        const effect = document.getElementById(`E${target_num}_effect`);
            effect.classList.add('active');
                effect.addEventListener('animationend', () => {
                       effect.classList.remove('active');
                }, { once: true });
                //受击动画

        if(target.stats.health <= 0) {
            damage_dealt = b_health;
            total_kills++;
            target.stats.health = 0; //to not go negative on displayed value
        
            //gained xp multiplied ny TOTAL size of enemy group raised to 1/3
            let xp_reward = target.xp_value * (current_enemies.length**0.3334);
            let realm_diff =  get_enemy_realm(target) - character.get_hero_realm();
            let realm_mul = realm_diff >= 0 ? Math.pow(1.25,realm_diff) : Math.pow(5,realm_diff);
            xp_reward *= realm_mul;
            add_xp_to_character(xp_reward, true);


            let xp_display = xp_reward * character.get_xp_bonus();
            let tooltip_ex = "";
            if(realm_mul > 1) tooltip_ex = "(over-realm bonus +" + format_number((realm_mul - 1)*100) + "%)";
            if(realm_mul < 1) tooltip_ex = "(under-realm penalty -" + format_number((1 - realm_mul)*100) + "%)";


            

            log_message(target.name + " defeated, gained " + format_number(xp_display) + " XP" + tooltip_ex, 
            "enemy_defeated");
            //亡语判定区
            if(target.spec.includes(56))
            {
                log_message(`${character.name} gained a 60s [Slowed] effect!`,"enemy_enhanced");
                active_effects["迟缓"] = new ActiveEffect({...effect_templates["迟缓"], duration:60});
                inf_combat.S3.b1 -= 1;
            }//禁锢
            if(target.spec.includes(57))
            {
                log_message(`3 [Soul Spirit·Berserk] have entered the field!`,"enemy_enhanced");
                inf_combat.S3.b2 -= 1;
                inf_combat.S3.b3 += 3;
            }//滋生
            if(target.spec.includes(58))
            {
                log_message(`[Soul Spirit·Berserk]'s ATK/HP increased by 5%!`,"enemy_enhanced");
                //计算公式:((8-inf_combat.S3.b2)*3-inf_combat.S3.b3)*0.05)
                inf_combat.S3.b3 -= 1;
            }//暴走
            if(target.spec.includes(59))
            {
                log_message(`Gained 1 [Soul Power] point!`,"enemy_enhanced");
                inf_combat.S3.sp += 1;
                get_spirit_buff(inf_combat.S3.sp);
            }//心之力
            if(target.rank >= 3100 && target.rank <= 3200){
                inf_combat.B3 = inf_combat.B3 || 0;
                log_message(`Swamp radiation spread: ${format_number(inf_combat.B3)} % -> ${format_number(inf_combat.B3 + 0.004)} % `,"enemy_defeated");
                inf_combat.B3 += 0.004;
            }//3-1的怪
            var loot = target.get_loot();
            if(loot.length > 0) {
                log_loot(loot);
                add_to_character_inventory(loot);
            }
            
            if(target.id == "地宫养殖者[BOSS]")//没收姐姐
            {
                if(character.equipment.special?.name == "Nanami")
                {
                    character.equipment.special = null;
                    log_message(`Sis in the equipment slot has gone home!`,"enemy_enhanced");
                    
                    update_displayed_equipment(); 
                    character.stats.add_all_equipment_bonus();
                    update_displayed_stats();
                }
                else if(character.is_in_inventory_nanami("{\"id\":\"纳娜米\",\"quality\":100}"))
                {
                    remove_from_character_inventory([{item_key:"{\"id\":\"纳娜米\",\"quality\":100}"}]);
                    log_message(`Sis in the inventory has gone home!`,"enemy_enhanced");
                }
                else if(enemy_killcount["地宫养殖者[BOSS]"] <= 1)
                {
                    log_message(`[Sayuki] Huh? Sis is nowhere to be found.`,"sayuki");
                    log_message(`[Sayuki] You actually beat that dungeon boss with 100x stats! Amazing!`,"sayuki");
                    log_message(`[Sayuki] Well then, as a small reward for the victor,`,"sayuki");
                    log_message(`[Sayuki] have this -9999 quintillion experience.`,"sayuki");
                    //character.xp.total_xp = -9.999e51;
                    character.xp.current_xp = -9.999e51;
                    character.xp.xp_level = 0;
                    update_displayed_character_xp(true);
                }
                
                update_displayed_character_inventory({was_anything_new_added:true});
                //unlock_location("荒兽森林营地");

            }
            if(target.id == "舰船中枢B6[BOSS]")//没收姐姐2.0
            {
                if(character.equipment.special?.name == "Nanami (Spaceship)")
                {
                    character.equipment.special = null;
                    log_message(`Sis in the equipment slot has gone home!`,"enemy_enhanced");
                    
                    update_displayed_equipment(); 
                    character.stats.add_all_equipment_bonus();
                    update_displayed_stats();
                }
                else if(character.is_in_inventory_nanami("{\"id\":\"纳娜米(飞船)\",\"quality\":130}"))
                {
                    remove_from_character_inventory([{item_key:"{\"id\":\"纳娜米(飞船)\",\"quality\":130}"}]);
                    log_message(`Sis in the inventory has gone home!`,"enemy_enhanced");
                }
                else if(enemy_killcount["舰船中枢B6[BOSS]"] <= 1)
                {
                    log_message(`[Sayuki] Huh? Sis is nowhere to be found.`,"sayuki");
                    log_message(`[Sayuki] You really beat that core with 420 billion HP! Incredible!`,"sayuki");
                    log_message(`[Sayuki] Well then, as a small reward for the victor,`,"sayuki");
                    log_message(`[Sayuki] this sis here will be left in your care.`,"sayuki");
                }
                
                update_displayed_character_inventory({was_anything_new_added:true});
                //unlock_location("荒兽森林营地");
                if(enemy_killcount["舰船中枢B6[BOSS]"] <= 1){
                    current_game_time.go_up(1080000);
                    //2年
                }
            }
            if(target.name == "左阿(垂死)[BOSS]"){
                locations["幻境核心 - B1"].is_unlocked = false;
                locations["幻境核心 - B2"].is_unlocked = false;
                locations["幻境核心 - B3"].is_unlocked = false;
                inf_combat.S3.live = false;
                locations["幻境核心·决战"].is_unlocked = false;
                locations["幻境核心·出口"].is_unlocked = true;
                change_location("幻境核心·出口");
                
                log_message(`击败左阿！自动切换地图【幻境核心·出口】！`,"enemy_enhanced");
                log_message(`【幻境核心·决战】已封锁且无法进入！`,"enemy_enhanced");
                log_message(`所有状态效果已清除！`,"enemy_enhanced");
                Object.keys(active_effects).forEach(key => {
                    delete active_effects[key];
                });

            }
            kill_enemy(target);
        }


        update_displayed_health_of_enemies();
        
        if(target.spec.includes(32)){
            let {damage_taken, fainted} = character.take_damage([],{damage_value: damage_dealt*0.2},0);
            
            log_message(character.name + " took " + format_number(damage_taken) + " damage [Counter]", "hero_attacked");
            update_displayed_health();
            if(fainted)
            {
                faint(" was defeated by counterattack damage");
            }
        }//反戈
    } else {
        const effect = document.getElementById(`E${target_num}_effect`);
        if(effect) {
            effect.classList.add('evade');
            effect.addEventListener('animationend', () => {
                effect.classList.remove('evade');
            }, { once: true });
        }

        //闪避
        if(target.spec.includes(29)){
            let {damage_taken, fainted} = character.take_damage([],{damage_value: target.spec_value[29]},0);
            update_displayed_health();
            log_message(character.name + " missed, and took " + format_number(damage_taken) + " damage [Repel]", "hero_missed");
            if(fainted) faint(" was defeated by repel damage")
        }
        else if(!options.option_combat_filter) log_message(character.name + " missed", "hero_missed");
    }
    if(target.spec.includes(35)){
        let {damage_taken, fainted} = character.take_damage([],{damage_value: Math.max(target.spec_value[35]-character.stats.full.agility,0)},0);
        update_displayed_health();
        log_message(character.name + " took " + format_number(damage_taken) + " damage [Domain]", "hero_attacked");
        if(fainted) faint(" was defeated by domain damage")
    }//领域
}

/**
 * sets enemy to dead, disabled their attack, checks if that was the last enemy in group
 * @param {Enemy} enemy 
 * @return {Boolean} if that was the last of an enemy group
 */
function kill_enemy(target) {
    target.is_alive = false;
    const enemy_key = target.id || target.name;
    if(target.add_to_bestiary) {
        if(enemy_killcount[enemy_key]) {
            enemy_killcount[enemy_key] += 1;
            update_bestiary_entry(enemy_key);
        } else {
            enemy_killcount[enemy_key] = 1;
            create_new_bestiary_entry(enemy_key);
            if(enemy_key == "毛茸茸" || target.name == "Fluffy") add_bestiary_lines(11);
            add_bestiary_zones(enemy_key);
        }
    }
    const enemy_id = current_enemies.findIndex(enemy => enemy===target);
    clear_enemy_attack_loop(enemy_id);
}


/**
 * adds xp to skills, handles their levelups and tooltips
 * @param skill - skill object 
 * @param {Number} xp_to_add 
 * @param {Boolean} should_info 
 */
function add_xp_to_skill({skill, xp_to_add = 1, should_info = true, use_bonus = true, add_to_parent = true})
{
    let leveled = false;
    if(xp_to_add == 0) {
        return leveled;
    } else if(xp_to_add < 0) {
        console.error(`Tried to add negative xp to skill ${skill.skill_id}`);
        return leveled;
    }

    if(use_bonus) {
        xp_to_add = xp_to_add * get_skill_xp_gain(skill.skill_id);

        if(skill.parent_skill) {
            xp_to_add *= skill.get_parent_xp_multiplier();
        }
    }
    
    const prev_name = skill.name();
    const was_hidden = skill.visibility_treshold > skill.total_xp;
    
    const {message, gains, unlocks} = skill.add_xp({xp_to_add: xp_to_add});
    const new_name = skill.name();
    if(skill.parent_skill && add_to_parent) {
        if(skill.total_xp > skills[skill.parent_skill].total_xp) {
            /*
                add xp to parent if skill would now have more than the parent
                calc xp ammount so that it's no more than the difference between child and parent
            */
            let xp_for_parent = Math.min(skill.total_xp - skills[skill.parent_skill].total_xp, xp_to_add);
            add_xp_to_skill({skill: skills[skill.parent_skill], xp_to_add: xp_for_parent, should_info, use_bonus: false, add_to_parent});
        }
    }

    const is_visible = skill.visibility_treshold <= skill.total_xp;

    if(was_hidden && is_visible) 
    {
        create_new_skill_bar(skill);
        update_displayed_skill_bar(skill, false);
        
        if(typeof should_info === "undefined" || should_info) {
            log_message(`Unlocked new skill: ${skill.name()}`, "skill_raised");
        }
    } 

    if(gains) { 
        character.stats.add_skill_milestone_bonus(gains);
        if(skill.skill_id === "Unarmed") {
            character.stats.add_all_equipment_bonus();
        }
    }
    
    if(is_visible) 
    {
        if(typeof message !== "undefined"){ 
        //not undefined => levelup happened and levelup message was returned
            leveled = true;

            update_displayed_skill_bar(skill, true);

            if(typeof should_info === "undefined" || should_info)
            {
                log_message(message, "skill_raised");
                update_character_stats();
            }

            if(typeof skill.get_effect_description !== "undefined")
            {
                update_displayed_skill_description(skill);
            }

            if(skill.is_parent) {
                update_all_displayed_skills_xp_gain();
            }
            else {
                update_displayed_skill_xp_gain(skill);
            }

            //no point doing any checks for optimization

            for(let i = 0; i < unlocks?.skills?.length; i++) {
                const unlocked_skill = skills[unlocks.skills[i]];
                
                if(which_skills_affect_skill[unlocks.skills[i]]) {
                    if(!which_skills_affect_skill[unlocks.skills[i]].includes(skill.skill_id)) {
                        which_skills_affect_skill[unlocks.skills[i]].push(skill.skill_id);
                    }
                } else {
                    which_skills_affect_skill[unlocks.skills[i]] = [skill.skill_id];
                }

                if(unlocked_skill.is_unlocked) {
                    continue;
                }
                
                unlocked_skill.is_unlocked = true;
        
                create_new_skill_bar(unlocked_skill);
                update_displayed_skill_bar(unlocked_skill, false);
                
                if(typeof should_info === "undefined" || should_info) {
                    log_message(`Unlocked new skill: ${unlocked_skill.name()}`, "skill_raised");
                }
            }

            if(prev_name !== new_name) {
                if(which_skills_affect_skill[skill.skill_id]) {
                    for(let i = 0; i < which_skills_affect_skill[skill.skill_id].length; i++) {
                        update_displayed_skill_bar(skills[which_skills_affect_skill[skill.skill_id][i]], false);
                    }
                }

                if(!was_hidden && (typeof should_info === "undefined" || should_info)) {
                    log_message(`Skill ${prev_name} leveled up to ${new_name}`, "skill_raised");
                }

                if(current_location?.connected_locations) {
                    for(let i = 0; i < current_location.activities.length; i++) {
                        if(activities[current_location.activities[i].activity_name].base_skills_names.includes(skill.skill_id)) {
                            update_gathering_tooltip(current_location.activities[i]);
                        }
                    }
                }
            }

        } else {
            update_displayed_skill_bar(skill, false);
        }
    } else {
        //
    }

    return leveled;
}

/**
 * adds xp to character, handles levelups
 * @param {Number} xp_to_add 
 * @param {Boolean} should_info 
 */
function add_xp_to_character(xp_to_add, should_info = true, use_bonus,ingore_cap) {
    
    const level_up = character.add_xp({xp_to_add, use_bonus}, ingore_cap);
    
    if(level_up) {
        if(should_info) {
            log_message(level_up, "level_up");
        }
        if(!level_up.includes("Bottleneck")) character.stats.full.health = character.stats.full.max_health; //free healing on level up, because it's a nice thing to have
        update_character_stats();
    }

    update_displayed_character_xp(level_up);
}


function get_spec_rewards(money){
    if(money == 11037){
        global_flags["is_evolve_studied"] = true;
        log_message(`${flag_unlock_texts["is_evolve_studied"]}`, "activity_unlocked");
        return;
    }
    if(money == 11038){
        add_to_character_inventory([{item: getItem({...item_templates["星解之术"], quality: 160}), count: 1}]);
        log_message(`Obtained Star Destruction`, "activity_unlocked");
        return;
    }
    if(money == 216){
        add_xp_to_skill({skill: skills["Moonwheels"],xp_to_add: 9999e12,should_info:true,use_bonus:false,add_to_parent:false},);
        log_message(`Brother Feng demonstrated the moonwheel technique, [Silver Frost Moonwheel] gained 9999 trillion XP!`, "activity_unlocked");
        return;
    }
    let RNG_M = Math.pow(Math.max(Math.random(),1e-6),-1.5)
    log_message(`Looted the ruins, obtained ${format_money(Math.floor(RNG_M * money))} .`, "location_reward");
    
    character.money += Math.floor(RNG_M * money);
    update_displayed_money();
    const trader = traders["Ruins Merchant"];
    if(!trader.is_unlocked) {
        if(Math.random() >= money * 2e-7) {//4% 8% 12% 16% 20%
            trader.is_unlocked = true;
            log_message(`Unlocked [Ruins Merchant]`, "location_reward");
        }
        else if(Math.random() >= money * 5e-7){
            log_message(`${character.name} senses an aura of wealth and trade nearby ....`, "location_reward");
        }//6 12 18 24 30
    }
    //TODO: Add Ruins Merchant unlock logic, and stop showing the prompt once unlocked.

}
/**
 * @param {Location} location game Location object
 * @description handles all the rewards for clearing location (both first and subsequent clears), adding xp and unlocking stuff
 */
function get_location_rewards(location) {

    let should_return = false;
        if(location.is_challenge) {
            location.is_finished = true;
            if(location.name.includes("幻境核心 - B")){
                location.is_finished = false;
                should_return = true;
                //特判：幻境核心自选打怪虽然是挑战区域但是不会清空
                //挑战区域仅仅为了避开楼层手册
            }
        }
    update_displayed_combat_location(location,true);
    if(location.repeatable_reward.money && typeof location.repeatable_reward.money === "number") {
        get_spec_rewards(location.repeatable_reward.money);//2-5搜刮钱
    }
    if(location.enemy_groups_killed == location.enemy_count) { //first clear

        should_return = true;

    if(location.first_reward.xp && typeof location.first_reward.xp === "number") {
            create_new_levelary_entry(location.name);
            log_message(`First clear of ${location.name}, gained ${format_number(location.first_reward.xp)} XP `, "location_reward");
            add_xp_to_character(location.first_reward.xp);
            if(location.name == "Wild Beast Forest - 1"){
                log_message(`In battle, ${character.name} gained an insight for breaking through to Earth Rank.`, "enemy_enhanced");
                add_to_character_inventory([{item: item_templates["凝实荒兽森林感悟"], count: 1}]);
            }
        }
    } else if(location.repeatable_reward.xp && typeof location.repeatable_reward.xp === "number") {
        log_message(`Cleared ${location.name}, gained bonus ${format_number(location.repeatable_reward.xp)} XP `, "location_reward");
        add_xp_to_character(location.repeatable_reward.xp);
        if(location.name.includes("Wild Beast Forest") && (Math.random()<0.1) && character.xp.current_level <= 8){
            log_message(`In battle, ${character.name} randomly gained another insight for breaking through to Earth Rank.`, "enemy_enhanced");
            add_to_character_inventory([{item: item_templates["凝实荒兽森林感悟"], count: 1}]);
        }
        
    }


    //all below: on each clear, so that if something gets added after location was cleared, it will still be unlockable

    location.otherUnlocks();

    for(let i = 0; i < location.repeatable_reward.locations?.length; i++) { //unlock locations
        if(!location.repeatable_reward.locations[i].required_clears || location.enemy_groups_killed/location.enemy_count >= location.repeatable_reward.locations[i].required_clears){
            unlock_location(locations[location.repeatable_reward.locations[i].location]);
        }
    }

    for(let i = 0; i < location.repeatable_reward.traders?.length; i++) { //unlock traders
        const trader = traders[location.repeatable_reward.traders[i].traders];
        if(!trader.is_unlocked) {
            trader.is_unlocked = true;
            log_message(`Unlocked new trader: ${trader.name}`, "activity_unlocked");
        }
    }
    
    for(let i = 0; i < location.repeatable_reward.flags?.length; i++) {
        global_flags[location.repeatable_reward.flags[i]] = true;
    }

    for(let i = 0; i < location.repeatable_reward.textlines?.length; i++) { //unlock textlines
        var any_unlocked = false;
        for(let j = 0; j < location.repeatable_reward.textlines[i].lines.length; j++) {
            if(dialogues[location.repeatable_reward.textlines[i].dialogue].textlines[location.repeatable_reward.textlines[i].lines[j]].is_unlocked == false) {
                any_unlocked = true;
                dialogues[location.repeatable_reward.textlines[i].dialogue].textlines[location.repeatable_reward.textlines[i].lines[j]].is_unlocked = true;
            }
        }
        if(any_unlocked) {
            log_message(`You should speak with ${dialogues[location.repeatable_reward.textlines[i].dialogue]?.name ?? location.repeatable_reward.textlines[i].dialogue}`, "dialogue_unlocked");
            //maybe do this only when there's just 1 dialogue with changes?
        }
    }

    for(let i = 0; i < location.repeatable_reward.dialogues?.length; i++) { //unlocking dialogues
        const dialogue = dialogues[location.repeatable_reward.dialogues[i]]
        if(!dialogue.is_unlocked) {
            dialogue.is_unlocked = true;
            log_message(`You can now talk with ${dialogue.name}`, "activity_unlocked");
        }
    }

    //activities
    for(let i = 0; i < location.repeatable_reward.activities?.length; i++) {
        if(locations[location.repeatable_reward.activities[i].location].activities[location.repeatable_reward.activities[i].activity].tags?.gathering 
            && !global_flags.is_gathering_unlocked) {
                return;
            }

        unlock_activity({location: location.repeatable_reward.activities[i].location,
                            activity: locations[location.repeatable_reward.activities[i].location].activities[location.repeatable_reward.activities[i].activity]});
    }

    if(location.name == "Na Family Secret Realm - ∞" && Math.floor(inf_combat.A6.cur * 1.25) > inf_combat.A6.cap){
        inf_combat.A6.cap = Math.floor(inf_combat.A6.cur * 1.25);
        log_message(`Formation power cap raised: ${inf_combat.A6.cur} -> ${inf_combat.A6.cap} !`, "dialogue_unlocked");
    }

    if(should_return) {
        change_location(current_location.parent_location.name); //go back to parent location, only on first clear
    }
}

/**
 * 
 * @param location game location object 
 */
function unlock_location(location,skip_chance = false) {
    if(!location.is_unlocked){
        location.is_unlocked = true;
        const message = location.unlock_text || `Unlocked location: ${location.name}`;
        if(location.spec_hint != undefined)
        {
            log_message(location.spec_hint, "sayuki")
        }
        log_message(message, "location_unlocked") 

        //reloads the location (assumption is that a new one was unlocked by clearing a zone)
        if(!current_dialogue && !skip_chance) {
            change_location(current_location.name);
        }
    }
}

function clear_enemies() {
    current_enemies = null;
}

let latest_comp = "";

function use_recipe(target,stated = false) {
    const category = target.parentNode.parentNode.dataset.crafting_category;
    const subcategory = target.parentNode.parentNode.dataset.crafting_subcategory;
    const recipe_id = target.parentNode.dataset.recipe_id;
    const station_tier = current_location.crafting.tiers[category];
    let stated_f = 0;

    if(!category || !subcategory || !recipe_id) {
        //shouldn't be possible to reach this
        throw new Error(`Tried to use a recipe but either category, subcategory, or recipe id was not passed: ${category} - ${subcategory} - ${recipe_id}`);
    } else if(!recipes[category][subcategory][recipe_id]) {
        //shouldn't be possible to reach this
        throw new Error(`Tried to use a recipe that doesn't exist: ${category} -> ${subcategory} -> ${recipe_id}`);
    } else {
        const selected_recipe = recipes[category][subcategory][recipe_id];
        const recipe_div = document.querySelector(`[data-crafting_category="${category}"] [data-crafting_subcategory="${subcategory}"] [data-recipe_id="${recipe_id}"]`);
        let leveled = false;
        let result;
        if(subcategory === "items" || subcategory === "items2" || subcategory === "items3") {
            if(selected_recipe.get_availability()) {
                total_crafting_attempts++;
                const success_chance = selected_recipe.get_success_chance(station_tier);
                result = selected_recipe.getResult();
                const {result_id, count} = result;
                
                for(let i = 0; i < selected_recipe.materials.length; i++) {
                    const key = item_templates[selected_recipe.materials[i].material_id].getInventoryKey();
                    if(!stated) remove_from_character_inventory([{item_key: key, item_count: selected_recipe.materials[i].count}]);
                    else character.remove_from_inventory([{item_key: key, item_count: selected_recipe.materials[i].count}]);
                } 
                const exp_value = get_recipe_xp_value({category, subcategory, recipe_id});
                let success;
                if(success_chance>=0.999) success=true;
                else success = (Math.random() < success_chance)
                if(success) {
                    total_crafting_successes++;
                    if(selected_recipe.Q_able != undefined){
                        if(!stated) add_to_character_inventory([{item: getItem({...item_templates[result_id], quality: selected_recipe.Q_able}), count: count}]);
                        else character.add_to_inventory([{item: getItem({...item_templates[result_id], quality: selected_recipe.Q_able}), count: count}]);
                    }
                    else{
                        if(!stated) add_to_character_inventory([{item: item_templates[result_id], count: count}]);
                        else character.add_to_inventory([{item: item_templates[result_id], count: count}]);
                    }//批量制作不要特喵刷新物品栏！！
                    //带品质的物品(标准方案)
                    //燃灼术/星解之术/2-4后道具均为蓝色130%
                    if(!stated) log_message(`Crafted ${item_templates[result_id].getName()} x${count}`, "crafting");
                    else stated_f +=1;
                    leveled = add_xp_to_skill({skill: skills[selected_recipe.recipe_skill], xp_to_add: exp_value});
                } else {
                    if(!stated) log_message(`Failed to craft ${item_templates[result_id].getName()}!`, "crafting");

                    leveled = add_xp_to_skill({skill: skills[selected_recipe.recipe_skill], xp_to_add: exp_value/2});
                }
                if(!stated){
                    update_item_recipe_visibility();
                    update_item_recipe_tooltips();
                }
                //do those two wheter success or fail since materials get used either way

                if(leveled) {
                    //todo: reload all recipe tooltips of matching category
                }
            } else {
                console.warn(`Tried to use an unavailable recipe!`);
            }
            if(stated) return stated_f;
            
        } else if(subcategory === "components" || selected_recipe.recipe_type === "component" ) {
            //read the selected material, pass it as param

            const material_div = recipe_div.children[1].querySelector(".selected_material");
            if(!material_div) {
                console.log("div not found")
                return -1;
            } else {
                const material_1_key = material_div.dataset.item_key;
                let H_q = 0;
                const {id} = JSON.parse(material_1_key);
                const recipe_material = selected_recipe.materials.filter(x=> x.material_id===id)[0];

                if(recipe_material.count <= character.inventory[material_1_key]?.count) {
                    total_crafting_attempts++;
                    total_crafting_successes++;
                    result = selected_recipe.getResult(character.inventory[material_1_key].item, station_tier);
                    if(!stated){
                        add_to_character_inventory([{item: result, count: 1}]);
                        remove_from_character_inventory([{item_key: material_1_key, item_count: recipe_material.count}]);
                    }
                    else{
                        character.add_to_inventory([{item: result, count: 1}]);
                        character.remove_from_inventory([{item_key: material_1_key, item_count: recipe_material.count}]);
                    }
                    if(!stated) log_message(`Crafted ${result.getName()} [Quality ${result.quality}%]`, "crafting");
                    else H_q = result.quality;
                    latest_comp = result.getName();
                    const exp_value = get_recipe_xp_value({category, subcategory, recipe_id, material_count: recipe_material.count, rarity_multiplier: rarity_multipliers[result.getRarity()], result_tier: result.component_tier});
                    
                    leveled = add_xp_to_skill({skill: skills[selected_recipe.recipe_skill], xp_to_add: exp_value});
                    if(!stated) material_div.classList.remove("selected_material");
                    if(character.inventory[material_1_key]) { 
                        //if item is still present in inventory + if there's not enough of it = change recipe color
                        if(recipe_material.count > character.inventory[material_1_key].count) { 
                            material_div.classList.add("recipe_unavailable");
                        }
                    } else if(!stated){
                        material_div.remove();
                    }
                    if(!stated) update_displayed_material_choice({category, subcategory, recipe_id, refreshing: true});
                    //update_displayed_crafting_recipes();
                } else {
                    console.log("Tried to create an item without having necessary materials");
                    H_q = -1;
                    if(stated)
                    {
                        
                        if(!character.inventory[material_1_key]) material_div.remove();
                        material_div.classList.remove("selected_material");
                        update_displayed_material_choice({category, subcategory, recipe_id, refreshing: true});
                    }
                }
                if(stated) return H_q;
            }
            
        } else if(subcategory === "equipment") {
            //read the selected components, pass them as params
            
            let component_1_key = recipe_div.children[1].children[0].children[1].querySelector(".selected_component")?.dataset.item_key;
            
            let component_2_key = recipe_div.children[1].children[1].children[1].querySelector(".selected_component")?.dataset.item_key;
            if(!component_1_key && (recipe_div.children[1].children[0].children[1].children[0] !== undefined))
            {
                
                recipe_div.children[1].children[0].children[1].children[0].classList.add('selected_component');
                component_1_key = recipe_div.children[1].children[0].children[1].querySelector(".selected_component")?.dataset.item_key;
                const component_1_name = recipe_div.children[1].children[0].children[1].querySelector(".selected_component")?.dataset.item_name;
                if(!stated) log_message(`Auto-switched material: ${component_1_name}`, "crafting");
            }
            if(!component_2_key && (recipe_div.children[1].children[1].children[1].children[0] !== undefined))
            {

                recipe_div.children[1].children[1].children[1].children[0].classList.add('selected_component');
                component_2_key = recipe_div.children[1].children[1].children[1].querySelector(".selected_component")?.dataset.item_key;
                const component_2_name = recipe_div.children[1].children[1].children[1].querySelector(".selected_component")?.dataset.item_name;
                if(!stated) log_message(`Auto-switched material: ${component_2_name}`, "crafting");
            }
            if(!component_1_key || !component_2_key) {
                return -1;
            } else {
                let H_q = 0;
                if(!character.inventory[component_1_key] || !character.inventory[component_2_key]) {
                    throw new Error(`Tried to create item with components that are not present in the inventory!`);
                } else {
                    total_crafting_attempts++;
                    total_crafting_successes++;
                    result = selected_recipe.getResult(character.inventory[component_1_key].item, character.inventory[component_2_key].item, station_tier);
                    if(!stated) {
                        remove_from_character_inventory([{item_key: component_1_key}, {item_key: component_2_key}]);
                        add_to_character_inventory([{item: result}]);
                    }
                    else{
                        character.remove_from_inventory([{item_key: component_1_key}, {item_key: component_2_key}]);
                        character.add_to_inventory([{item: result}]);
                    }

                    
                    if(!stated) log_message(`Crafted ${result.getName()} [Quality ${result.quality}%]`, "crafting");
                    else H_q = result.quality;
                
                    const id_1 = JSON.parse(component_1_key).id;
                    const id_2 = JSON.parse(component_2_key).id;

                    const exp_value = get_recipe_xp_value({category, subcategory, recipe_id, selected_components: [item_templates[id_1], item_templates[id_2]], rarity_multiplier: rarity_multipliers[result.getRarity()]})
                    
                    leveled = add_xp_to_skill({skill: skills[selected_recipe.recipe_skill], xp_to_add: exp_value});
                    
                    const component_keys = {};
                    component_keys[component_1_key] = true;
                    component_keys[component_2_key] = true;
                    

                    update_displayed_component_choice({category, recipe_id, component_keys});
                }
                if(stated) return H_q;
            }
            //update_displayed_crafting_recipes();
        }  
    }
}

function use_recipe_max(target) {
    const category = target.parentNode.parentNode.dataset.crafting_category;
    const subcategory = target.parentNode.parentNode.dataset.crafting_subcategory;
    const recipe_id = target.parentNode.dataset.recipe_id;
    const station_tier = current_location.crafting.tiers[category];
    if(!category || !subcategory || !recipe_id) {
        //shouldn't be possible to reach this
        throw new Error(`Tried to use a recipe but either category, subcategory, or recipe id was not passed: ${category} - ${subcategory} - ${recipe_id}`);
    } else if(!recipes[category][subcategory][recipe_id]) {
        //shouldn't be possible to reach this
        throw new Error(`Tried to use a recipe that doesn't exist: ${category} -> ${subcategory} -> ${recipe_id}`);
    } else {
        const selected_recipe = recipes[category][subcategory][recipe_id];
        const recipe_div = document.querySelector(`[data-crafting_category="${category}"] [data-crafting_subcategory="${subcategory}"] [data-recipe_id="${recipe_id}"]`);
        let leveled = false;
        let result;
        if(subcategory === "items" || subcategory === "items2" || subcategory === "items3") {
            let cnt = 0;
            let cnt_s = 0;
            while(selected_recipe.get_availability()) {
                cnt++;
                cnt_s += use_recipe(target,true);
            }
            result = selected_recipe.getResult();
            const {result_id, count} = result;
            update_displayed_character_inventory();
            update_item_recipe_visibility();
            update_item_recipe_tooltips();
            log_message(`Batch crafted ${item_templates[result_id].getName()}, ${cnt_s}/${cnt} succeeded`, "crafting");

        } else if(subcategory === "components" || selected_recipe.recipe_type === "component" ) {
        
            let cnt = 0;
            let cnt_b = 0;
            let cnt_f = 0;
            
            while(cnt_f != -1)
            {
                cnt++;
                cnt_f = use_recipe(target,true)
                cnt_b = Math.max(cnt_b,cnt_f);
            }
            
            update_displayed_character_inventory();
            log_message(`Batch crafted ${latest_comp} * ${cnt - 1}, highest quality: ${cnt_b}%`, "crafting");

        } else if(subcategory === "equipment") {
            let cnt = 0;
            let cnt_b = 0;
            let cnt_f = 0;
            
            while(cnt_f != -1)
            {
                cnt++;
                cnt_f = use_recipe(target,true)
                cnt_b = Math.max(cnt_b,cnt_f);
            }
            
            update_displayed_character_inventory();
            log_message(`Batch crafted ${cnt - 1} pieces of equipment, highest quality: ${cnt_b}%`, "crafting");
            
        }
    }
}

function character_equip_item(item_key) {
    equip_item_from_inventory(item_key);
    if(current_enemies) {
        reset_combat_loops();
    }
}
function character_unequip_item(item_slot) {
    unequip_item(item_slot);
    if(current_enemies) {
        reset_combat_loops();
        //set_new_combat({enemies: current_enemies});
    }
}


function use_item(item_key,stated = false) { 
    const {id} = JSON.parse(item_key);
    const item_effects = item_templates[id].effects;
    const G_value = item_templates[id].gem_value;
    let C_value = item_templates[id].C_value;
    let E_value = item_templates[id].E_value;

    if(!character.is_in_inventory(item_key))
    {
        
        update_displayed_effects();
        character.stats.add_active_effect_bonus();
        update_character_stats();
        return;
    }

    let used = false;
    if(item_templates[id].spec != 0){
        let I_spec = item_templates[id].spec;
        if(I_spec == "T8-table"){
            //unlock 符文之屋
            unlock_location(locations["符文之屋"]);
            log_message(`As the rune workbench set is placed, a small cottage rises from the ground. In these ruins, ${character.name} has found a warm haven.`,"gather_loot")
        }
        else if(I_spec == "freezing_engine"){
            //unlock 极寒相变引擎
            engine_init();
            dialogues["极寒相变引擎"].textlines["engine"].is_unlocked = true;
            log_message(`旋律合金作为活塞，多孔冰晶作为隔热，冰原超流体作为热容……冰原的环境本十分恶劣，${character.name} 却掌握了巧妙利用它的方法。`,"gather_loot")
        }
        else if(I_spec == "saved_trader"){
            inf_combat.B6 = inf_combat.B6 || 0;
            inf_combat.B6 += 1;
            log_message(`释放了第${inf_combat.B6}个冰宫商人！`,"gather_loot");
            if(inf_combat.B6 <= 9999) log_message(`进货倍率 ${(inf_combat.B6 ** 0.8).toFixed(2)}x , 品质加成: ${(Math.log(inf_combat.B6) * 9).toFixed(1)}%`,"gather_loot");
            else log_message(`之前的9999个商人已经垄断了燕岗领的生意！抓来更多的也没用了！`,"gather_loot");
            //基础品质:140%~180%
            if(inf_combat.B6 == 1){
                //解锁冰宫商人！
                
                const bg_trader = traders["冰宫商人"];
                bg_trader.is_unlocked = true;
            }
        }
        else if(I_spec == "random-potion"){
            let Potion_name = {0:"B9·灵闪药剂",1:"B9·异界药剂",2:"B9·散华药剂",3:"B9·反戈药剂"}
            let Rnd = '';
            for(let cnt=1;cnt<=5;cnt++){
                Rnd = Potion_name[Math.floor(Math.random()*4)]
                //log_message(`从 B9·??药剂 中获取了 ${Rnd}! (${cnt} / 5)`,"combat_loot");
                character.add_to_inventory([{ "item": getItem(item_templates[Rnd]), "count": 1 }]);
            }
            
            update_displayed_character_inventory({was_anything_new_added:true});
        }
        else if(I_spec = "HeartDemon_nerf"){
            global_flags["qz_percent"] = (global_flags["qz_percent"] || 0) + 1;
            if(global_flags["qz_percent"]>100) global_flags["qz_percent"] = 100;
            log_message(`牵制领悟度提升到了 ${global_flags["qz_percent"]}%!`,"gather_loot");
        }
    }
    if(item_templates[id].realmcap!=-1)
    {
        if(item_templates[id].realmcap<character.xp.current_level)
        {
            log_message(`Your realm is <span class=realm_${window.REALMS[character.xp.current_level][5]}>${window.REALMS[character.xp.current_level][1]}</span>, which exceeds <span class=realm_${window.REALMS[item_templates[id].realmcap][5]}>${window.REALMS[item_templates[id].realmcap][1]}</span>, so you cannot use ${item_templates[id].getName()}`, `gather_loot`);
            
            remove_from_character_inventory([{item_key}]);
            return;
        }
    }
    for(let i = 0; i < item_effects.length; i++) {
        const duration = item_templates[id].effects[i].duration;
        let s_dur = duration;
        //if(!active_effects[item_effects[i].effect] || active_effects[item_effects[i].effect].duration < duration) {
        if(active_effects[item_effects[i].effect]) s_dur += (active_effects[item_effects[i].effect].duration || 0)
        active_effects[item_effects[i].effect] = new ActiveEffect({...effect_templates[item_effects[i].effect], duration:s_dur});
        used = true;
        //}
    }


    if(G_value > 0)//using gems
    {
        used=true;
        let message = `Used ${item_templates[id].getName()}, `
        let SCGV = 30;//SoftCappedGemValue
        let HPMV = 50;//HealthPointMultiplierValue
        if(G_value > 7500) HPMV *= 2;//殿堂级修正
        let P1,P2,P3,P4;//相对概率(修正后)
        P1=Math.pow(((character.stats.flat.gems.attack_power||0)/G_value +1),-1.5);
        if(character.stats.flat.gems.attack_power >= SCGV*G_value) P1*=0.5;
        P2=Math.pow(((character.stats.flat.gems.defense||0)/G_value +1),-1.5);
        if(character.stats.flat.gems.defense >= SCGV*G_value) P2*=0.5;
        P3=Math.pow(((character.stats.flat.gems.agility||0)/G_value +1),-1.5);
        if(character.stats.flat.gems.agility >= SCGV*G_value) P3*=0.5;
        P4=Math.pow(((character.stats.flat.gems.max_health||0)/G_value/HPMV +1),-1.5);
        if(character.stats.flat.gems.max_health >= SCGV*HPMV*G_value) P4*=0.5;
        let pa = 0;
        if(character.stats.flat.gems.attack_power >= SCGV*G_value*3)
        {
            let PM = Math.max(Math.max(P1,P2),Math.max(P3,P4));
            if(PM==P1){
                pa=0.5;
            }
            else if(PM==P2)
            {
                pa=1.5;
            }
            else if(PM==P3)
            {
                pa=2.5;
            }
            else pa=3.5;
            P1 = P2 = P3 = P4 =1;
        }//3倍软上限/抛弃RNG
        else pa = Math.random()*(P1+P2+P3+P4);
        if(id.includes("剑")) pa=0;
        if(pa<P1)//STR
        {
            message += `Attack increased by `;
            character.stats.flat.gems.attack_power=character.stats.flat.gems.attack_power || 0;
            if(character.stats.flat.gems.attack_power < SCGV*G_value)
            {
                character.stats.flat.gems.attack_power = character.stats.flat.gems.attack_power+ G_value;
                message += `${format_number(G_value)}`;
            }
            else
            {
                let X_value = character.stats.flat.gems.attack_power/G_value/SCGV;
                let R_value = G_value * Math.exp(-5 * (X_value + 1 - 2 * Math.sqrt(X_value)));//[Softcapped]
                character.stats.flat.gems.attack_power = character.stats.flat.gems.attack_power + R_value;
                message += `${format_number(R_value)}[soft cap]`;
            }
        }
        else if(pa<P1+P2)//DEF
        {
            message += `Defense increased by `;
            character.stats.flat.gems.defense=character.stats.flat.gems.defense || 0;
            if(character.stats.flat.gems.defense < SCGV*G_value)
            {
                character.stats.flat.gems.defense = character.stats.flat.gems.defense+ G_value;
                message += `${format_number(G_value)}`;
            }
            else
            {
                let X_value = character.stats.flat.gems.defense/G_value/SCGV;
                let R_value = G_value * Math.exp(-5 * (X_value + 1 - 2 * Math.sqrt(X_value)));//[Softcapped]
                character.stats.flat.gems.defense = character.stats.flat.gems.defense + R_value;
                message += `${format_number(R_value)}[soft cap]`;
            }
        }
        else if(pa<P1+P2+P3)//AGI
        {
            message += `Agility increased by `;
            character.stats.flat.gems.agility=character.stats.flat.gems.agility || 0;
            if(character.stats.flat.gems.agility < SCGV*G_value)
            {
                character.stats.flat.gems.agility = character.stats.flat.gems.agility+ G_value;
                message += `${format_number(G_value)}`;
            }
            else
            {
                let X_value = character.stats.flat.gems.agility/G_value/SCGV;
                let R_value = G_value * Math.exp(-5 * (X_value + 1 - 2 * Math.sqrt(X_value)));//[Softcapped]
                character.stats.flat.gems.agility = character.stats.flat.gems.agility+ R_value;
                message += `${format_number(R_value)}[soft cap]`;
            }
        }
        else
        {
            message += `Max HP increased by `;
            character.stats.flat.gems.max_health=character.stats.flat.gems.max_health || 0;
            if(character.stats.flat.gems.max_health < SCGV * G_value * HPMV)
            {
                character.stats.flat.gems.max_health = character.stats.flat.gems.max_health+ G_value * HPMV;
                message += `${format_number(G_value * HPMV)}`;
            }
            else
            {
                let X_value = character.stats.flat.gems.max_health/G_value/SCGV/HPMV;
                let R_value = G_value * HPMV * Math.exp(-5 * (X_value + 1 - 2 * Math.sqrt(X_value)));//[Softcapped]
                character.stats.flat.gems.max_health = character.stats.flat.gems.max_health+ R_value;
                message += `${format_number(R_value)}[soft cap]`;
            }
        }
        message += ".";
        if(!stated) log_message(message, `gather_loot`);
    }

    if(E_value != 0)
    {
        let E_modi = (C_value==2)?(0.2**(Math.max(0,character.xp.current_level-19))):(1);
        add_xp_to_character(E_value*E_modi,true,false,C_value);
        log_message(`Used ${item_templates[id].getName()}, gained ${format_number(E_value*E_modi)} XP${E_modi==1?"":`(under-realm penalty -${format_number((1-E_modi)*100)}%)`}`,"gather_loot");
        if(E_modi != 1){
            if(E_value == 1e11){
                inf_combat.B3 = inf_combat.B3 || 0;
                log_message(`Due to insufficient energy absorption, some genetic primal energy has overflowed!`,"gather_loot")
                log_message(`Swamp radiation spread: ${format_number(inf_combat.B3 )} % -> ${format_number(inf_combat.B3 + 10 * (1 -  E_modi))} % `,"gather_loot")
                inf_combat.B3 += 10 * (1 -  E_modi);
            }
        }
    }

    if(used && !stated) {
        update_displayed_effects();
        character.stats.add_active_effect_bonus();
        update_character_stats();
    }
    if(!stated) remove_from_character_inventory([{item_key}]);
    else character.remove_from_inventory([{item_key}]);//批量情况下延迟更新，不使用打包完毕的函数
}

function use_item_max(item_key)
{
    let {id} = JSON.parse(item_key);
    let cnt=0;
    let A0,D0,G0,H0,A1,D1,G1,H1;
    A0=character.stats.flat.gems.attack_power,D0=character.stats.flat.gems.defense,G0=character.stats.flat.gems.agility,H0=character.stats.flat.gems.max_health;
    while(character.is_in_inventory(item_key))
    {
        use_item(item_key,true);
        cnt++;
    }
    update_displayed_character_inventory(character_sorting);
    character.stats.add_active_effect_bonus();
    update_character_stats();
    A1=character.stats.flat.gems.attack_power,D1=character.stats.flat.gems.defense,G1=character.stats.flat.gems.agility,H1=character.stats.flat.gems.max_health;
    log_message(`Batch used ${cnt} x ${item_templates[id]?.getName?.() ?? id}.`, `gather_loot`);
    A0=A0||0,A1=A1||0,D0=D0||0,D1=D1||0,G0=G0||0,G1=G1||0,H0=H0||0,H1=H1||0;
    if(A1!=A0||D1!=D0||G1!=G0||H1!=H0) log_message(`Gained ${format_number((A1-A0)||0)} attack, ${format_number((D1-D0)||0)} defense, ${format_number((G1-G0)||0)} agility, ${format_number((H1-H0)||0)} max HP.`, `gather_loot`);
    return;
}



function get_date() {
    const date = new Date();
    const year = date.getFullYear();
    const month_num = date.getMonth()+1;
    const month = month_num > 9 ? month_num.toString() : "0" + month_num.toString();
    const day = date.getDate() > 9 ? date.getDate().toString() : "0" + date.getDate().toString();
    const hour = date.getHours() > 9 ? date.getHours().toString() : "0" + date.getHours().toString();
    const minute = date.getMinutes() > 9 ? date.getMinutes().toString() : "0" + date.getMinutes().toString();
    const second = date.getSeconds() > 9 ? date.getSeconds().toString() : "0" + date.getSeconds().toString();
    return `${year}-${month}-${day} ${hour}_${minute}_${second}`;
}

function is_on_dev() {
    return window.location.href.endsWith("-dev/");
}

function is_JSON(str) {
    try {
        return (JSON.parse(str) && !!str);
    } catch (e) {
        return false;
    }
}

/**
 * puts all important stuff into a string
 * @returns string with save data
 */
function create_save() {
    try{
        const save_data = {};
        save_data["game version"] = game_version;
        save_data["current time"] = current_game_time;
        save_data.saved_at = get_date();
        save_data.total_playtime = total_playtime;
        save_data.total_deaths = total_deaths;
        save_data.total_crafting_attempts = total_crafting_attempts;
        save_data.total_crafting_successes = total_crafting_successes;
        save_data.total_kills = total_kills;
        save_data.global_flags = global_flags;
        save_data.gem_stats = character.stats.flat.gems;//存储宝石属性
        save_data.inf_combat = inf_combat;//无限秘境
        
        save_data["character"] = {
                                name: character.name, titles: character.titles, 
                                bonus_skill_levels:  character.bonus_skill_levels,
                                inventory: {}, equipment: character.equipment,
                                money: character.money, 
                                C_scaling: character.C_scaling,
                                xp: {
                                total_xp: 0,
                                current_xp: character.xp.current_xp,
                                current_level: character.xp.current_level,
                                },
                                hp_to_full: character.stats.full.max_health - character.stats.full.health,
                            };
                            
        //no need to save all stats; on loading, base stats will be taken from code and then additional stuff will be calculated again (in case anything changed)
        Object.keys(character.inventory).forEach(key =>{
            save_data["character"].inventory[key] = {count: character.inventory[key].count};
        });
       
        //Object.keys(character.equipment).forEach(key =>{
            //save_data["character"].equipment[key] = true;
            //todo: need to rewrite equipment loading first
        //});

        save_data["skills"] = {};
        Object.keys(skills).forEach(function(key) {
            if(!skills[key].is_parent)
            {
                save_data["skills"][skills[key].skill_id] = {total_xp: skills[key].total_xp}; 
                //a bit redundant, but keep it in case key in skills is different than skill_id
            }
        }); //only save total xp of each skill, again in case of any changes
        
        save_data["current location"] = current_location.name;

        save_data["locations"] = {};
        Object.keys(locations).forEach(function(key) { 
            save_data["locations"][key] = {};
            if(locations[key].is_unlocked) {      
                save_data["locations"][key].is_unlocked = true;
            }
            if(locations[key].is_finished) {      
                save_data["locations"][key].is_finished = true;
            }

            if("parent_location" in locations[key]) { //combat zone
                save_data["locations"][key]["enemy_groups_killed"] = locations[key].enemy_groups_killed;
            }

            if(locations[key].activities) {
                save_data["locations"][key]["unlocked_activities"] = []
                Object.keys(locations[key].activities).forEach(activity_key => {
                    if(locations[key].activities[activity_key].is_unlocked) {
                        save_data["locations"][key]["unlocked_activities"].push(activity_key);
                    }
                });
            }
        }); //save locations' (and their activities') unlocked status and their killcounts

        save_data["activities"] = {};
        Object.keys(activities).forEach(function(activity) {
            if(activities[activity].is_unlocked) {
                save_data["activities"][activity] = {is_unlocked: true};
            }
        }); //save activities' unlocked status (this is separate from unlock status in location)

        if(current_activity) {
            save_data["current_activity"] = {activity_id: current_activity.id, 
                                             working_time: current_activity.working_time, 
                                             earnings: current_activity.earnings,
                                             gathering_time: current_activity.gathering_time,
                                             done_actions: current_activity.done_actions,
                                            };
        }
        
        save_data["dialogues"] = {};
        Object.keys(dialogues).forEach(function(dialogue) {
            save_data["dialogues"][dialogue] = {is_unlocked: dialogues[dialogue].is_unlocked, is_finished: dialogues[dialogue].is_finished, textlines: {}};
            if(dialogues[dialogue].textlines) {
                Object.keys(dialogues[dialogue].textlines).forEach(function(textline) {
                    save_data["dialogues"][dialogue].textlines[textline] = {is_unlocked: dialogues[dialogue].textlines[textline].is_unlocked,
                                                                is_finished: dialogues[dialogue].textlines[textline].is_finished};
                });
            }
        }); //save dialogues' and their textlines' unlocked/finished statuses

        save_data["traders"] = {};
        Object.keys(traders).forEach(function(trader) {
            if(traders[trader].is_unlocked) {
                if(traders[trader].last_refresh == -1 || traders[trader].can_refresh()) {
                    //no need to save inventory, as trader would be anyway refreshed on any visit
                    save_data["traders"][trader] = {last_refresh: -1,
                                                    is_unlocked: traders[trader].is_unlocked};
                } else {
                    const t_inventory = {};
                    Object.keys(traders[trader].inventory).forEach(key =>{
                        t_inventory[key] = {count: traders[trader].inventory[key].count};
                    });
                    save_data["traders"][trader] = {inventory: t_inventory, 
                                                    last_refresh: traders[trader].last_refresh, 
                                                    is_unlocked: traders[trader].is_unlocked
                                                };
                }
            }
        });

        save_data["books"] = {};
        Object.keys(book_stats).forEach(book => {
            if(book_stats[book].accumulated_time > 0 || book_stats[book].is_finished) {
                //check both conditions, on loading set as finished if either 'is_finished' or has enough time accumulated
                save_data["books"][book] = {
                    accumulated_time: book_stats[book].accumulated_time,
                    is_finished: book_stats[book].is_finished
                };
            }
        });

        save_data["is_reading"] = is_reading;

        save_data["is_sleeping"] = is_sleeping;

        save_data["active_effects"] = active_effects;

        save_data["enemy_killcount"] = enemy_killcount;

        save_data["loot_sold_count"] = loot_sold_count;

        save_data["last_combat_location"] = last_combat_location;
        save_data["last_location_with_bed"] = last_location_with_bed;

        save_data["options"] = options;

        save_data["stances"] = {};
        Object.keys(stances).forEach(stance => {
            if(stances[stance].is_unlocked) {
                save_data["stances"][stance] = true;
            }
        }) 
        save_data["current_stance"] = current_stance;
        save_data["selected_stance"] = selected_stance;
        save_data["faved_stances"] = faved_stances;

        save_data["message_filters"] = {
            unlocks: document.documentElement.style.getPropertyValue('--message_unlocks_display') !== "none",
            events: document.documentElement.style.getPropertyValue('--message_events_display') !== "none",
            combat: document.documentElement.style.getPropertyValue('--message_combat_display') !== "none",
            loot: document.documentElement.style.getPropertyValue('--message_loot_display') !== "none",
            background: document.documentElement.style.getPropertyValue('--message_background_display') !== "none",
            crafting: document.documentElement.style.getPropertyValue('--message_crafting_display') !== "none",
        };

        return JSON.stringify(save_data);
    } catch(error) {
        console.error("Something went wrong on saving the game!");
        console.error(error);
        log_message("FAILED TO CREATE A SAVE FILE, PLEASE CHECK CONSOLE FOR ERRORS AND REPORT IT", "message_critical");
    }
} 

/**
 * called from index.html
 * @returns save string encoded to base64
 */
function save_to_file() {
    
    const encodedContent = encodeURIComponent(create_save());
    return btoa(encodedContent);
}

/**
 * saves game state to localStorage, on manual saves also logs message about it being done
 * @param {Boolean} is_manual 
 */
function save_to_localStorage({key, is_manual}) {
    const save = create_save();
    if(locations["纳家练兵场 - 1"].is_unlocked)
    {
        if(save) {
            localStorage.setItem(key, save);
        }
        
        if(is_manual) {
            log_message("Game saved manually");
            save_counter = 0;
        }
        return JSON.parse(save).saved_at;
    }
    else
    {
        log_message("Blocked generation of an unsafe save file");
        save_counter = 0;
        return 0;
    }
}

function save_progress() {
    if(is_on_dev()) {
        save_to_localStorage({key: dev_save_key, is_manual: true});
    } else {
        save_to_localStorage({key: save_key, is_manual: true});
    }
}

function load(save_data) {
    //single loading method
    
    //current enemies are not saved

    current_game_time.load_time(save_data["current time"]);
    time_field.innerHTML = current_game_time.toString();
    //set game time

    Object.keys(save_data.global_flags||{}).forEach(flag => {
        global_flags[flag] = save_data.global_flags[flag];
    });

    total_playtime = save_data.total_playtime || 0;
    total_deaths = save_data.total_deaths || 0;
    total_crafting_attempts = save_data.total_crafting_attempts || 0;
    total_crafting_successes = save_data.total_crafting_successes || 0;
    inf_combat = save_data.inf_combat || {"A6":{cur:6,cap:8},"A7":{cur:0},"VP":{num:0}};//无限秘境

    name_field.value = save_data.character.name;
    character.name = save_data.character.name;
    character.bonus_skill_levels = save_data.character.bonus_skill_levels;
    character.stats.flat.gems = save_data.gem_stats;

    last_location_with_bed = save_data.last_location_with_bed;
    last_combat_location = save_data.last_combat_location;

    options.uniform_text_size_in_action = save_data.options?.uniform_text_size_in_action;
    option_uniform_textsize(options.uniform_text_size_in_action);

    options.auto_return_to_bed = save_data.options?.auto_return_to_bed;
    option_bed_return(options.auto_return_to_bed);

    options.disable_combat_autoswitch = save_data.options?.disable_combat_autoswitch;
    option_combat_autoswitch(options.disable_combat_autoswitch);

    options.remember_message_log_filters = save_data.options?.remember_message_log_filters;
    
    if(save_data.message_filters) {
        Object.keys(message_log_filters).forEach(filter => {
            message_log_filters[filter] = save_data.message_filters[filter] ?? true;
        })
    }
    option_remember_filters(options.remember_message_log_filters);

    options.option_combat_filter = save_data.options?.option_combat_filter;
    option_combat_filter(options.option_combat_filter);

    options.option_format_change = save_data.options?.option_format_change;
    option_format_change(options.option_format_change);


    //this can be removed at some point
    const is_from_before_eco_rework = compare_game_version("v0.3.5", save_data["game version"]) == 1;
    setLootSoldCount(save_data.loot_sold_count || {});

    character.money = (save_data.character.money || 0) * ((is_from_before_eco_rework == 1)*10 || 1);
    update_displayed_money();

    if(save_data.character.C_scaling != undefined) character.C_scaling = save_data.character.C_scaling;
    else character.C_scaling = {};
    character.xp.current_level = save_data.character.xp.current_level || 0;
    add_xp_to_character(save_data.character.xp.current_xp || 0, false);
    for(let realm = 1;realm <= character.xp.current_level || 0;realm ++)
    {
        let this_realm = window.REALMS[realm];
        let realm_spd_gain = 0;
        if(this_realm[0]==3) realm_spd_gain = 0.1;
        if(this_realm[0]==6) realm_spd_gain = 0.15;
        character.stats.flat.level.max_health = (character.stats.flat.level.max_health || 0) + this_realm[3];
        character.stats.flat.level.health = character.stats.flat.level.max_health;
        character.stats.flat.level.agility = (character.stats.flat.level.agility || 0) + this_realm[2];
        character.stats.flat.level.defense = (character.stats.flat.level.defense || 0) + this_realm[2];
        character.stats.flat.level.attack_power = ( character.stats.flat.level.attack_power || 0) + this_realm[2] * 2; 
        character.stats.flat.level.attack_speed = ( character.stats.flat.level.attack_speed || 0) + realm_spd_gain;
        if(this_realm[0]>=9 && this_realm[0]<=17){
            let A_mul_gain = (this_realm[0]==9?0.2:0.1);
            character.stats.flat.level.attack_mul = ( character.stats.flat.level.attack_mul || 0) + A_mul_gain;}
        if(this_realm[0]>=19 && this_realm[0]<=27){
            let Luck_gain = (this_realm[0]==19?0.2:0.1);
            character.stats.flat.level.luck = ( character.stats.flat.level.luck || 0) + Luck_gain;
        }
        if(this_realm[0]==19){
            character.stats.multiplier.level.crit_rate = 0.25;
            character.stats.multiplier.level.crit_multiplier = 4;
        }
        let total_skill_xp_multiplier = 1.1;
        if(this_realm[0]>=3) total_skill_xp_multiplier += 0.05;
        if(this_realm[0]>=6) total_skill_xp_multiplier += 0.05;
        if(this_realm[0]>=9) total_skill_xp_multiplier += 0.05;
        if(this_realm[0]>=19) total_skill_xp_multiplier += 0.15;
        character.xp_bonuses.multiplier.levels.all_skill = (character.xp_bonuses.multiplier.levels.all_skill || 1) * total_skill_xp_multiplier;
        //复制粘贴的升级代码，只不过没有提示
        //注：以后升级代码需要在这里多写一份。
    }
    
    update_displayed_character_xp(true);
    if(save_data.character.xp.total_xp != 0) add_xp_to_character(save_data.character.xp.total_xp, false);
        const E_body = document.body;
    if(character.xp.current_level >= 19) E_body.classList.add('sky_root');
    else if(character.xp.current_level >= 9 && character.xp.current_level <= 18) E_body.classList.add('terra_root');


    Object.keys(save_data.skills).forEach(function(key){ 
        if(key === "Literacy") {
            return; //done separately, for compatibility with older saves (can be eventually remove)
        }
        const resolved_skill_key = resolve_skill_key(key);
        if(resolved_skill_key && skills[resolved_skill_key] && !skills[resolved_skill_key].is_parent){
            if(save_data.skills[key].total_xp > 0) {
                add_xp_to_skill({skill: skills[resolved_skill_key], xp_to_add: save_data.skills[key].total_xp, 
                                    should_info: false, add_to_parent: true, use_bonus: false
                                });
            }
        } else if(save_data.skills[key].total_xp > 0) {
                console.warn(`Skill "${key}" couldn't be found!`);
        }
    }); //add xp to skills

    if(save_data.books) {
        let total_book_xp = 0;
        const literacy_xp = save_data.skills["Literacy"].total_xp;
        Object.keys(save_data.books).forEach(book=>{
            if(!item_templates[book]) {
                console.warn(`Book ${book} couldn't be found and was skipped!`);
            }

            if(save_data.books[book].accumulated_time > 0) {
                if(save_data.books[book].is_finished) {
                    item_templates[book].setAsFinished();
                    total_book_xp += book_stats[book].required_time * book_stats[book].literacy_xp_rate;
                } else {
                    item_templates[book].addProgress(save_data.books[book].accumulated_time);
                    total_book_xp += book_stats[book].accumulated_time * book_stats[book].literacy_xp_rate;
                }
            }
        });
        if(total_book_xp > literacy_xp) {
            add_xp_to_skill({skill: skills["Literacy"], should_info: false, xp_to_add: total_book_xp, use_bonus: false});
            console.warn(`Saved XP for "Literacy skill" was less than it should be based on progress with books (${literacy_xp} vs ${total_book_xp}), so it was adjusted to match it!`);
        } else {
            add_xp_to_skill({skill: skills["Literacy"], should_info: false, xp_to_add: literacy_xp, use_bonus: false});
        }
    }

    if(save_data["stances"]) {
        Object.keys(save_data["stances"]).forEach(stance => {
            const resolved_stance_key = resolve_stance_key(stance);
            if(resolved_stance_key) {
                stances[resolved_stance_key].is_unlocked = true;
            } else {
                console.warn(`Stance "${stance}" couldn't be found!`);
            }
        });
    }
    update_displayed_stance_list();
    if(save_data.current_stance) {
        current_stance = resolve_stance_key(save_data.current_stance) || "normal";
        selected_stance = resolve_stance_key(save_data.selected_stance) || current_stance;
        change_stance(selected_stance);
    }
    
    if(save_data.faved_stances) {
        Object.keys(save_data.faved_stances).forEach(stance_id=> {
            const resolved_stance_key = resolve_stance_key(stance_id);
            if(resolved_stance_key && stances[resolved_stance_key].is_unlocked) {
                fav_stance(resolved_stance_key);
            }
        });
    }

    Object.keys(save_data.character.equipment).forEach(function(key){
        if(save_data.character.equipment[key] != null) {
            const quality_mult = compare_game_version("v0.4.4", save_data["game version"]) == 1?100:1; //x100 if its from before quality rework
            try{
                if(key === "weapon") {
                    const {quality, equip_slot} = save_data.character.equipment[key];
                    let components;
                    if(save_data.character.equipment[key].components) {
                        components = save_data.character.equipment[key].components
                    } else {
                        const {head, handle} = save_data.character.equipment[key];
                        components = {head, handle};
                    }

                    if(!item_templates[components.head]){
                        console.warn(`Skipped item: weapon head component "${components.head}" couldn't be found!`);
                    } else if(!item_templates[components.handle]) {
                        console.warn(`Skipped item: weapon handle component "${components.handle}" couldn't be found!`);
                    } else {
                        const item = getItem({components, quality:quality*quality_mult, equip_slot, item_type: "EQUIPPABLE"});
                        equip_item(item);
                    }
                } else if(key === "off-hand") {
                    const {quality, equip_slot} = save_data.character.equipment[key];
                    let components;
                    if(save_data.character.equipment[key].components) {
                        components = save_data.character.equipment[key].components
                    } else {
                        const {shield_base, handle} = save_data.character.equipment[key];
                        components = {shield_base, handle};
                    }

                    if(!item_templates[components.shield_base]){
                        console.warn(`Skipped item: shield base component "${components.shield_base}" couldn't be found!`);
                    } else if(!item_templates[components.handle]) {
                        console.warn(`Skipped item: shield handle "${components.handle}" couldn't be found!`);
                    } else {
                        const item = getItem({components, quality:quality*quality_mult, equip_slot, item_type: "EQUIPPABLE"});
                        equip_item(item);
                    }
                } else if(save_data.character.equipment[key].equip_slot === "arti'fact" || save_data.character.equipment[key].tags?.tool) {
                    const saved = save_data.character.equipment[key];
                    if(saved.tags?.tool && item_templates[saved.id]) {
                        equip_item(getItem({...item_templates[saved.id], quality: saved.quality}));
                    } else {
                        equip_item(getItem(saved));
                    }
                } else { //armor
                    
                    const {quality, equip_slot} = save_data.character.equipment[key];
                    
                    if(save_data.character.equipment[key].components && save_data.character.equipment[key].components.internal.includes(" [component]")) {
                        //compatibility for armors from before v0.4.3
                        const item = getItem({...item_templates[save_data.character.equipment[key].components.internal.replace(" [component]","")], quality:quality*quality_mult});
                        equip_item(item);
                    }
                    else if(save_data.character.equipment[key].components) {
                        let components = save_data.character.equipment[key].components;
                        if(!item_templates[components.internal]){
                            console.warn(`Skipped item: internal armor component "${components.internal}" couldn't be found!`);
                        } else if(components.external && !item_templates[components.external]) {
                            console.warn(`Skipped item: external armor component "${components.external}" couldn't be found!`);
                        } else {
                            const item = getItem({components, quality:quality*quality_mult, equip_slot, item_type: "EQUIPPABLE"});
                            equip_item(item);
                        }
                    } else {
                        const item = getItem({...item_templates[save_data.character.equipment[key].id], quality:quality*quality_mult});
                        equip_item(item);
                    }

                }
            } catch (error) {
                console.error(error);
            }
        }
    }); //equip proper items

    if(character.equipment.weapon === null) {
        equip_item(null);
    }

    const item_list = [];

    Object.keys(save_data.character.inventory).forEach(function(key){
        if(is_JSON(key)) {
            //case where this is False is left as compatibility for saves before v0.4.4
            let {id, components, quality} = JSON.parse(key);
            if(id && !quality) { 
                //id is just a key of item_templates
                //if it's present, item is "simple" (no components)
                //and if it has no quality, it's something non-equippable
                if(item_templates[id]) {
                    if(save_data.character.inventory[key].count >= 1) item_list.push({item: getItem(item_templates[id]), count: save_data.character.inventory[key].count});
                    else console.warn(`Illegal value of ${key} x ${save_data.character.inventory[key].count} in inventory, item was deleted`);
                } else {
                    console.warn(`Inventory item "${key}" from save on version "${save_data["game version"]} couldn't be found!`);
                    return;
                }
            } else if(components) {
                const {head, handle, shield_base, internal, external} = components;
                if(head) { //weapon
                    if(!item_templates[head]){
                        console.warn(`Skipped item: weapon head component "${head}" couldn't be found!`);
                        return;
                    } else if(!item_templates[handle]) {
                        console.warn(`Skipped item: weapon handle component "${handle}" couldn't be found!`);
                        return;
                    } else {
                        const item = getItem({components, quality, equip_slot: "weapon", item_type: "EQUIPPABLE"});
                        item_list.push({item, count: save_data.character.inventory[key].count});
                    }
                } else if(shield_base){ //shield
                    if(!item_templates[shield_base]){
                        console.warn(`Skipped item: shield base component "${shield_base}" couldn't be found!`);
                        return;
                    } else if(!item_templates[handle]) {
                        console.warn(`Skipped item: shield handle component "${handle}" couldn't be found!`);
                        return;
                    } else {
                        const item = getItem({components, quality, equip_slot: "off-hand", item_type: "EQUIPPABLE"});
                        item_list.push({item, count: save_data.character.inventory[key].count});
                    }
                } else if(internal) { //armor
                    if(!item_templates[internal]){
                        console.warn(`Skipped item: internal armor component "${internal}" couldn't be found!`);
                        return;
                    } else if(!item_templates[external]) {
                        console.warn(`Skipped item: external armor component "${external}" couldn't be found!`);
                        return;
                    } else {
                        let equip_slot = getArmorSlot(internal);
                        if(!equip_slot) {
                            return;
                        }
                        const item = getItem({components, quality, equip_slot, item_type: "EQUIPPABLE"});
                        item_list.push({item, count: save_data.character.inventory[key].count});
                    }
                } else {
                    console.error(`Intentory key "${key}" from save on version "${save_data["game version"]} seems to refer to non-existing item type!`);
                }
            } else if(quality) { //no comps but quality (clothing / artifact?)
                const item = getItem({...item_templates[id], quality});
                item_list.push({item, count: save_data.character.inventory[key].count});
            } else {
                console.error(`Intentory key "${key}" from save on version "${save_data["game version"]} is incorrect!`);
            }
            
        } else {
            if(Array.isArray(save_data.character.inventory[key])) { //is a list of unstackable items (equippables or books), needs to be added 1 by 1
                for(let i = 0; i < save_data.character.inventory[key].length; i++) {
                    try{
                        if(save_data.character.inventory[key][i].item_type === "EQUIPPABLE" )
                        {
                            if(save_data.character.inventory[key][i].equip_slot === "weapon") {
                                
                                const {quality, equip_slot} = save_data.character.inventory[key][i];
                                let components;
                                if(save_data.character.inventory[key][i].components) {
                                    components = save_data.character.inventory[key][i].components
                                } else {
                                    const {head, handle} = save_data.character.inventory[key][i];
                                    components = {head, handle};
                                }
    
                                if(!item_templates[components.head]){
                                    console.warn(`Skipped item: weapon head component "${components.head}" couldn't be found!`);
                                } else if(!item_templates[components.handle]) {
                                    console.warn(`Skipped item: weapon handle component "${components.handle}" couldn't be found!`);
                                } else {
                                    const item = getItem({components, quality: quality*100, equip_slot, item_type: "EQUIPPABLE"});
                                    item_list.push({item, count: 1});
                                }
                            } else if(save_data.character.inventory[key][i].equip_slot === "off-hand") {
                                const {quality, equip_slot} = save_data.character.inventory[key][i];
                                let components;
                                if(save_data.character.inventory[key][i].components) {
                                    components = save_data.character.inventory[key][i].components
                                } else {
                                    const {shield_base, handle} = save_data.character.inventory[key][i];
                                    components = {shield_base, handle};
                                }
    
                                if(!item_templates[components.shield_base]){
                                    console.warn(`Skipped item: shield base component "${components.shield_base}" couldn't be found!`);
                                } else if(!item_templates[components.handle]) {
                                    console.warn(`Skipped item: shield handle "${components.handle}" couldn't be found!`);
                                } else {
                                    const item = getItem({components, quality: quality*100, equip_slot, item_type: "EQUIPPABLE"});
                                    item_list.push({item, count: 1});
                                }
                            } else if(save_data.character.inventory[key][i].equip_slot === "artifact") {
                                item_list.push({item: getItem(save_data.character.inventory[key][i]), count: 1});
                            } else { //armor
                                const {quality, equip_slot} = save_data.character.inventory[key][i];
    
                                if(save_data.character.inventory[key][i].components && save_data.character.inventory[key][i].components.internal.includes(" [component]")) {
                                    //compatibility for armors from before v0.4.3
                                    const item = getItem({...item_templates[save_data.character.inventory[key][i].components.internal.replace(" [component]","")], quality: quality});
                                    item_list.push({item, count: 1});
                                }
                                else if(save_data.character.inventory[key][i].components) {
                                    let components = save_data.character.inventory[key][i].components;
                                    if(!item_templates[components.internal]){
                                        console.warn(`Skipped item: internal armor component "${components.internal}" couldn't be found!`);
                                    } else if(components.external && !item_templates[components.external]) {
                                        console.warn(`Skipped item: external armor component "${components.external}" couldn't be found!`);
                                    } else {
                                        const item = getItem({components, quality: quality*100, equip_slot, item_type: "EQUIPPABLE"});
                                        item_list.push({item, count: 1});
                                    }
                                } else {
                                    const item = getItem({...item_templates[save_data.character.inventory[key][i].id], quality: quality*100});
                                    item_list.push({item, count: 1});
                                }
                            }
                        } else {
                            item_list.push({item: getItem({...item_templates[save_data.character.inventory[key][i].id], quality: save_data.character.inventory[key][i].quality*100}), count: 1});
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
            else { //is stackable 
                if(item_templates[key]) {
                    item_list.push({item: getItem(item_templates[save_data.character.inventory[key].item.id || save_data.character.inventory[key].item.name]), count: save_data.character.inventory[key].count});
                } else {
                    console.warn(`Inventory item "${key}" from save on version "${save_data["game version"]}" couldn't be found!`);
                    return;
                }
            }
        }
    }); //add all loaded items to list
    add_to_character_inventory(item_list); // and then to inventory

    Object.keys(save_data.dialogues).forEach(function(dialogue) {
        if(dialogues[dialogue]) {
            dialogues[dialogue].is_unlocked = save_data.dialogues[dialogue].is_unlocked;
            dialogues[dialogue].is_finished = save_data.dialogues[dialogue].is_finished;
        } else {
            console.warn(`Dialogue "${dialogue}" couldn't be found!`);
            return;
        }
        if(save_data.dialogues[dialogue].textlines) {  
            Object.keys(save_data.dialogues[dialogue].textlines).forEach(function(textline){
                if(dialogues[dialogue].textlines[textline]) {
                    dialogues[dialogue].textlines[textline].is_unlocked = save_data.dialogues[dialogue].textlines[textline].is_unlocked;
                    dialogues[dialogue].textlines[textline].is_finished = save_data.dialogues[dialogue].textlines[textline].is_finished;
                } else {
                    console.warn(`Textline "${textline}" in dialogue "${dialogue}" couldn't be found!`);
                    return;
                }
            }); 
        }
    }); //load for dialogues and their textlines their unlocked/finished status

    Object.keys(save_data.traders).forEach(function(trader) { 
        const resolved_trader_key = resolve_trader_key(trader);
        let trader_item_list = [];
        if(resolved_trader_key && traders[resolved_trader_key]){

            //set as unlocked (it must have been unlocked to be saved, so no need to check the actual value)
            traders[resolved_trader_key].is_unlocked = true;

            if(save_data.traders[trader].inventory) {
                Object.keys(save_data.traders[trader].inventory).forEach(function(key){
                    if(is_JSON(key)) {
                        //case where this is False is left as compatibility for saves before v0.4.4
                        let {id, components, quality} = JSON.parse(key);
                        if(id && !quality) { 
                            //id is just a key of item_templates
                            //if it's present, item is "simple" (no components)
                            //and if it has no quality, it's something non-equippable
                            if(item_templates[id]) {
                                if(save_data.traders[trader].inventory[key].count >= 1) trader_item_list.push({item: getItem(item_templates[id]), count: save_data.traders[trader].inventory[key].count});
                                else console.warn(`Illegal value of ${id} x ${save_data.character.inventory[key].count} in traders , item was deleted`);
                            } else {
                                console.warn(`Inventory item "${key}" from save on version "${save_data["game version"]} couldn't be found!`);
                                return;
                            }
                        } else if(components) {
                            const {head, handle, shield_base, internal, external} = components;
                            if(head) { //weapon
                                if(!item_templates[head]){
                                    console.warn(`Skipped item: weapon head component "${head}" couldn't be found!`);
                                    return;
                                } else if(!item_templates[handle]) {
                                    console.warn(`Skipped item: weapon handle component "${handle}" couldn't be found!`);
                                    return;
                                } else {
                                    const item = getItem({components, quality, equip_slot: "weapon", item_type: "EQUIPPABLE"});
                                    trader_item_list.push({item, count: 1});
                                }
                            } else if(shield_base){ //shield
                                if(!item_templates[shield_base]){
                                    console.warn(`Skipped item: shield base component "${shield_base}" couldn't be found!`);
                                    return;
                                } else if(!item_templates[handle]) {
                                    console.warn(`Skipped item: shield handle component "${handle}" couldn't be found!`);
                                    return;
                                } else {
                                    const item = getItem({components, quality, equip_slot: "off-hand", item_type: "EQUIPPABLE"});
                                    trader_item_list.push({item, count: 1});
                                }
                            } else if(internal) { //armor
                                if(!item_templates[internal]){
                                    console.warn(`Skipped item: internal armor component "${internal}" couldn't be found!`);
                                    return;
                                } else if(!item_templates[external]) {
                                    console.warn(`Skipped item: external armor component "${external}" couldn't be found!`);
                                    return;
                                } else {
                                    let equip_slot = getArmorSlot(internal);
                                    if(!equip_slot) {
                                        return;
                                    }
                                    const item = getItem({components, quality, equip_slot, item_type: "EQUIPPABLE"});
                                    trader_item_list.push({item, count: 1});
                                }
                            } else {
                                console.error(`Intentory key "${key}" from save on version "${save_data["game version"]} seems to refer to non-existing item type!`);
                            }
                        } else if(quality) { //no comps but quality (clothing / artifact?)
                            const item = getItem({...item_templates[id], quality});
                            trader_item_list.push({item, count: save_data.traders[trader].inventory[key].count});
                        } else {
                            console.error(`Intentory key "${key}" from save on version "${save_data["game version"]} is incorrect!`);
                        }
                        
                    } else {
                        if(Array.isArray(save_data.traders[trader].inventory[key])) { //is a list of unstackable (equippable or book) item, needs to be added 1 by 1
                            for(let i = 0; i < save_data.traders[trader].inventory[key].length; i++) {
                                try{
                                    if(save_data.traders[trader].inventory[key][i].item_type === "EQUIPPABLE"){
                                        if(save_data.traders[trader].inventory[key][i].equip_slot === "weapon") {
                                            const {quality, equip_slot} = save_data.traders[trader].inventory[key][i];
                                            let components;
                                            if(save_data.traders[trader].inventory[key][i].components) {
                                                components = save_data.traders[trader].inventory[key][i].components
                                            } else {
                                                const {head, handle} = save_data.traders[trader].inventory[key][i];
                                                components = {head, handle};
                                            }
    
                                            if(!item_templates[components.head]){
                                                console.warn(`Skipped item: weapon head component "${components.head}" couldn't be found!`);
                                            } else if(!item_templates[components.handle]) {
                                                console.warn(`Skipped item: weapon handle component "${components.handle}" couldn't be found!`);
                                            } else {
                                                const item = getItem({components, quality: quality*100, equip_slot, item_type: "EQUIPPABLE"});
                                                trader_item_list.push({item, count: 1});
                                            }
                                        } else if(save_data.traders[trader].inventory[key][i].equip_slot === "off-hand") {
                                            
                                            const {quality, equip_slot} = save_data.traders[trader].inventory[key][i];
                                            let components;
                                            if(save_data.traders[trader].inventory[key][i].components) {
                                                components = save_data.traders[trader].inventory[key][i].components
                                            } else {
                                                const {shield_base, handle} = save_data.traders[trader].inventory[key][i];
                                                components = {shield_base, handle};
                                            }
    
                                            if(!item_templates[components.shield_base]){
                                                console.warn(`Skipped item: shield base component "${components.shield_base}" couldn't be found!`);
                                            } else if(!item_templates[components.handle]) {
                                                console.warn(`Skipped item: shield handle "${components.handle}" couldn't be found!`);
                                            } else {
                                                const item = getItem({components, quality: quality*100, equip_slot, item_type: "EQUIPPABLE"});
                                                trader_item_list.push({item, count: 1});
                                            }
                                        } else { //armor
    
                                            const {quality, equip_slot} = save_data.traders[trader].inventory[key][i];
                                            if(save_data.traders[trader].inventory[key][i].components && save_data.traders[trader].inventory[key][i].components.internal.includes(" [component]")) {
                                                //compatibility for armors from before v0.4.3
                                                const item = getItem({...item_templates[save_data.traders[trader].inventory[key][i].components.internal.replace(" [component]","")], quality: quality*100});
                                                trader_item_list.push({item, count: 1});
                                            } else if(save_data.traders[trader].inventory[key][i].components) {
                                                let components = save_data.traders[trader].inventory[key][i].components;
                                                if(!item_templates[components.internal]){
                                                    console.warn(`Skipped item: internal armor component "${components.internal}" couldn't be found!`);
                                                } else if(components.external && !item_templates[components.external]) {
                                                    console.warn(`Skipped item: external armor component "${components.external}" couldn't be found!`);
                                                } else {
                                                    const item = getItem({components, quality: quality*100, equip_slot, item_type: "EQUIPPABLE"});
                                                    trader_item_list.push({item, count: 1});
                                                }
                                            } else {
                                                const item = getItem({...item_templates[save_data.traders[trader].inventory[key][i].id], quality: quality*100});
                                                trader_item_list.push({item, count: 1});
                                            }
                                        }
                                    } else {
                                        console.warn(`Skipped item, no such item type as "${0}" could be found`)
                                    }
                                } catch (error) {
                                    console.error(error);
                                }
                            }
                        }
                        else {
                            save_data.traders[trader].inventory[key].item.value = item_templates[key].value;
                            if(item_templates[key].item_type === "EQUIPPABLE") {
                                save_data.traders[trader].inventory[key].item.equip_effect = item_templates[key].equip_effect;
                            } else if(item_templates[key].item_type === "USABLE") {
                                save_data.traders[trader].inventory[key].item.use_effect = item_templates[key].use_effect;
                            }
                            trader_item_list.push({item: getItem(item_templates[save_data.traders[trader].inventory[key].item.id]), count: save_data.traders[trader].inventory[key].count});
                        }
                    }
                });
                
            }
            traders[resolved_trader_key].refresh(); 
            traders[resolved_trader_key].inventory = {};
            add_to_trader_inventory(resolved_trader_key, trader_item_list);

            traders[resolved_trader_key].last_refresh = save_data.traders[trader].last_refresh; 
        }
        else {
            console.warn(`Trader "${trader} couldn't be found!`);
            return;
        }
    }); //load trader inventories

    Object.keys(save_data.locations).forEach(function(key) {
        if(locations[key]) {
            if(save_data.locations[key].is_unlocked) {
                locations[key].is_unlocked = true;
            }
            if(save_data.locations[key].is_finished) {
                locations[key].is_finished = true;
            }
            if("parent_location" in locations[key]) { // if combat zone
                locations[key].enemy_groups_killed = save_data.locations[key].enemy_groups_killed || 0;   
            }

            //unlock activities
            if(save_data.locations[key].unlocked_activities) {
                for(let i = 0; i < save_data.locations[key].unlocked_activities.length; i++) {
                    if(!locations[key].activities[save_data.locations[key].unlocked_activities[i]]) {
                        continue;
                    }
                    if(save_data.locations[key].unlocked_activities[i] === "plowing the fields") {
                        locations[key].activities["fieldwork"].is_unlocked = true;
                    } else {
                        locations[key].activities[save_data.locations[key].unlocked_activities[i]].is_unlocked = true;
                    }
                }
            }
        } else {
            console.warn(`Location "${key}" couldn't be found!`);
            return;
        }
    }); //load for locations their unlocked status and their killcounts

    Object.keys(save_data.activities).forEach(function(activity) {
        if(activities[activity]) {
            activities[activity].is_unlocked = save_data.activities[activity].is_unlocked || false;
        } else if(activity === "plowing the fields") {
            activities["fieldwork"].is_unlocked = save_data.activities[activity].is_unlocked || false;
        } else {
            console.warn(`Activity "${activity}" couldn't be found!`);
        }
    });

    setLootSoldCount(save_data.loot_sold_count || {});

    //load active effects if save is not from before their rework
    if(compare_game_version(save_data["game version"], "v0.4.4") >= 0){
        Object.keys(save_data.active_effects).forEach(function(effect) {
            active_effects[effect] = save_data.active_effects[effect];
        });
    }
    
    if(save_data.character.hp_to_full == null || save_data.character.hp_to_full >= character.stats.full.max_health) {
        character.stats.full.health = 1;
    } else {
        character.stats.full.health = character.stats.full.max_health - save_data.character.hp_to_full;
    }
    //if missing hp is null (save got corrupted) or its more than max_health, set health to minimum allowed (which is 1)
    //otherwise just do simple substraction
    //then same with s.t.a.m.i.n.a below
    character.stats.add_active_effect_bonus();
    character.stats.add_gem_bonus();

    update_character_stats();
    update_displayed_character_inventory();

    update_displayed_health();
    //load current health
    
    update_displayed_effects();
    if(save_data["enemy_killcount"]) {
        const killcount_migrations = {
            "Shenglv City Skeleton": "Shenglu City Skeleton",
            "Shenglv City Refugee": "Shenglu City Refugee",
        };
        add_bestiary_lines(11);
        Object.keys(save_data["enemy_killcount"]).forEach(raw_name => {
            const enemy_name = killcount_migrations[raw_name] || raw_name;
            enemy_killcount[enemy_name] = save_data["enemy_killcount"][raw_name];
            create_new_bestiary_entry(enemy_name);
            add_bestiary_zones(enemy_name);

        });
    }


    Object.keys(save_data.locations).forEach(level_name => {
        if(save_data.locations[level_name].enemy_groups_killed >= 2)
        {
            document.getElementById("levelary_box_div").style.display = "none";
            create_new_levelary_entry(level_name);
        } 
    });
    
    create_displayed_crafting_recipes();
    change_location(save_data["current location"]);

    //set activity if any saved
    if(save_data.current_activity) {
        //search for it in location from save_data
        const activity_id = save_data.current_activity.activity_id;
        if(typeof activity_id !== "undefined" && current_location.activities[activity_id] && activities[activity_id]) {
            
            start_activity(activity_id);
            if(activities[activity_id].type === "JOB") {
                current_activity.working_time = save_data.current_activity.working_time;
                current_activity.earnings = save_data.current_activity.earnings * ((is_from_before_eco_rework == 1)*10 || 1);
                document.getElementById("action_end_earnings").innerHTML = `(earnings: ${format_money(current_activity.earnings)})`;
            }

            current_activity.gathering_time = save_data.current_activity.gathering_time;
            current_activity.done_actions = save_data.current_activity.done_actions;
            
        } else {
            console.warn("Couldn't find saved activity! It might have been removed");
        }
    }

    if(save_data.is_sleeping) {
        start_sleeping();
    }
    if(save_data.is_reading) {
        start_reading(save_data.is_reading);
    }
    update_quests();

    update_displayed_time();
} //core function for loading

/**
 * called from index.html
 * loads game from file by resetting everything that needs to be reset and then calling main loading method with same parameter
 * @param {String} save_string 
 */
function load_from_file(save_string) {
    try{
        if(is_on_dev()) {
            localStorage.setItem(dev_save_key, decodeURIComponent(atob(save_string)));
        } else {
            localStorage.setItem(save_key, decodeURIComponent(atob(save_string)));
        }        
        window.location.reload(false);
    } catch (error) {
        console.error("Something went wrong on preparing to load from file!");
        console.error(error);
    }
} //called on loading from file, clears everything

/**
 * loads the game from localStorage
 * it's called when page is refreshed, so there's no need for it to reset anything
 */
function load_from_localstorage() {
    try{
        
        if(is_on_dev()) {
            if(localStorage.getItem(dev_save_key)){
                load(JSON.parse(localStorage.getItem(dev_save_key)));
                log_message("Loaded dev save. If you want to use save from live version, import it through options panel or manually");
            } else {
                load(JSON.parse(localStorage.getItem(save_key)));
                log_message("Dev save was not found. Loaded live version save.");
            }
        } else {
            load(JSON.parse(localStorage.getItem(save_key)));
        }
    } catch(error) {
        console.error("Something went wrong on loading from localStorage!");
        console.error(error);
        
        console.error("❌ ERROR loading from localStorage!");
        console.error("Error details:", error);
        
        // 获取更详细的存储信息
        console.error("Storage keys:", Object.keys(localStorage));
        
        // 记录存储大小
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            totalSize += key.length + value.length;
        }
        console.error(`Total localStorage size: ~${Math.round(totalSize / 1024)}KB`);
        
        // 用户友好的错误信息
        const errorMsg = `Failed to load save data: ${error.message || 'Unknown error'}`;
        log_message(errorMsg, "error");
        
        // Attempting recovery
        console.warn("Attempting to load empty state...");
        // window.location.reload();
        // load_from_localstorage();
    }
}

function load_backup() {
    try{
        if(is_on_dev()) {
            if(localStorage.getItem(dev_backup_key)){
                localStorage.setItem(dev_save_key, localStorage.getItem(dev_backup_key));
                window.location.reload(false);
            } else {
                console.log("Can't load backup as there is none yet.");
                log_message("Can't load backup as there is none yet.");
            }
        } else {
            if(localStorage.getItem(backup_key)){
                localStorage.setItem(save_key, localStorage.getItem(backup_key));
                window.location.reload(false);
            } else {
                console.log("Can't load backup as there is none yet.")
                log_message("Can't load backup as there is none yet.");
            }
        }
        
    } catch(error) {
        console.error("Something went wrong on loading from localStorage[BACKUP]!");
        console.error(error);
    }
}

function load_other_release_save() {
    try{
        if(is_on_dev()) {
            if(localStorage.getItem(save_key)){
                localStorage.setItem(dev_save_key, localStorage.getItem(save_key));
                window.location.reload(false);
            } else {
                console.log("There are no saves on the other release.")
                log_message("There are no saves on the other release.");
            }
        } else {
            if(localStorage.getItem(dev_save_key)){
                localStorage.setItem(save_key, localStorage.getItem(dev_save_key));
                window.location.reload(false);
            } else {
                console.log("There are no saves on the other release.");
                log_message("There are no saves on the other release.");
            }
        }
    } catch(error) {
        console.error("Something went wrong on loading from localStorage[REALESE]!");
        console.error(error);
    }
}

//update game time
function update_timer() {
    let time_passed = (character.xp.current_level>=19)?48:6;
    time_passed *= is_sleeping?5:1
    if(current_location.name.includes("水牢")) time_passed /= 3;
    time_passed = Math.ceil(time_passed);
    let D_C = current_game_time.day_count;
    current_game_time.go_up(time_passed);
    update_character_stats(); //done every second, mostly because of daynight cycle; gotta optimize it at some point
    update_displayed_time();
    if(D_C != current_game_time.day_count){
        
        inf_combat.B3 = inf_combat.B3 || 0;
        if(inf_combat.B3 > 0.01){
            let B3_after = inf_combat.B3 * 0.99 - 1;
            B3_after = Math.max(B3_after,0) 
            log_message(`A new day has begun! Primal energy radiation concentration has slightly decreased.`,"gather_loot")
            log_message(`Swamp radiation spread: ${format_number(inf_combat.B3)} % -> ${format_number(B3_after)} % `,"gather_loot")
            inf_combat.B3 = B3_after;
        }
    }
}
let MouseDown = false;
    let mousePos = { clientX: 0, clientY: 0 };   // 全局保存最新鼠标位置
function setupMouseControl() {
    document.addEventListener('pointerdown', () => {
        MouseDown = true;
    });

    document.addEventListener('pointerup', () => {
        MouseDown = false;
    });

    document.addEventListener('pointercancel', () => {
        MouseDown = false;
    });

    document.addEventListener('pointerleave', () => {
        MouseDown = false;
    });
    window.addEventListener('blur', () => {
        MouseDown = false;
    });

// 这个监听器非常轻，只负责更新坐标
    document.addEventListener('mousemove', (e) => {
    mousePos.clientX = e.clientX;
    mousePos.clientY = e.clientY;
}, { passive: true });   // passive: true 性能更好
}
setupMouseControl();

const action_div = document.getElementById("location_actions_div");
const fish_div = document.getElementById("fish_div");
const fish_progress_bar = document.getElementById("fish_progress_bar");
const fish_game_div = document.getElementById("fish_game_div");
const fish_rod_div = document.getElementById("fish_rod_div");
let fish_v = 0,fish_x = 100;
let rod_v = 0,rod_x = 100;
let bar_health = 25;
let rod_length = 40;
let fishs = {1:{id:"湖鲤鱼",name:"Lake Carp",str:40},2:{id:"青花鱼",name:"Blue Flower Fish",str:100},3:{id:"冰柱鱼",name:"Ice Pillar Fish",str:180}}
function update_displayed_fish()
{
    fish_progress_bar.style.height = bar_health.toFixed(0) + "%";
    fish_progress_bar.style.top = (100-bar_health).toFixed(0) + "%";
    fish_progress_bar.style.background = `rgb(${Math.min((100 - bar_health)*5.1,255)},${Math.min((bar_health)*5.1,255)},0)`

    fish_game_div.style.bottom = fish_x + "px";
    fish_rod_div.style.bottom = rod_x + "px";
}



function start_fishing_minigame()
{
    fish_div.style.display ="inherit";
    action_div.style.display = "none";
    let FishRNG = (get_total_skill_level("Fishing") * 0.2) * Math.random();
    let cur_fish = fishs[1];
    if(FishRNG > 0.5) cur_fish = fishs[2];
    if(FishRNG > 1.8) cur_fish = fishs[3];
    bar_health = 25;
    rod_length = 40 + get_total_skill_level("Fishing") * 4;
    fish_rod_div.style.height = rod_length + "px";
    fish_v = 0,fish_x = 40;
    rod_v = 0,rod_x = 30;
    let movinginterval = Math.round(3000 / cur_fish.str);
    let remaininterval = 1;
    let frametime = 0.03;


    //游戏初始化
    const fishId = setInterval(() => {
        
        if(fish_x + 12 < rod_x + rod_length && rod_x < fish_x + 12) bar_health += 0.4;//鱼，上钩
        else bar_health -= 0.3;//鱼，脱钩
        remaininterval -= 1;
        if(remaininterval <= 0){
            remaininterval = movinginterval;
            fish_v += (Math.random()*2-0.9)*cur_fish.str;
        }//鱼，扑腾
        fish_x += fish_v * frametime;//鱼，移动
        fish_v -= 3 * frametime;//感受到了重力
        if((fish_x <= 0 && fish_v < 0)||(fish_x >= 290 && fish_v > 0)){
            fish_v = fish_v * -0.7;
        }//鱼，反弹
        fish_v = fish_v * 0.99;//鱼，受阻。

        if(MouseDown) rod_v += 250 * frametime;
        else rod_v -= 120 * frametime;
        rod_x += rod_v * frametime;
        rod_v *= 0.99;
        //条，移动
        if((rod_x + rod_length >= 318 && rod_v > 0)){
            rod_v = rod_v * -0.4;
            rod_x = 318 - rod_length;
        }//条，反弹(上)
        if((rod_x <= 0 && rod_v < 0)){
            rod_v = rod_v * -0.8;
            rod_x = 0;
        }//条，反弹(下)

        update_displayed_fish();
        if (bar_health >= 100) {
            log_message(cur_fish.name + " is hooked!","enemy_defeated");
            action_div.style.display = "inherit";
            fish_div.style.display = "none";
            add_xp_to_skill({skill: skills["Fishing"], xp_to_add: cur_fish.str / 20});
            add_to_character_inventory([{item: item_templates[cur_fish.id], count: 1}]);
            clearInterval(fishId);
        }
        if (bar_health <= 0) {
            log_message(cur_fish.name + " got away!","enemy_enhanced");
            action_div.style.display = "inherit";
            fish_div.style.display = "none";
            clearInterval(fishId);
        }
        current_activity.gathering_time = 0;
        //不准继续！

    },frametime * 1000)
}//完整钓鱼小游戏




const fish_changed_div = document.getElementById("fish_changed_div");
const fish_progress_changed_bar = document.getElementById("fish_progress_changed_bar");
const fish_game_changed_div = document.getElementById("fish_game_changed_div");
const fish_rod_changed_div = document.getElementById("fish_rod_changed_div");
const fish_rod_2nd_div = document.getElementById("fish_rod_2nd_div");
let fish_vx = 0,fish_xx = 100;
let rod_vx = 0,rod_xx = 100;
let fish_vy = 0,fish_xy = 100;
let rod_vy = 0,rod_xy = 100;
let center_x,center_y,offset_x,offset_y;
let rod_diff = 0.750;//操控力度
let fishs_changed = {1:{id:"冰柱鱼",name:"Ice Pillar Fish",str:80},2:{id:"血莲鱼",name:"Blood Lotus Fish",str:120},3:{id:"冰柱鱼王",name:"Icicle Fish King",str:160}}
//bar_health rod_length保留
function update_displayed_fish_changed()
{
    fish_progress_changed_bar.style.height = bar_health.toFixed(0) + "%";
    fish_progress_changed_bar.style.top = (100-bar_health).toFixed(0) + "%";
    fish_progress_changed_bar.style.background = `rgb(${Math.min((100 - bar_health)*5.1,255)},${Math.min((bar_health)*5.1,255)},0)`

    fish_game_changed_div.style.bottom = fish_xx + "px";
    fish_rod_changed_div.style.bottom = rod_xx + "px";
    fish_game_changed_div.style.left = fish_xy + "px";
    fish_rod_changed_div.style.left = rod_xy + "px";
    fish_rod_2nd_div.style.bottom = rod_xx - rod_length * 0.3 + "px";
    fish_rod_2nd_div.style.left = rod_xy - rod_length * 0.3 + "px";
}


function start_fishing_minigame_changed()
{
    fish_changed_div.style.display ="inherit";
    action_div.style.display = "none";
    let FishRNG = (get_total_skill_level("Fishing") * 0.2) * Math.random();
    let cur_fish = fishs_changed[1];
    if(FishRNG > 2.5) cur_fish = fishs_changed[2];
    if(FishRNG > 4.0) cur_fish = fishs_changed[3];
    bar_health = 25;
    rod_length = 30 + get_total_skill_level("Fishing") * 3;
    fish_rod_changed_div.style.height = rod_length + "px";
    fish_rod_changed_div.style.width = rod_length + "px";
    fish_rod_2nd_div.style.height = rod_length * 1.6 + "px";
    fish_rod_2nd_div.style.width = rod_length * 1.6 + "px";
    fish_vx = 0,fish_xx = 40;
    rod_vx = 0,rod_xx = 30;
    fish_vy = 0,fish_xy = 40;
    rod_vy = 0,rod_xy = 30;
    rod_diff = Math.min(1.00,get_total_skill_level("Fishing") * 0.05);
    let movinginterval = Math.round(3000 / cur_fish.str);
    let remaininterval = 1;
    let frametime = 0.03;


    //游戏初始化
    const fishId = setInterval(() => {
        
        if((fish_xx + 12 < rod_xx + rod_length && rod_xx < fish_xx + 12) && (fish_xy + 12 < rod_xy + rod_length && rod_xy < fish_xy + 12)) bar_health += 0.4;//鱼，上钩
        else if((fish_xx + 12 < rod_xx + rod_length * 1.3 && rod_xx - rod_length * 0.3 < fish_xx + 12) && (fish_xy + 12 < rod_xy + rod_length * 1.3 && rod_xy - rod_length * 0.3 < fish_xy + 12)) bar_health += 0;//鱼，不动
        else bar_health -= 0.3;//鱼，脱钩
        remaininterval -= 1;
        if(remaininterval <= 0){
            remaininterval = movinginterval;
            fish_vx += (Math.random()*2-0.9)*cur_fish.str;
            fish_vy += (Math.random()*2-1)*cur_fish.str;
        }//鱼，扑腾(水平方向没有倾向)
        fish_xx += fish_vx * frametime;
        fish_xy += fish_vy * frametime;//鱼，移动
        fish_vx -= 60 * frametime;//感受到了重力
        if((fish_xx <= 0 && fish_vx < 0)||(fish_xx >= 290 && fish_vx > 0)){
            fish_vx = fish_vx * -0.7;
        }//鱼，反弹(X)
        if((fish_xy <= 0 && fish_vy < 0)||(fish_xy >= 290 && fish_vy > 0)){
            fish_vy = fish_vy * -0.9;
        }//鱼，反弹(Y)
        fish_vx = fish_vx * 0.99;
        fish_vy = fish_vy * 0.99;//鱼，受阻。

        if(MouseDown){
            center_x = rod_xx + rod_length / 2;
            center_y = rod_xy + rod_length / 2;
            offset_x = - mousePos.clientY - center_x + 731.5;
            offset_y = mousePos.clientX - center_y - 483.5;

            rod_vx += offset_x * rod_diff * frametime;
            rod_vy += offset_y * rod_diff * frametime;

            
        }
        rod_vx -= 60 * frametime;


        rod_xx += rod_vx * frametime;
        rod_xy += rod_vy * frametime;
        rod_vx *= 0.99,rod_vy *= 0.99;
        //条，移动
        if((rod_xx + rod_length >= 318 && rod_vx > 0)){
            rod_vx = rod_vx * -0.4;
            rod_xx = 318 - rod_length;
        }//条，反弹(上)
        if((rod_xx <= 0 && rod_vx < 0)){
            rod_vx = rod_vx * -0.8;
            rod_xx = 0;
        }//条，反弹(下)
        if((rod_xy + rod_length >= 318 && rod_vy > 0)){
            rod_vy = rod_vy * -0.9;
            rod_xy = 318 - rod_length;
        }//条，反弹(右)
        if((rod_xy <= 0 && rod_vy < 0)){
            rod_vy = rod_vy * -0.9;
            rod_xy = 0;
        }//条，反弹(左)
        //注意左右弹性系数0.9 上0.4下0.8

        update_displayed_fish_changed();
        if (bar_health >= 100) {
            log_message(cur_fish.name + " is hooked!","enemy_defeated");
            action_div.style.display = "inherit";
            fish_changed_div.style.display = "none";
            add_xp_to_skill({skill: skills["Fishing"], xp_to_add: cur_fish.str / 5});//四倍经验
            add_to_character_inventory([{item: item_templates[cur_fish.id], count: 1}]);
            clearInterval(fishId);
        }
        if (bar_health <= 0) {
            log_message(cur_fish.name + " got away!","enemy_enhanced");
            action_div.style.display = "inherit";
            fish_changed_div.style.display = "none";
            clearInterval(fishId);
        }
        current_activity.gathering_time = 0;
        //不准继续！

    },frametime * 1000)
}//完整钓鱼小游戏·改


function grass_add(a, b) {
    inf_combat.GR.grass.add([a, b]);  
}
function grass_remove(a, b) {
    for (const pair of inf_combat.GR.grass) {
        if (pair[0] === a && pair[1] === b) {
            inf_combat.GR.grass.delete(pair);
            return true;
        }
    }
    return false;
}
function grass_check(cursorX,cursorY) {
    for (const [a, b] of inf_combat.GR.grass) {
        if(((cursorX-a)**2+(cursorY-b)**2)**0.5 < 20 + skills["GrassCutting"].current_level * 2)
        {
            grass_remove(a,b);
            add_to_character_inventory([{ "item": getItem(item_templates["绝音蕨"]), "count": 1 }]);
            let light_chance = Math.floor(inf_combat.GR.eff_lvl ** 0.7 * 500);//
            let light_rnd = Math.floor(Math.random() * 1e6);
            if(light_rnd <= light_chance){
                log_message(`收割检定:1d1000000=${light_rnd}/${light_chance} `,"combat_loot");
                log_message(`成功!已获取【噬芒兰】*1.`,"combat_loot");
                add_to_character_inventory([{ "item": getItem(item_templates["噬芒兰"]), "count": 1 }]);
            }
            //nf_combat.GR.harvested += 1;
            add_xp_to_skill({skill: skills["GrassCutting"], xp_to_add: 1,should_info:true,use_bonus:true});
        }
    }
}
function grass_drew(callback) {
    for (const [a, b] of tupleSet) {
        callback(a, b);
    }
}
const grass_div = document.getElementById("grass_div");
const grass_canvas = document.getElementById('grassCanvas');
const ctx = grass_canvas.getContext('2d');
let grass_able = true;
const GRASS_SIZE = 7;
function grass_clear() {
    inf_combat.GR.grass.clear();
}
function grass_init(){
    //主要内容：草的位置，草的总数，当前收割半径等
    inf_combat.GR = {}
    inf_combat.GR.grass = new Set();
    inf_combat.GR.radius = 20;
    inf_combat.GR.grass_amount = 0;
    inf_combat.GR.grass_cap = 100;
    inf_combat.GR.eff_lvl = 0;
    inf_combat.GR.harvested = 0;//已弃用
}
function redraw_grass(){
    ctx.clearRect(0, 0, grass_canvas.width, grass_canvas.height);
    
    ctx.fillStyle = '#0f0';
    ctx.strokeStyle = '#464';
    ctx.lineWidth = 2;
    
    for (const [x, y] of inf_combat.GR.grass) {
        ctx.beginPath();
        ctx.arc(x, y, GRASS_SIZE, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    
    offset_x =  mousePos.clientX - 435;
    offset_y = mousePos.clientY - 431;
    ctx.beginPath();
    ctx.arc(offset_x , offset_y, inf_combat.GR.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    grass_check(offset_x,offset_y);
}
const grassfield_current = document.getElementById("grassfield_current");
const grassfield_cap = document.getElementById("grassfield_cap");
const grasstimer_current = document.getElementById("grasstimer_current");
const grasstimer_cap = document.getElementById("grasstimer_cap");
const grass_harvested = document.getElementById("grass_harvested");

let grass_spawn_cooldown = 1.00;
let grass_cur_cooldown = 0.00;
function update_displayed_grass(){
    
    redraw_grass();
    grassfield_current.innerText = inf_combat.GR.grass.size.toFixed(0);
    grassfield_cap.innerText = inf_combat.GR.grass_cap.toFixed(0);
    grasstimer_current.innerText = grass_cur_cooldown.toFixed(2);
    grasstimer_cap.innerText = grass_spawn_cooldown.toFixed(2);
    if((character.inventory[`{"id":"绝音蕨"}`]?.count) != undefined) grass_harvested.innerText = (character.inventory[`{"id":"绝音蕨"}`]?.count).toFixed(0);
    else grass_harvested.innerText = 0;
    //inf_combat.GR.harvested 弃用，直接读取物品栏
    //更新收割圆环形状
    //更新储存草量
    //主要内容：更新草场，更新收割圆环，更新目前储存的草
    
}
function start_grass_minigame(){

    grass_able = true;
    grass_div.style.display ="inherit";
    action_div.style.display = "none";
    let frametime = 0.04;
    if(inf_combat.GR == undefined) grass_init();
    if(inf_combat.GR.grass.size == undefined) grass_init();
    redraw_grass();
    grass_spawn_cooldown = 1.00;
    grass_cur_cooldown = 0.00;
    const GrassId = setInterval(() => {
        inf_combat.GR.eff_lvl = skills["GrassCutting"].current_level + ((character.equipment.sickle?.id == "死神之镰")?4:0);
        inf_combat.GR.radius = inf_combat.GR.eff_lvl * 1.5 + 15;
        grass_spawn_cooldown = 10.0 / (5 + inf_combat.GR.eff_lvl);
        inf_combat.GR.grass_cap = Math.floor((inf_combat.GR.eff_lvl + 1) ** 1.5 * 10);
        
        grass_cur_cooldown += frametime;
        if(grass_cur_cooldown > grass_spawn_cooldown){
            grass_cur_cooldown -= grass_spawn_cooldown;
            if(inf_combat.GR.grass.size < inf_combat.GR.grass_cap){
                let X_grass = Math.round(Math.random()*(384-2*GRASS_SIZE) + GRASS_SIZE);
                let Y_grass = Math.round(Math.random()*(320-2*GRASS_SIZE) + GRASS_SIZE);
                grass_add(X_grass,Y_grass);
            }
        }
        if (!grass_able) {
            action_div.style.display = "inherit";
            grass_div.style.display = "none";
            clearInterval(GrassId);
        }
        update_displayed_grass();
    },frametime * 1000);
}

function leave_grass()
{
    grass_able = false;
    
}
window.leave_grass = leave_grass;
//割草小游戏

const reactor_div = document.getElementById("reactor_div");
let reactor_able = true;
function reactor_init()
{
    inf_combat.RT = {};
    inf_combat.RT.B1=0;
    inf_combat.RT.A7=0;
    inf_combat.RT.LD=0;
    inf_combat.RT.ER=1;
    inf_combat.RT.temp=20;
    inf_combat.RT.power=0;//类似中子
    inf_combat.RT.rad = 0;//累积辐射
}
const B1_num = document.getElementById("B1_core_num");
const A7_num = document.getElementById("A7_core_num");
const LD_num = document.getElementById("LD_core_num");
const ER_num = document.getElementById("ER_core_num");
const B1_bar = document.getElementById("reactor_B1_bar_current");
const A7_bar = document.getElementById("reactor_A7_bar_current");
const LD_bar = document.getElementById("reactor_LD_bar_current");
const ER_bar = document.getElementById("reactor_ER_bar_current");
const temp_num = document.getElementById("temp_num");
const temp_bar = document.getElementById("temp_bar_current");
const rad_num = document.getElementById("rad_num");
const rad_quality = document.getElementById("rad_quality");
const rad_bar = document.getElementById("rad_bar_current");
const evolve = document.getElementById("reactor_evolve");
const B1_diff = document.getElementById("B1_core_diff");
const A7_diff = document.getElementById("A7_core_diff");
const temp_diff = document.getElementById("temp_diff");
const rad_diff = document.getElementById("rad_diff");
function update_displayed_reactor()
{
    if(inf_combat.RT == undefined) reactor_init();
    if(inf_combat.RT.rad == undefined) reactor_init();
    B1_num.innerText = format_number(inf_combat.RT.B1);
    A7_num.innerText = format_number(inf_combat.RT.A7);
    LD_num.innerText = format_number(inf_combat.RT.LD);
    ER_num.innerText = format_number(inf_combat.RT.ER);
    B1_bar.style.width = (Math.log10(Math.min(inf_combat.RT.B1,9999)+1)*25).toString() +"%";
    A7_bar.style.width = (Math.log10(Math.min(inf_combat.RT.A7,9999)+1)*25).toString() +"%";
    LD_bar.style.width = (Math.log10(Math.min(inf_combat.RT.LD,9999)+1)*25).toString() +"%";
    ER_bar.style.width = (Math.log10(Math.min(inf_combat.RT.ER,9999)+1)*25).toString() +"%";
    temp_num.innerText = format_number(inf_combat.RT.temp);
    rad_num.innerText = format_number(inf_combat.RT.rad);
    rad_quality.innerText = format_number(Math.log(inf_combat.RT.rad + 1) * 15 + 100);
    temp_bar.style.width = (100-inf_combat.RT.temp/100).toString() +"%";
    rad_bar.style.width = (100-Math.log(Math.min(inf_combat.RT.rad,1202604)+1)*100/14).toString() +"%";

    evolve.style.display = global_flags["is_evolve_studied"]?"inline-block":"none";

    let frametime = 0.03;
    B1_diff.innerText = "Consumption:" + format_number(Math.log10(inf_combat.RT.B1+1)*0.4*inf_combat.RT.power/8000) +"/s "+"Criticality:"+format_number(Math.log10(inf_combat.RT.B1+1)*40) + "%";
    A7_diff.innerText = "Consumption:" + format_number(Math.sqrt(inf_combat.RT.A7*inf_combat.RT.power)*0.4/20) + "/s";
    temp_diff.innerText = `(+${format_number(inf_combat.RT.power * 100 / inf_combat.RT.ER)}/s,-${format_number((inf_combat.RT.temp - ((inf_combat.RT.temp-20)*(1-(frametime/((100*inf_combat.RT.ER)**0.333)))+20))/frametime)}/s)`
    rad_diff.innerText = `(+${format_number(inf_combat.RT.power)}/s)`

    
}
function start_reactor_minigame()
{
    update_displayed_reactor()
    reactor_able = true;
    reactor_div.style.display ="inherit";
    action_div.style.display = "none";
    let frametime = 0.03;
    let power_d = 0;
    const ReactorId = setInterval(() => {
        power_d = inf_combat.RT.power;
        inf_combat.RT.power = 0;
        inf_combat.RT.rad += power_d * frametime;//辐照量+=中子通量
        //power不/frametime，而是裸数值。
        //计算增殖燃料：B1·能量核心
        if(inf_combat.RT.B1 > 1e-4)
        {
            inf_combat.RT.power += Math.log10(inf_combat.RT.B1+1)*0.4*power_d;
            inf_combat.RT.B1 -= Math.log10(inf_combat.RT.B1+1)*0.4*power_d*frametime / 8000;
            if(inf_combat.RT.B1 < 0) inf_combat.RT.B1 = 0;
        }//B1的热值是8000，根据储量决定线性系数
        //B1在316颗进入超临界。

        //计算普通燃料：A7·能量核心
        if(inf_combat.RT.A7 > 1e-4)
        {
            inf_combat.RT.power += Math.sqrt(inf_combat.RT.A7*power_d)*0.4;
            inf_combat.RT.A7 -= Math.sqrt(inf_combat.RT.A7*power_d)*0.4*frametime/20;
            if(inf_combat.RT.A7 < 0) inf_combat.RT.A7 = 0;
        }//A7的热值是20，稳态焚烧速度是每秒焚烧目前1/50的A7

        //计算中子源：雷电加护
        if(inf_combat.RT.LD > 1e-4)
        {
            inf_combat.RT.power += 0.001*inf_combat.RT.LD;
            inf_combat.RT.LD *= 1-0.001*frametime;
            if(inf_combat.RT.LD < 0) inf_combat.RT.LD = 0;
        }
        //雷电的热值只有1，以1/1000的速度释放中子

        inf_combat.RT.temp += inf_combat.RT.power * 100 * frametime / inf_combat.RT.ER;
        //灌满了凝胶，一管子温度也只能有100w辐照...
        inf_combat.RT.temp = (inf_combat.RT.temp-20)*(1-(frametime/((100*inf_combat.RT.ER)**0.333)))+20;
        //灌的越多冷却越慢。最多的时候需要100s来冷却到1/e.
        //即初始连续可容忍通量为100，最多凝胶为10000.

        if(inf_combat.RT.temp > 10000)
        {
            reactor_able = false;
            log_message("The reactor has melted down due to excessive temperature!!!","enemy_attacked_critically");
            active_effects["Radiation"] = new ActiveEffect({...effect_templates["Radiation"], duration:Math.round(100 * inf_combat.RT.ER ** 0.333)});
            update_displayed_effects();
            character.stats.add_active_effect_bonus();
            update_character_stats();
            reactor_init();
        }

        if (!reactor_able) {
            action_div.style.display = "inherit";
            reactor_div.style.display = "none";
            clearInterval(ReactorId);
        }
        update_displayed_reactor();
    },frametime * 1000)
        
}//反应堆小游戏

function reactor(item_id,count)
{
    if(inf_combat.RT == undefined) reactor_init();
    if(inf_combat.RT.power == undefined) reactor_init();
    let item_map = {1:"B1·能量核心",2:"A7·能量核心",3:"雷电加护",4:"高能凝胶"};
    //检查物品是否足够，扣除物品，如果不够就返回
    let key = "{\"id\":\""+item_map[item_id]+"\"}";
    if(character.inventory[key] != undefined)
    {
        if(character.inventory[key].count >= count)
        {
            remove_from_character_inventory([{ 
                item_key: key,           
                item_count: count,
            }]);
        }
        else return;
    }
    else return;
    let key_map = {1:"B1",2:"A7",3:"LD",4:"ER"};
    if(item_id==1) inf_combat.RT.B1 += count;
    if(item_id==2) inf_combat.RT.A7 += count;
    if(item_id==3) inf_combat.RT.LD += count;
    if(item_id==4){
        inf_combat.RT.ER += count;
        inf_combat.RT.temp -= (inf_combat.RT.temp - 20) * count / inf_combat.RT.ER;
        //外来凝胶-降温
    }
}

function engine(item_id,count){
    let item_map = {1:"冰原超流体",2:"多孔冰晶"};
    //检查物品是否足够，扣除物品，如果不够就返回
    let key = "{\"id\":\""+item_map[item_id]+"\"}";
    if(count==-2){
        count = inf_combat.FE.IM.num - 1;
        inf_combat.FE.IM.num = 1;
        log_message("Extracted Porous Ice Crystal x " + count,"combat_loot");
        add_to_character_inventory([{ "item": getItem(item_templates["多孔冰晶"] ), "count": count}]);
        return;
    }
    if(character.inventory[key] != undefined)
    {
        if(count==-1) count = character.inventory[key].count;
        if(character.inventory[key].count >= count)
        {
            remove_from_character_inventory([{ 
                item_key: key,           
                item_count: count,
            }]);
        }
        else return;
    }
    else return;
    if(item_id==1){
        inf_combat.FE.SF.num += count;
        inf_combat.FE.SF.temp += (inf_combat.FE.outer_temp - inf_combat.FE.SF.temp) * (count / inf_combat.FE.SF.num);
    }
    if(item_id==2) inf_combat.FE.IM.num += count;
}

function leave_reactor()
{
    reactor_able = false;
}
function extract_reactor()
{
    if(inf_combat.RT.ER < 10)
    {
        log_message("Insufficient gel inside the reactor","enemy_attacked_critically");
    }
    else{
        inf_combat.RT.ER *= 0.8;
        let RB_quality = Math.round(Math.log(inf_combat.RT.rad + 1) * 15 + 100);
        inf_combat.RT.rad = 0;
        let result =  new WeaponComponent({...item_templates["凝胶剑柄"], quality: RB_quality});
        log_message("Obtained Gel Sword Handle (Quality " + RB_quality + " )","combat_loot");
        add_to_character_inventory([{item: result}]);
        //获取一个凝胶剑柄
        //getresult的结果
    }
}
function extract_evolve()
{
    if(inf_combat.RT.rad < 1000000) log_message("Insufficient primal energy inside the reactor","enemy_attacked_critically");
    else{
        // inf_combat.RT.ER *= 0.01;
        // inf_combat.RT.ER = Math.max(inf_combat.RT.ER,1);
        inf_combat.RT.power = 0;
        inf_combat.RT.rad -= 1000000;
        log_message("Obtained Basic Evolution Crystal (reactor radiation cleared)","combat_loot");
        add_to_character_inventory([{ "item": getItem(item_templates["初等进化结晶"])}]);
    }
}

window.reactor =  reactor;
window.leave_reactor =  leave_reactor;
window.extract_reactor =  extract_reactor;
window.extract_evolve =  extract_evolve;
window.engine = engine;

//极寒引擎minigame！
let engine_able = true;

function engine_init()
{
    inf_combat.FE = {};//FreezingEngine,更准确的名称是[极寒二阶相变引擎]/FreezingSecondOrderPhaseTransformationEngine
    inf_combat.FE.IA = {};//IcelandAir
    inf_combat.FE.SF = {};//SuperFuild
    inf_combat.FE.IM = {};//IsolationMaterial
    inf_combat.FE.FR = {};
    //为了避免进一步的麻烦，以下内容将尽可能遵守【SI纯粹主义】
    inf_combat.FE.power = 0;//喵可做功速度(W)
    inf_combat.FE.outer_temp = 240;
    inf_combat.FE.fruit = -1;//-1代表未放入，反之代表玄冰果实中积累的冰元素
    inf_combat.FE.piston = 1;//0:隔热袋内，1:环境中。默认在1.
    inf_combat.FE.piston_mode = 0;
    inf_combat.FE.IA.num = 150000000;//物质的量(mol)
    inf_combat.FE.IA.volume = 30.000;//体积(m^3),也作为活塞推入百分比依据
    inf_combat.FE.IA.temp = 240.0;//温度(K)
    inf_combat.FE.IA.pressure = 9977.4e6;//压强(Pa)，作为导出单位
    inf_combat.FE.SF.num = 25;//加入的25单位超流体，每个单位是1m^3
    inf_combat.FE.SF.ice = 0;//冰元素积累量
    inf_combat.FE.SF.temp = 240.0;//同样是温度
    inf_combat.FE.SF.surface = 41.347;//按m^2计的表面积
    inf_combat.FE.IM.num = 15;//加入的15单位多孔冰晶 每10单位为1m^3
    inf_combat.FE.IM.thickness = 0.0356;//冰晶厚度[M]
    engine_able = true;
}
const engine_div = document.getElementById("engine_div");
const sas_div = document.getElementById("skills_and_stances_div");
const lr_div = document.getElementById("location_related_div");
const piston_div = document.getElementById("engine_piston");
const piston_mode = document.getElementById("piston_mode");
const piston_temp = document.getElementById("piston_temp");
const piston_pressure = document.getElementById("piston_pressure");
const piston_volume = document.getElementById("piston_volume");
const neko_power = document.getElementById("neko_power");
const piston_pt2 = document.getElementById("piston_pt2");
const container_circle = document.getElementById("container_circle");
const container_square = document.getElementById("container_square");
const container_sf = document.getElementById("container_sf");
const container_sf_S = document.getElementById("container_sf_S");
const container_temp = document.getElementById("container_temp");
const container_temp_change = document.getElementById("container_temp_change");
const container_isolate = document.getElementById("container_isolate");
const container_isolate_thickness = document.getElementById("container_isolate_thickness");
const container_element = document.getElementById("container_element");
const container_element_max = document.getElementById("container_element_max");
const container_element_speed = document.getElementById("container_element_speed");
const container_element_time = document.getElementById("container_element_time");
const container_element_bar = document.getElementById("engine_element_bar_current");
const engine_result_name = document.getElementById("engine_result_name");
const engine_result_fruit_status = document.getElementById("engine_result_fruit_status");
const engine_result_temp = document.getElementById("engine_result_temp");
const engine_env1 = document.getElementById("engine_env1");
const engine_env2 = document.getElementById("engine_env2");



function update_displayed_engine(){
    engine_result_name.innerText = (inf_combat.FE.SF.num * 999.999 - inf_combat.FE.SF.ice < 0)?"万载冰髓锭":"冰原超流体";
    engine_result_fruit_status.innerText = (inf_combat.FE.fruit == -1)?"Not Inserted":`Awakened ${(inf_combat.FE.fruit / 1e4).toFixed(4)}%`
    engine_result_temp.innerText = (inf_combat.FE.outer_temp.toFixed(0)) + 'K / '+ ((inf_combat.FE.outer_temp/240)**2*12).toFixed(2) + 'MPa';
    engine_env1.style.display = (character.equipment.realm?.id == "焰海霜天[领域二重]" || character.equipment.realm?.id == "焰海霜天[领域三重]")?"inline-block":"none";
    engine_env2.style.display = (character.equipment.realm?.id == "焰海霜天[领域二重]" || character.equipment.realm?.id == "焰海霜天[领域三重]")?"inline-block":"none";


    piston_div.style.left = Math.round(120 * (1+Math.cos(3.1415927*(1+inf_combat.FE.piston))) + 64) + 'px';
    let modemap = {0:"Idling",1:"Compressing Gas",2:"Gas Free Expansion",3:"Inflating Gas",4:"Releasing Gas"};
    piston_mode.innerText = modemap[inf_combat.FE.piston_mode];
    piston_temp.innerText = inf_combat.FE.IA.temp.toFixed(2);
    let pres = inf_combat.FE.IA.pressure;
    if(pres <= 1e9) piston_pressure.innerText = (pres/1e3).toFixed(0) + ' kPa';
    else if(pres <= 1e12) piston_pressure.innerText = (pres/1e6).toFixed(0) + ' MPa';
    else if(pres <= 1e15) piston_pressure.innerText = (pres/1e9).toFixed(0) + ' GPa';
    else if(pres <= 1e18) piston_pressure.innerText = (pres/1e12).toFixed(0) + ' TPa';
    else piston_pressure.innerText = (pres/1e17).toFixed(2) + ' TBar';
    //动态单位:1GPa以下kPa,……1000000TPa以下TPa，以上TBar。
    piston_volume.innerText = inf_combat.FE.IA.volume.toFixed(3);
    neko_power.innerText = (character.stats.full.attack_power ** 1.5 / 1e9).toFixed(1);
    piston_pt2.style.left = Math.round(10 + 100 * (inf_combat.FE.IA.volume / 30)) + 'px';
    container_square.style.width = Math.round(100 * (inf_combat.FE.IA.volume / 30)) + 'px';

    let transparenty = Math.log10(inf_combat.FE.IA.num / inf_combat.FE.IA.volume / 1e4) / 6;
    transparenty = Math.min(1,Math.max(0,transparenty));
    //1e10mol/m^3时完全不透明，1e4mol/m^3时完全透明。
    //我知道后者已经是液体而前者是简并物质，但游戏性需要。
    let temp_index = inf_combat.FE.IA.temp ** 0.5 / 15.4919;
    temp_index = Math.min(temp_index,3);
    if(temp_index <= 1) container_square.style.backgroundColor = `rgb(${Math.round(255*temp_index)},255,255,${transparenty.toFixed(3)})`;
    else container_square.style.backgroundColor = `rgb(255,${Math.round(Math.max(255*(4-temp_index)/2,0))},${Math.round(Math.max(255*(2-temp_index),0))},${transparenty.toFixed(3)})`;
    //气体颜色：
    //0K纯青色，240K纯白色，960K纯黄色，2240K纯橙色。
    //不符合黑体辐射，但是符合对温度的直观感受
    temp_index = inf_combat.FE.SF.temp ** 0.5 / 15.4919;
    temp_index = Math.min(temp_index,3);
    if(temp_index <= 1) container_circle.style.backgroundColor = `rgb(${Math.round(255*temp_index)},255,255,1.0)`;
    else container_circle.style.backgroundColor = `rgb(255,${Math.round(Math.max(255*(4-temp_index)/2,0))},${Math.round(Math.max(255*(2-temp_index),0))},1.0)`;
    //对于球


    container_sf.innerText = inf_combat.FE.SF.num;
    container_sf_S.innerText = inf_combat.FE.SF.surface.toFixed(2);
    container_temp.innerText = inf_combat.FE.SF.temp.toFixed(1);
    container_isolate.innerText = inf_combat.FE.IM.num;
    container_isolate_thickness.innerText = inf_combat.FE.IM.thickness.toFixed(4);
    container_element.innerText = format_number(inf_combat.FE.SF.ice);
    container_element_max.innerText = format_number(inf_combat.FE.SF.num * 1000);
    container_element_bar.style.width = Math.min(inf_combat.FE.SF.ice / (inf_combat.FE.SF.num * 10),100).toFixed(1)  + "%" ;
    let outer_temp = inf_combat.FE.outer_temp;//调整外界温度
    let SF_heat = (outer_temp - inf_combat.FE.SF.temp) * inf_combat.FE.SF.surface / inf_combat.FE.SF.num / inf_combat.FE.IM.thickness * 0.001;
    if(inf_combat.FE.piston == 0) SF_heat += 0.5 * (inf_combat.FE.IA.temp - inf_combat.FE.SF.temp) * ((inf_combat.FE.IA.num * inf_combat.FE.SF.num * 1e7)/(inf_combat.FE.IA.num + inf_combat.FE.SF.num * 1e7)) / (inf_combat.FE.SF.num * 1e7);
    container_temp_change.innerText = SF_heat.toFixed(2);
    let ice_speed = inf_combat.FE.SF.surface * 3.4764e-14 * Math.exp(2623.17 / inf_combat.FE.SF.temp);
    container_element_speed.innerText = ice_speed.toFixed(2);
    let ice_time = (inf_combat.FE.SF.num * 1000 - inf_combat.FE.SF.ice) / ice_speed;
    ice_time = Math.max(ice_time,0);
    if(ice_time <= 60) container_element_time.innerText = ice_time.toFixed(1) + ' sec';
    else if(ice_time <= 3600) container_element_time.innerText = (ice_time/60).toFixed(1) + ' min';
    else if(ice_time <= 86400) container_element_time.innerText = (ice_time/3600).toFixed(2) + ' hr';
    else if(ice_time <= 31557020) container_element_time.innerText = (ice_time/86400).toFixed(2) + ' days';
    else container_element_time.innerText = (ice_time/31557020).toFixed(2) + ' yrs';
}

function start_engine_minigame()
{
    //设定1：冰原的外界气压为1.2 MPa！
    if(inf_combat.FE == undefined) engine_init();
    if(inf_combat.FE.SF.temp != inf_combat.FE.SF.temp ||inf_combat.FE.IA.temp != inf_combat.FE.IA.temp) engine_init();
    update_displayed_engine()
    engine_able = true;
    engine_div.style.display ="inherit";
    sas_div.style.display = "none";
    lr_div.style.display = "none";
    let frametime = 0.005;
    let dP,dV,dN,dT,P_index;
    let cnt=0;
    let outer_temp = inf_combat.FE.outer_temp;
    let outer_pressure = 12e6;
    const EngineId = setInterval(() => {
        outer_temp = inf_combat.FE.outer_temp;//调整外界温度
        outer_pressure = ((inf_combat.FE.outer_temp/240)**2*12e6);
        inf_combat.FE.IA.pressure = inf_combat.FE.IA.num * inf_combat.FE.IA.temp * 8.3144626 / inf_combat.FE.IA.volume;
        // nRT / V
        if(inf_combat.FE.IA.pressure <= outer_pressure)
        {
            inf_combat.FE.IA.num = outer_pressure * inf_combat.FE.IA.volume /  inf_combat.FE.IA.temp / 8.3144626;
            inf_combat.FE.IA.pressure = inf_combat.FE.IA.num * inf_combat.FE.IA.temp * 8.3144626 / inf_combat.FE.IA.volume;
        }//内压小于外压就内压=外压！高压锅！
        if(inf_combat.FE.piston_mode == 1){
            dP = inf_combat.FE.IA.pressure - outer_pressure;
            dV = (character.stats.full.attack_power ** 1.5) / dP * frametime * 3/5;
            if(dV >= frametime * inf_combat.FE.IA.volume) dV = frametime * inf_combat.FE.IA.volume;
            if(inf_combat.FE.IA.volume - dV < 0.3){
                dV = inf_combat.FE.IA.volume - 0.3;
            }//设定：极限压缩是0.01m^3.
            if(dV < 1e-8){
                inf_combat.FE.piston_mode = 0;//已经压缩到极限了，结束压缩
                dV = 0;
            }
            dT = inf_combat.FE.IA.temp * ( 2/3 ) * dV / inf_combat.FE.IA.volume;

            inf_combat.FE.IA.temp += dT;
            inf_combat.FE.IA.volume -= dV;
        }//压缩气体
        if(inf_combat.FE.piston_mode == 2){
            P_index = (inf_combat.FE.IA.pressure - 1.2) / (inf_combat.FE.IA.pressure);//膨胀系数
            dV = inf_combat.FE.IA.volume * frametime * P_index;
            if(dV + inf_combat.FE.IA.volume >= 30) dV = 30 - inf_combat.FE.IA.volume;
            if(dV < 1e-8){
                inf_combat.FE.piston_mode = 0;//已经膨胀到极限了，结束膨胀
                dV = 0;
            }
            dT = inf_combat.FE.IA.temp * ( 2/3 ) * dV / inf_combat.FE.IA.volume;
            
            inf_combat.FE.IA.temp -= dT;
            inf_combat.FE.IA.volume += dV;
        }//膨胀气体
        if(inf_combat.FE.piston_mode == 3){
            //Pdt/(RT1(25/6(p2/p1)^0.4-2.5))
            dN = (character.stats.full.attack_power ** 1.5) * frametime / (8.3144626 * outer_temp * (25/6 * (inf_combat.FE.IA.pressure / outer_pressure) ** 0.4 - 2.5))  ;
            if(dN >= frametime * inf_combat.FE.IA.num) dN = frametime * inf_combat.FE.IA.num;
            dT = (dN / inf_combat.FE.IA.num ) * (5/3*outer_temp*(inf_combat.FE.IA.pressure / outer_pressure) ** 0.4  -  inf_combat.FE.IA.temp);
            if(dN<1e-8){
                dN = 0;
                inf_combat.FE.piston_mode = 0;//已经膨胀到极限了，结束膨胀
            }

            inf_combat.FE.IA.num += dN;
            inf_combat.FE.IA.temp += dT;
            inf_combat.FE.IA.temp = (inf_combat.FE.IA.temp * inf_combat.FE.IA.num + outer_temp * dN) / (dN + inf_combat.FE.IA.num);
            //+混合冷却
        }
        if(inf_combat.FE.piston_mode == 4){
            P_index = (inf_combat.FE.IA.pressure - outer_pressure) / (inf_combat.FE.IA.pressure);//散逸
            dN = inf_combat.FE.IA.num * frametime * P_index;
            inf_combat.FE.IA.num -= dN;
        }
        //设定2：膨胀，压缩速度不能超过每秒1倍自然对数
        //设定3：冰原空气是单原子气体，绝热系数5/3

        if(inf_combat.FE.piston == 1){
            let dT = frametime * 0.1 * (inf_combat.FE.IA.temp - outer_temp);
            //热传导(低温主导)
            inf_combat.FE.IA.temp -= dT;
        }
        else if(inf_combat.FE.piston == 0){
            let heat_changed = frametime * 0.5 * (inf_combat.FE.IA.temp - inf_combat.FE.SF.temp) * ((inf_combat.FE.IA.num * inf_combat.FE.SF.num * 1e7)/(inf_combat.FE.IA.num + inf_combat.FE.SF.num * 1e7))
            //使用约化质量 1份超流体视为10M mol冰原空气
            //空气温度>流体温度时heat_changed为正
            inf_combat.FE.IA.temp -= heat_changed / inf_combat.FE.IA.num;
            inf_combat.FE.SF.temp += heat_changed / (inf_combat.FE.SF.num * 1e7);
            //与隔热袋换热
        }
        //V=4pi/3 r^3,S=4pir^2,所以S=(6pi^0.5V)^2/3
        inf_combat.FE.SF.surface = 4.835975862 * (inf_combat.FE.SF.num ** (2/3));
        inf_combat.FE.IM.thickness = (0.2387324 * (inf_combat.FE.IM.num * 0.1 + inf_combat.FE.SF.num)) ** (1/3) - (0.2387324 * (inf_combat.FE.SF.num)) ** (1/3);
        //两球体积之差即为厚度

        inf_combat.FE.SF.temp += (outer_temp - inf_combat.FE.SF.temp) * inf_combat.FE.SF.surface / inf_combat.FE.SF.num / inf_combat.FE.IM.thickness * 0.001 * frametime;
        //隔热袋与外界换热 开局条件下是0.05倍/s

        inf_combat.FE.SF.ice += frametime * inf_combat.FE.SF.surface * 3.4764e-14 * Math.exp(2623.17 / inf_combat.FE.SF.temp);

        if(inf_combat.FE.SF.ice >= inf_combat.FE.SF.num * 1000) inf_combat.FE.SF.ice = 1000 * inf_combat.FE.SF.num;

        if(inf_combat.FE.fruit != -1 && inf_combat.FE.fruit < 1000000){
            let dI = inf_combat.FE.SF.ice * frametime;
            if(inf_combat.FE.fruit + dI > 1000000) dI = 1000000 - inf_combat.FE.fruit;
            inf_combat.FE.fruit += dI;
            inf_combat.FE.SF.ice -= dI;
        }
        
        if (!engine_able) {
            lr_div.style.display = "block";
            sas_div.style.display = "block";
            engine_div.style.display = "none";
            clearInterval(EngineId);
        }
        cnt++;
        if(cnt%5==0) update_displayed_engine();
    },frametime * 1000);

}
let piston_changing = 0;
function changePistonStatus(){
    if(piston_changing != 0) return;
    let frametime = 0.025;
    piston_changing = 1 - inf_combat.FE.piston * 2;
    const PistonId = setInterval(() => {
        inf_combat.FE.piston += piston_changing * frametime;
        if(inf_combat.FE.piston <= 0){
            inf_combat.FE.piston = 0;
            piston_changing = 0;
            clearInterval(PistonId);
        } 
        else if(inf_combat.FE.piston >= 1){
            inf_combat.FE.piston = 1;
            piston_changing = 0;
            clearInterval(PistonId);
        }
    },frametime * 1000);
}
function changePistonMode(mode){
    if(inf_combat.FE.piston_mode != mode)
        inf_combat.FE.piston_mode = mode;
    else
        inf_combat.FE.piston_mode = 0;
}

function engine_r(item_id,count){
    let r_id = (inf_combat.FE.SF.num * 999.999 - inf_combat.FE.SF.ice < 0)?"万载冰髓锭":"冰原超流体";
    let key = "{\"id\":\""+r_id+"\"}";
    if(count == -1 && inf_combat.FE.SF.num > 1){
        count = inf_combat.FE.SF.num - 1;
    }
    else if(count > inf_combat.FE.SF.num - 1) return;
    inf_combat.FE.SF.ice *= (inf_combat.FE.SF.num - count) / inf_combat.FE.SF.num;
    inf_combat.FE.SF.num -= count;
    log_message(`Extracted ${r_id} x ${count}!`,"combat_loot");

    add_to_character_inventory([{ "item": getItem(item_templates[r_id]), "count": count}]);
    update_displayed_character_inventory();

}
function engine_f(oper){
    if(oper==1 && inf_combat.FE.fruit == -1){
        let fr_key = "{\"id\":\""+"玄冰果实"+"\"}";//应为玄冰果实
        if(character.inventory[fr_key] != undefined){
            remove_from_character_inventory([{ 
                item_key: fr_key,           
                item_count: 1,
            }]);
            inf_combat.FE.fruit = 0;
            log_message(`Mystic Ice Fruit has started absorbing Ice Element!`,"enemy_defeated");
        }
        //拿走玄冰果实
    }
    if(oper==2 && inf_combat.FE.fruit != -1){
        //根据是否抵达1e6判定取出什么
        let q_id = inf_combat.FE.fruit > 999900 ? "玄冰果实·觉醒" : "玄冰果实" ;
        log_message(`Extracted ${q_id}!`,"combat_loot");

        add_to_character_inventory([{ "item": getItem(item_templates[q_id]), "count": 1}]);
        update_displayed_character_inventory();
        inf_combat.FE.fruit = -1;
    }
}
function engine_e(e_temp){
    if(e_temp != -1) inf_combat.FE.outer_temp = e_temp;
    else{
        
            if(character.equipment.special?.id == "飞船之心")
            {
                character.equipment.special = null;
                add_to_character_inventory([{item: item_templates["飞船之心·材"], count: 1}]);
                update_displayed_equipment(); 
                character.stats.add_all_equipment_bonus();
                update_displayed_stats();
                log_message("Your [Starship Heart] has been converted to [Starship Heart · Material],","combat_loot");
                log_message("and can continue to be upgraded to [Arctic Heart].","combat_loot");
            }
            else log_message("Please equip [Starship Heart] and try again!","combat_looot");
            //借用代码……
    }
}
function engine_l(){
    engine_able = false;
}

window.changePistonStatus = changePistonStatus;
window.changePistonMode = changePistonMode;
window.engine_r = engine_r;
window.engine_f = engine_f;
window.engine_e = engine_e;
window.engine_l = engine_l;


function GetSaveRewards() {
    let time = (new Date()).valueOf();
    inf_combat.ST = inf_combat.ST || 0;
    if(time - inf_combat.ST >= 3.6e6)//1h
    {
        //获取灵感
        active_effects["灵感"] = new ActiveEffect({...effect_templates["灵感"], duration:900});
        character.stats.add_active_effect_bonus();
        update_character_stats();
        update_displayed_effect_durations();
        update_displayed_effects();
        inf_combat.ST = time;
    }


}
window.GetSaveRewards = GetSaveRewards;

function update() {
    setTimeout(function()
    {
        end_date = Date.now(); 
        //basically when previous tick ends

        time_variance_accumulator += ((end_date - start_date) - 1000/tickrate);
        //duration of previous tick, minus time it was supposed to take
        //important to keep it between setting end_date and start_date, so they are 2 completely separate values

        start_date = Date.now();
        /*
        basically when current tick starts
        so before this assignment, start_date is when previous tick started
        and end_date is when previous_tick ended
        */

        const prev_day = current_game_time.day;
        update_timer();

        const curr_day = current_game_time.day;
        if(curr_day > prev_day) {
            recoverItemPrices();
            update_displayed_character_inventory();
        }

        if("parent_location" in current_location){ //if it's a combat_zone
            //nothing here i guess?
        } else { //everything other than combat
            if(is_sleeping) {
                do_sleeping();
                add_xp_to_skill({skill: skills["Sleeping"], xp_to_add: current_location.sleeping?.xp});
                if(current_location.sleeping?.xp >= 10){
                    add_xp_to_character(Math.pow(current_location.sleeping?.xp,2),false);
                }
            }
            else {
                if(is_resting) {
                    do_resting();
                }
                if(is_reading) {
                    do_reading();
                }
            } 

            if(selected_stance !== current_stance) {
                change_stance(selected_stance);
            }

            if(current_activity) { //in activity

                //add xp to all related skills
                if(activities[current_activity.activity_name].type !== "GATHERING"){
                    for(let i = 0; i < activities[current_activity.activity_name].base_skills_names?.length; i++) {
                        add_xp_to_skill({skill: skills[activities[current_activity.activity_name].base_skills_names[i]], xp_to_add: current_activity.skill_xp_per_tick});
                    }
                }

                current_activity.gathering_time += 1;
                if(current_activity.gained_resources)
                {
                    if(current_activity.gathering_time >= current_activity.gathering_time_needed) { 
                        
                        if(current_activity.exp_scaling)
                        {
                            current_activity.done_actions += 1;
                            character.C_scaling[current_activity.scaling_id] = current_activity.done_actions;
                            activities[current_activity.activity_name].done_actions += 1;
                        }
                        const {gathering_time_needed, gained_resources} = current_activity.getActivityEfficiency();
                        current_activity.gathering_time_needed = gathering_time_needed;

                        const items = [];
                        if(current_activity.activity_name == "fishing")
                        {
                            if(current_activity.skill_xp_per_tick == 1) start_fishing_minigame();
                            else start_fishing_minigame_changed();
                            //把鱼丢到物品栏里
                            //log_loot
                        }
                        else
                        {

                            for(let i = 0; i < gained_resources.length; i++) {
                                if(Math.random() > (1-gained_resources[i].chance)) {
                                    const count = Math.floor(Math.random()*(gained_resources[i].count[1]-gained_resources[i].count[0]+1))+gained_resources[i].count[0];
                                    items.push({item: item_templates[gained_resources[i].name], count: count});
                                }
                            }
                        }//常规loot

                        if(items.length > 0) {
                            
                            log_loot(items, false);
                            add_to_character_inventory(items);
                        }

                        let leveled = false;
                        if(activities[current_activity.activity_name].type === "GATHERING"){
                            for(let i = 0; i < activities[current_activity.activity_name].base_skills_names?.length; i++) {
                                leveled = add_xp_to_skill({skill: skills[activities[current_activity.activity_name].base_skills_names[i]], xp_to_add: current_activity.skill_xp_per_tick}) || leveled;
                            }
                            
                            //if(leveled) {
                                update_gathering_tooltip(current_activity);
                            //}
                        }

                        current_activity.gathering_time = 0;
                    }
                }

                //if job: payment
                if(activities[current_activity.activity_name].type === "JOB") {
                    current_activity.working_time += 1;

                    if(current_activity.working_time % current_activity.working_period == 0) { 
                        //finished working period, add money
                        current_activity.earnings += current_activity.get_payment();
                    }
                    update_displayed_ongoing_activity(current_activity, true);
                    
                    if(!can_work(current_activity)) {
                        end_activity();
                    }
                } else {
                    update_displayed_ongoing_activity(current_activity, false);
                }

                //if gathering: add drops to inventory

            } else {
                const divs = document.getElementsByClassName("activity_div");
                for(let i = 0; i < divs.length; i++) {
                    const activity = current_location.activities[divs[i].getAttribute("data-activity")];

                    if(activities[activity.activity_name].type === "JOB") {
                        if(can_work(activity)) {
                            divs[i].classList.remove("activity_unavailable");
                            divs[i].classList.add("start_activity");
                        } else {
                            divs[i].classList.remove("start_activity");
                            divs[i].classList.add("activity_unavailable");
                        }
                        
                    }
                }
            }

            const sounds = current_location.getBackgroundNoises();
            if(sounds.length > 0){
                if(Math.random() < 1/600) {
                    log_message(`"${sounds[Math.floor(Math.random()*sounds.length)]}"`, "background");
                }
            }
        }

        Object.keys(active_effects).forEach(key => {
            active_effects[key].duration--;
            if(active_effects[key].duration <= 0) {
                delete active_effects[key];
                character.stats.add_active_effect_bonus();
                update_character_stats();
            }
        });
        update_displayed_effect_durations();
        update_displayed_effects();
        //health regen
        if(character.stats.full.health_regeneration_flat) {
            character.stats.full.health += character.stats.full.health_regeneration_flat;
        }
        if(character.stats.full.health_regeneration_percent) {
            character.stats.full.health += character.stats.full.max_health * character.stats.full.health_regeneration_percent/100;
        }
        if(character.stats.full.health > character.stats.full.max_health) {
            character.stats.full.health = character.stats.full.max_health
        }
        
        if(character.stats.full.health <= 0) faint(" collapsed from excessive blood loss");


        if(character.stats.full.health_regeneration_flat || character.stats.full.health_regeneration_percent) {
            update_displayed_health();
        }
        
        save_counter += 1;
        if(save_counter >= save_period*tickrate) {
            save_counter = 0;
            if(is_on_dev()) {
                save_to_localStorage({key: dev_save_key});
            } else {
                save_to_localStorage({key: save_key});
            }
            console.log("Auto-saved the game!");
        } //save in regular intervals, irl time independent from tickrate

        backup_counter += 1;
        if(backup_counter >= backup_period*tickrate) {
            backup_counter = 0;
            let saved_at;
            if(is_on_dev()) {
                saved_at = save_to_localStorage({key: dev_backup_key});
            } else {
                saved_at = save_to_localStorage({key: backup_key});
            }

            if(saved_at) {
                update_backup_load_button(saved_at);
            }
            console.log("Created an automatic backup!");
        }

        if(!is_sleeping && current_location && current_location.light_level === "normal" && (current_game_time.hour >= 150 || current_game_time.hour <= 30)) 
        {
            add_xp_to_skill({skill: skills["Night vision"], xp_to_add: 1});
        }

        //add xp to proper skills based on location types
        if(current_location) {
            const skills = current_location.gained_skills;
            let leveled = false;
            for(let i = 0; i < skills?.length; i++) {
                leveled = add_xp_to_skill({skill: current_location.gained_skills[i].skill, xp_to_add: current_location.gained_skills[i].xp}) || leveled;
            }
            if(leveled){
                update_displayed_location_types(current_location);
            }
        }

        //limiting maximum adjustment, to avoid any absurd results;
        if(time_variance_accumulator <= 100/tickrate && time_variance_accumulator >= -100/tickrate) {
            time_adjustment = time_variance_accumulator;
        }
        else {
            if(time_variance_accumulator > 100/tickrate) {
                time_adjustment = 100/tickrate;
            }
            else {
                if(time_variance_accumulator < -100/tickrate) {
                    time_adjustment = -100/tickrate;
                }
            }
        }

        total_playtime += 1/tickrate;
        update();
    }, 1000/tickrate - time_adjustment);
    //uses time_adjustment based on time_variance_accumulator for more precise overall stabilization
    //(instead of only stabilizing relative to previous tick, it stabilizes relative to sum of deviations)
    //probably completely unnecessary lol, but hey, it sounds cool
}

function run() {
    if(typeof current_location === "undefined") {
        change_location("纳家大厅");
    } 
    
    update_displayed_health();
        
    start_date = Date.now();
    update();   
}

function update_quests(){
    const quests = document.getElementById("quest_list");
    if(character.xp.current_level < 9){
        quests.innerHTML = "<span class='realm_terra'>Earth Rank Stage 1</span> unlocks Mind Realm - 1st Layer!"
    }
    else{
        let R=255,G=255,B=255;
        inf_combat.VP = inf_combat.VP || {num:0};
        inf_combat.MP = inf_combat.MP || 0;
        let lgVP = Math.log10(inf_combat.VP.num+1);
        //lgVP = 3;
        if(lgVP <= 10){
            R = B = Math.round(255-lgVP*25.5)
        }
        else if(lgVP <= 20){
            R = Math.round((lgVP - 10) * 12.75);
            G = Math.round((20 - lgVP ) * 12.75 + 127.5);
            B = Math.round((lgVP - 10) * 25.5);
        }
        let s_color = `<span style="color:rgb(${R},${G},${B})">`


        quests.innerHTML = `<b>${s_color}Gem Devourer</span> </b> - Devour gems, grants global skill XP bonus<br>`;
        
        quests.innerHTML += "<div id = 'gem_consumer' class = 'gem_consume_button' onclick='gem_consume()'>Devour all gems in inventory</div>"
        quests.innerHTML += `Current devoured value points:${s_color}${format_number(inf_combat.VP.num)}</span> <br>(Bonus:${s_color}${format_number(Math.pow(inf_combat.VP.num+1,0.07)*100-100)}%</span>)<br><br><br><br>`;
        if(character.xp.current_level < 19){
            quests.innerHTML += "<span class='realm_sky'>Sky Rank Stage 1</span> unlocks Mind Realm - 2nd Layer!"
        }
        else{
            quests.innerHTML += `<b><span style="color:cyan">God of Greed</span> </b> - Sacrifice money, grants global luck bonus<br>`;
            quests.innerHTML += "<div id = 'coin_consumer' class = 'coin_consume_button' onclick='coin_consume()'>Sacrifice all Treasure Coins and above from inventory</div>"
            quests.innerHTML += `Current sacrificed amount:<span style="color:cyan">${format_money(inf_combat.MP*1e12)}</span> <br>(Bonus:<span style="color:cyan">${(format_number((Math.pow(inf_combat.MP+1,0.10)-1)*100))}%</span>)<br><br><br><br>`;
            //WIP: needs to also consume Cosmic Coins
            //心境二重
            if(character.xp.current_level < 28){
                quests.innerHTML += "<span class='realm_cloudy'>Cloud Sky Rank Stage 1</span> unlocks Mind Realm - 3rd Layer!"
            }
            else{

            }
        }
    }
}

function gem_consume(){
    inf_combat.VP = inf_combat.VP || {num:0};
    Object.keys(character.inventory).forEach(key =>{
        if(character.inventory[key].item.gem_value != 0)
        {
            inf_combat.VP.num += Math.pow(character.inventory[key].item.gem_value,2) * character.inventory[key].count / 10000;
            remove_from_character_inventory([{ 
                item_key: key,           
                item_count: character.inventory[key].count,
            }
        ]);
        }
    });
    update_quests();
    update_displayed_character_inventory();
    character.stats.add_gem_bonus();
    update_character_stats();
}

function coin_consume(){
    inf_combat.MP = inf_combat.MP || 0;
    Object.keys(character.inventory).forEach(key =>{
        if(character.inventory[key].item.id == "紫色刀币" || character.inventory[key].item.id?.includes("宇宙币"))
        {
            inf_combat.MP += character.inventory[key].count * character.inventory[key].item.value / 1e12;
            remove_from_character_inventory([{ 
                item_key: key,           
                item_count: character.inventory[key].count,
            }
        ]);
        }
    });//吃宇宙币，宝钱
    update_quests();
    update_displayed_character_inventory();
    character.stats.add_gem_bonus();
    update_character_stats();
}

function get_money(coin_type,coin_num)
{
    let value = 1000**coin_type * coin_num;
    if(character.money < value)
    {
        log_message(`Insufficient funds! (${format_money(character.money)} / ${format_money(value)})`,"activity_money");
    }
    else
    {
        log_message(`Wallet: ${format_money(character.money)} -> ${format_money(character.money - value)} `,"activity_money");
        character.money -= value;
        let coin_map = {1:"红色刀币",2:"黑色刀币",3:"绿色刀币",4:"紫色刀币",5:"宇宙币",6:"宇宙币堆"}
        let coin = coin_map[coin_type];
        log_message(`Obtained ${item_templates[coin].getName()} x ${coin_num}!`,"combat_loot");
        add_to_character_inventory([{ "item": getItem(item_templates[coin]), "count": coin_num }]);
        update_displayed_character_inventory();
        update_displayed_money();
    }
}


window.gem_consume = gem_consume;
window.coin_consume = coin_consume;
window.get_money = get_money;

window.equip_item = character_equip_item;
window.unequip_item = character_unequip_item;

window.change_location = change_location;
window.reload_normal_location = reload_normal_location;

window.start_dialogue = start_dialogue;
window.end_dialogue = end_dialogue;
window.start_textline = start_textline;

window.update_displayed_location_choices = update_displayed_location_choices;

window.start_activity = start_activity;
window.end_activity = end_activity;

window.start_sleeping = start_sleeping;
window.end_sleeping = end_sleeping;

window.start_reading = start_reading;
window.end_reading = end_reading;

window.start_trade = start_trade;
window.exit_trade = exit_trade;
window.add_to_buying_list = add_to_buying_list;
window.remove_from_buying_list = remove_from_buying_list;
window.add_to_selling_list = add_to_selling_list;
window.remove_from_selling_list = remove_from_selling_list;
window.cancel_trade = cancel_trade;
window.accept_trade = accept_trade;
window.is_in_trade = is_in_trade;

window.format_money = format_money;
window.get_character_money = character.get_character_money;

window.use_item = use_item;
window.use_item_max = use_item_max;

window.do_enemy_combat_action = do_enemy_combat_action;

window.sort_displayed_inventory = sort_displayed_inventory;
window.update_displayed_character_inventory = update_displayed_character_inventory;
window.update_displayed_trader_inventory = update_displayed_trader_inventory;

window.sort_displayed_skills = sort_displayed_skills;

window.change_stance = change_stance;
window.fav_stance = fav_stance;

window.openCraftingWindow = open_crafting_window;
window.closeCraftingWindow = close_crafting_window;
window.switchCraftingRecipesPage = switch_crafting_recipes_page;
window.switchCraftingRecipesSubpage = switch_crafting_recipes_subpage;
window.useRecipe = use_recipe;
window.useRecipemax = use_recipe_max;
window.updateDisplayedComponentChoice = update_displayed_component_choice;
window.updateDisplayedMaterialChoice = update_displayed_material_choice;
window.updateRecipeTooltip = update_recipe_tooltip;

window.option_uniform_textsize = option_uniform_textsize;
window.option_bed_return = option_bed_return;
window.option_combat_autoswitch = option_combat_autoswitch;
window.option_combat_filter = option_combat_filter;
window.option_format_change = option_format_change;
window.option_remember_filters = option_remember_filters;

window.getDate = get_date;

window.saveProgress = save_progress;
window.save_to_file = save_to_file;
window.load_progress = load_from_file;
window.loadBackup = load_backup;
window.importOtherReleaseSave = load_other_release_save;
window.get_game_version = get_game_version;

if(save_key in localStorage || (is_on_dev() && dev_save_key in localStorage)) {
    load_from_localstorage();
    update_character_stats();
    update_displayed_xp_bonuses();
}
else {
    add_to_character_inventory([
                                {item: getItem(item_templates["铜板"]), count: 32},
                                {item: getItem(item_templates["坚硬石块"]), count: 1},
                                {item: getItem(item_templates["魔力碎晶"]), count: 3},
                                //设定上这些是纳可捡来的漂亮石头和零花钱.
                            ]);

    //equip_item_from_inventory({item_name: "Cheap iron sword", item_id: 0});
    //equip_item_from_inventory({item_name: "Cheap leather pants", item_id: 0});
    //这个，不需要了
    add_xp_to_character(0);
    character.money = 0;
    update_displayed_money();
    update_character_stats();

    update_displayed_stance_list();
    change_stance("normal");
    create_displayed_crafting_recipes();
    change_location("纳家大厅");
} //checks if there's an existing save file, otherwise just sets up some initial equipment

document.getElementById("loading_screen").style.visibility = "hidden";


function add_stuff_for_testing() {
    add_to_character_inventory([
        {item: getItem({...item_templates["Iron spear"], quality: 1}), count: 100},
        {item: getItem({...item_templates["Iron spear"], quality: 2}), count: 100},
        {item: getItem({...item_templates["Iron spear"], quality: 1}), count: 1},
    ]);
}

function add_all_stuff_to_inventory(){
    Object.keys(item_templates).forEach(item => {
        add_to_character_inventory([
            {item: getItem({...item_templates[item]}), count: 5},
        ]);
    })
}

//add_to_character_inventory([{item: getItem(item_templates["ABC for kids"]), count: 10}]);
//add_stuff_for_testing();
//add_all_stuff_to_inventory();

update_displayed_equipment();
sort_displayed_inventory({sort_by: "price", target: "character"});

run();

//Verify_Game_Objects();
//window.Verify_Game_Objects = Verify_Game_Objects;

if(is_on_dev()) {
    log_message("It looks like you are playing on the dev release. It is recommended to keep the developer console open (in Chrome/Firefox/Edge it's at F12 => 'Console' tab) in case of any errors/warnings appearing in there.", "notification");

    if(localStorage[dev_backup_key]) {
        update_backup_load_button(JSON.parse(localStorage[dev_backup_key]).saved_at);
    } else {
        update_backup_load_button();
    }

    if(localStorage[save_key]) {
        update_other_save_load_button(JSON.parse(localStorage[save_key]).saved_at || "", true);
    } else {
        update_other_save_load_button(null, true);
    }
} else {
    if(localStorage[backup_key]) {
        update_backup_load_button(JSON.parse(localStorage[backup_key]).saved_at);
    } else {
        update_backup_load_button();
    }

    if(localStorage[dev_save_key]) {
        update_other_save_load_button(JSON.parse(localStorage[dev_save_key]).saved_at || "");
    } else {
        //update_other_save_load_button();
    }
}

export { current_enemies, can_work, 
        current_location, active_effects, 
        enough_time_for_earnings, add_xp_to_skill, 
        get_current_book, unlock_location,
        last_location_with_bed, 
        last_combat_location, 
        inf_combat,
        current_stance, selected_stance,
        faved_stances, options,
        update_quests,
        global_flags,
        character_equip_item };