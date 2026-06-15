"use strict";

import { character } from "./character.js";
import {item_templates, getItem} from "./items.js";

let enemy_templates = {};
let enemy_killcount = {};
//enemy templates; locations create new enemies based on them

class Enemy {
    constructor({name, 
                 id = null,
                 description, 
                 xp_value = 1, 
                 stats, 
                 rank,
                 loot_list = [], 
                 size = "small",
                 add_to_bestiary = true,
                 tags = [],
                 realm = 1,
                 spec = [],
                 loot_multi = 1,
                 spec_value = {},
                 image = "",
                }) {
                    
        this.name = name;
            this.id = id ?? name;
        this.rank = rank; //only for the bestiary order; higher rank => higher in display
        this.description = description; //try to keep it short
        this.xp_value = xp_value;
        this.stats = stats;
        this.loot_multi = loot_multi;
        this.spec = spec;
        this.spec_value = spec_value;
        this.image = image;//image
        //only ma.gic & defense can be 0 in stats, other things will cause issues
        this.stats.max_health = stats.health;
        this.loot_list = loot_list;
        this.tags = {};
        this.realm = realm;
        for(let i = 0; i <tags.length; i++) {
            this.tags[tags[i]] = true;
        }
        this.tags[size] = true;

        this.add_to_bestiary = add_to_bestiary; //generally set it false only for SOME of challenges and keep true for everything else

        if(size !== "small" && size !== "medium" && size !== "large") {
            this.size = "small";
            //throw new Error(`No such enemy size option as "size"!`);
        } else {
            this.size = size;
        }

    }
    get_loot() {
        // goes through items and calculates drops
        // result is in form [{item: Item, count: item_count}, {...}, {...}]
        let loot = [];
        let item;
        for (let i = 0; i < this.loot_list.length; i++) {
            item = this.loot_list[i];
            if(!item_templates[item.item_name]) {
                console.warn(`Tried to loot an item "${item.item_name}" from "${this.name}", but such an item doesn't exist!`);
                continue;
            }
            
            let raw_chance = item.chance * this.get_droprate_modifier() ;
            if(item.ignore_luck) raw_chance = item.chance;
            let item_count = 0;
            item_count = Math.floor(raw_chance);
            let final_chance = raw_chance - item_count;
            if (final_chance>= Math.random()) item_count ++;
            // if ("count" in item) {
            //     item_count = Math.round(Math.random() * (item["count"]["max"] - item["count"]["min"]) + item["count"]["min"]);
            //     // calculates how much drops (from range min-max, both inclusive
            //   getItem({...item_templates[result_id], quality: selected_recipe.Q_able}))
            // }
                
            if(item_count != 0){
                if(item.quality != undefined) loot.push({ "item": getItem({...item_templates[item.item_name],quality:item.quality}), "count": item_count });
                else loot.push({ "item": getItem(item_templates[item.item_name]), "count": item_count });
            }
        }

        return loot;
    }

    get_droprate_modifier() {
        let droprate_modifier = this.loot_multi;
        droprate_modifier *= character.stats.full.luck;
        /*
        if(enemy_killcount[this.name] >= 999) {
            droprate_modifier = 0.1;
        } else if(enemy_killcount[this.name]) {
            droprate_modifier = 111/(111+enemy_killcount[this.name]);
        }
        */
        return droprate_modifier;
    }
}

//regular enemies
(function(){
    /*
    lore note:
    wolf rats are semi-ma.gical creatures that feed on natural ma.gical energy; cave near the village, where they live, is filled up with it on lower levels, 
    providing them with a perfect environment;
    rats on the surface are ones that were kicked out (because space is limited and they were weak), half starving and trying to quench their hunger by eating plants and stuff
    

    */
    enemy_templates["Starving wolf rat"] = new Enemy({
        name: "Starving wolf rat", 
        description: "Rat with size of a dog, starved and weakened", 
        xp_value: 1, 
        rank: 1,
        size: "small",
        tags: ["living", "beast", "wolf rat", "pest"],
        stats: {health: 2, attack: 5, agility: 6, attack_speed: 0.8, defense: 1}, 
        loot_list: [
            {item_name: "Rat tail", chance: 0.04},
            {item_name: "Rat fang", chance: 0.04},
            {item_name: "Rat pelt", chance: 0.01}
        ]
    });

    enemy_templates["Wolf rat"] = new Enemy({
        name: "Wolf rat", 
        description: "Rat with size of a dog",
        xp_value: 1, 
        rank: 1,
        size: "small",
        tags: ["living", "beast", "wolf rat", "pest"],
        stats: {health: 3, attack: 7, agility: 18, dexterity: 6, intuition: 7, attack_speed: 1, defense: 2}, 
        loot_list: [
            {item_name: "Rat tail", chance: 0.04},
            {item_name: "Rat fang", chance: 0.04},
            {item_name: "Rat pelt", chance: 0.01},
        ]
    });
    enemy_templates["Elite wolf rat"] = new Enemy({
        name: "Elite wolf rat",
        description: "Rat with size of a dog, much more ferocious than its relatives",
        xp_value: 4, 
        rank: 1,
        size: "small",
        tags: ["living", "beast", "wolf rat", "pest"],
        stats: {health: 80, attack: 32, agility: 30, dexterity: 24, intuition: 24, attack_speed: 1.5, defense: 8}, 
        loot_list: [
            {item_name: "Rat tail", chance: 0.04},
            {item_name: "Rat fang", chance: 0.04},
            {item_name: "Rat pelt", chance: 0.02},
        ]
    });
    enemy_templates["Elite wolf rat guardian"] = new Enemy({
        name: "Elite wolf rat guardian",
        description: "It's no longer dog-sized, but rather around the size of an average wolf, with thicker skin, longer claws and pure insanity in the eyes",
        xp_value: 10, 
        rank: 4,
        size: "medium",
        tags: ["living", "beast", "wolf rat", "monster"],
        stats: {health: 250, attack: 50, agility: 40, dexterity: 40, intuition: 50, attack_speed: 1.2, defense: 30},
        loot_list: [
            {item_name: "Rat tail", chance: 0.04},
            {item_name: "Rat fang", chance: 0.04},
            {item_name: "Rat pelt", chance: 0.02},
            {item_name: "Weak monster bone", chance: 0.005},
        ]
    });

    enemy_templates["Starving wolf"] = new Enemy({
        name: "Starving wolf", description: "A large, wild and hungry canine", 
        xp_value: 3, 
        rank: 2,
        tags: ["living", "beast"],
        stats: {health: 150, attack: 25, agility: 34, dexterity: 34, intuition: 32, attack_speed: 1, defense: 12}, 
        loot_list: [
            {item_name: "Wolf fang", chance: 0.03},
            {item_name: "Wolf pelt", chance: 0.01},
        ],
        size: "medium",
    });

    enemy_templates["Young wolf"] = new Enemy({
        name: "Young wolf", 
        description: "A small, wild canine", 
        xp_value: 3, 
        rank: 2,
        tags: ["living", "beast"],
        stats: {health: 120, attack: 25, agility: 34, dexterity: 30, intuition: 24, attack_speed: 1.4, defense: 6}, 
        loot_list: [
            {item_name: "Wolf fang", chance: 0.03},
            {item_name: "Wolf pelt", chance: 0.01},
        ],
        size: "small",
    });

    enemy_templates["Wolf"] = new Enemy({
        name: "Wolf", 
        description: "A large, wild canine", 
        xp_value: 4, 
        rank: 3,
        tags: ["living", "beast"],
        stats: {health: 200, attack: 35, agility: 42, dexterity: 42, intuition: 32, attack_speed: 1.3, defense: 20}, 
        loot_list: [
            {item_name: "Wolf fang", chance: 0.04},
            {item_name: "Wolf pelt", chance: 0.02},
            {item_name: "High quality wolf fang", chance: 0.0005}
        ],
        size: "medium"
    });

    enemy_templates["Boar"] = new Enemy({
        name: "Boar", 
        description: "A large wild creature, with thick skin and large tusks", 
        xp_value: 8,
        rank: 4,
        tags: ["living", "beast"],
        stats: {health: 300, attack: 40, agility: 30, dexterity: 40, intuition: 40, attack_speed: 1, defense: 25},
        loot_list: [
            {item_name: "Boar hide", chance: 0.04},
            {item_name: "Boar meat", chance: 0.02},
            {item_name: "High quality boar tusk", chance: 0.0005},
        ],
        size: "medium"
    });

    //from now on,it's NekoRPG enemies!
    //seems rank only affacts sorting
    //基本上，rank按照纳可的[X幕X区]划分，如前10层的rank统一为11.
    //realm = 纳可中的境界
    //名称和颜色都由realm决定

    //白色境界：
    //敏捷参考值:1/2/6/16/40/100/240/550/1.3k（+版+50%）
    //速度参考值:1.0/1.0/1.0/1.1/1.1/1.1/1.2/1.2/1.2
    //参考掉落概率4%,同种掉落更高级的提升
    //经验获取：1个境界1次斐波那契
    
    


    enemy_templates["毛茸茸"] = new Enemy({
        name: "Fluffy",
        description: "An ordinary light-colored Slime",
        xp_value: 1, 
        rank: 1101,
        image: "image/enemy/E1101.png",
        realm: "<span class=realm_basic><b>Dust Rank: Novice</b></span>",
        size: "small",
        tags: [],
        stats: {health: 3, attack: 3, agility: 1, attack_speed: 1, defense: 0}, 
        loot_list: [
            {item_name: "凝胶", chance: 0.04},
            {item_name: "初始黄宝石", chance:0.015},
            //0.05C(=)
        ]
    });

    enemy_templates["武装毛茸茸"] = new Enemy({
        name: "Armed Fluffy",
        description: "A light-colored Slime that got its hands on a sword and shield, but it slows it down",
        xp_value: 1, 
        rank: 1102,
        image: "image/enemy/E1102.png",
        realm: "<span class=realm_basic><b>Dust Rank: Novice</b></span>",
        size: "small",
        tags: [],
        stats: {health: 4, attack: 4, agility: 1, attack_speed: 0.8, defense: 0}, 
        loot_list: [
            {item_name: "凝胶", chance: 0.01},
            {item_name: "金属残片", chance:0.01},
            {item_name: "初始黄宝石", chance:0.015},
            //0.06C(+0.01C)
        ],
    });

    enemy_templates["红毛茸茸"] = new Enemy({
        name: "Red Fluffy",
        description: "A mutant Slime, stronger overall than an ordinary Slime",
        xp_value: 1, 
        rank: 1103,
        image: "image/enemy/E1103.png",
        realm: "<span class=realm_basic><b>Dust Rank: Novice +</b></span>",
        size: "small",
        tags: [],
        
        stats: {health: 5, attack: 6, agility: 1.5, attack_speed: 1.0, defense: 0}, 
        loot_list: [
            {item_name: "凝胶", chance: 0.06},
            {item_name: "初始黄宝石", chance:0.015},
            //0.07C(-0.01C)
        ],
    });

    enemy_templates["小飞蛾"] = new Enemy({
        name: "Small Moth",
        description: "A small-sized moth. Its ability to fly makes it extremely agile",
        xp_value: 1, 
        rank: 1104,
        image: "image/enemy/E1104.png",
        realm: "<span class=realm_basic><b>Dust Rank: Novice +</b></span>",
        size: "small",
        tags: [],
        
        spec: [2],

        stats: {health: 3, attack: 10, agility: 4, attack_speed: 1.0, defense: 0}, 
        loot_list: [
            {item_name: "飞蛾翅膀", chance: 0.01},
            {item_name: "初始黄宝石", chance:0.015},
            
            //0.09C(+0.01C)
        ],
    });

    enemy_templates["骸骨"] = new Enemy({
        name: "Skeleton",
        description: "The weakest of undead creatures",
        xp_value: 2, 
        rank: 1105,
        image: "image/enemy/E1105.png",
        realm: "<span class=realm_basic><b>Dust Rank: Adept</b></span>",
        size: "small",
        tags: [],
        
        spec: [],

        stats: {health: 12, attack: 7, agility: 1.8, attack_speed: 1.0, defense: 1}, 
        loot_list: [
            {item_name: "骨头", chance: 0.02},
            {item_name: "初始黄宝石", chance:0.045},
            
            //0.15C(-0.02C)
        ],
    });

    enemy_templates["武装红毛茸茸"] = new Enemy({
        name: "Armed Red Fluffy",
        description: "A mutant Slime equipped with sword and shield - it is no longer slowed down!",
        xp_value: 2, 
        rank: 1106,
        image: "image/enemy/E1106.png",
        realm: "<span class=realm_basic><b>Dust Rank: Adept</b></span>",
        size: "small",
        tags: [],
        stats: {health: 10, attack: 8, agility: 2.2, attack_speed: 1.0, defense: 2}, 
        loot_list: [
            {item_name: "凝胶", chance: 0.06},
            {item_name: "金属残片", chance:0.02},
            {item_name: "初始黄宝石", chance:0.045},
            //0.17C(+0.01C)
        ],
    });

    enemy_templates["少年法师"] = new Enemy({
        name: "Young Mage",
        description: "A young mage. Magic attacks ignore the opponent's defense, but the mage itself is quite fragile",
        xp_value: 2, 
        rank: 1107,
        image: "image/enemy/E1107.png",
        realm: "<span class=realm_basic><b>Dust Rank: Adept +</b></span>",
        size: "small",
        spec: [0],
        tags: [],
        stats: {health: 6, attack: 3, agility: 3, attack_speed: 1.0, defense: 3}, 
        loot_list: [
            {item_name: "魔力碎晶", chance: 0.03},
            {item_name: "初始黄宝石", chance:0.045},
            
            //0.27C(+0.01C)
        ],
    });

    enemy_templates["微尘级野兽"] = new Enemy({
        name: "Dust Rank Wild Beast",
        description: "A juvenile Wild Beast from the Xuelo Continent, with tender and juicy meat",
        xp_value: 2, 
        rank: 1108,
        image: "image/enemy/E1108.png",
        realm: "<span class=realm_basic><b>Dust Rank: Adept +</b></span>",
        size: "small",
        spec: [3],
        tags: [],
        stats: {health: 14, attack: 12, agility: 3, attack_speed: 1.0, defense: 2}, 
        loot_list: [
            {item_name: "微尘·凶兽肉块", chance: 0.01},
            {item_name: "骨头", chance: 0.01},
            {item_name: "初始黄宝石", chance:0.045},

            //0.27C(+0.01C)
        ],
    });

    enemy_templates["废弃傀儡"] = new Enemy({
        name: "Abandoned Golem",
        description: "A rock Golem with nearly depleted energy, only retaining Dust Rank Advanced strength",
        xp_value: 3, 
        rank: 1109,
        image: "image/enemy/E1109.png",
        realm: "<span class=realm_basic><b>Dust Rank: Expert</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 15, attack: 18, agility: 6, attack_speed: 1.0, defense: 6}, 
        loot_list: [
            {item_name: "坚硬石块", chance: 0.04},
            {item_name: "魔力碎晶", chance: 0.04},
            {item_name: "初始黄宝石", chance:0.075},
            
            //0.47C(-0.03C)
        ],
    });

    enemy_templates["黑毛茸茸"] = new Enemy({
        name: "Black Fluffy",
        description: "A mutant Slime slightly larger in size, surpassing its kin in strength",
        xp_value: 3, 
        rank: 1110,
        image: "image/enemy/E1110.png",
        realm: "<span class=realm_basic><b>Dust Rank: Expert</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 8, attack: 16, agility: 6, attack_speed: 1.0, defense: 3}, 
        loot_list: [
            {item_name: "凝胶", chance: 0.10},
            {item_name: "魔力碎晶", chance: 0.04},
            {item_name: "初始黄宝石", chance:0.075},
            //0.39C(-0.11C)
        ],
    });

    enemy_templates["荧光飞蛾"] = new Enemy({
        name: "Glowing Moth",
        description: "A mutant moth that emits a bright glow, inheriting the Small Moth's agility",
        xp_value: 3, 
        rank: 1111,
        image: "image/enemy/E1111.png",
        realm: "<span class=realm_basic><b>Dust Rank: Expert +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 42, attack: 21, agility: 16, attack_speed: 1.0, defense: 0}, 
        loot_list: [
            {item_name: "飞蛾翅膀", chance: 0.04},
            {item_name: "魔力碎晶", chance: 0.06},
            {item_name: "初始黄宝石", chance:0.075},
            //0.73C(-0.07C)
        ],
    });

    enemy_templates["橙毛茸茸"] = new Enemy({
        name: "Orange Fluffy",
        description: "Another Advanced mutant Slime. Stronger than the black version in every way",
        xp_value: 3, 
        rank: 1112,
        image: "image/enemy/E1112.png",
        realm: "<span class=realm_basic><b>Dust Rank: Expert +</b></span>",
        size: "small",
        spec: [2],
        tags: [],
        stats: {health: 20, attack: 30, agility: 12, attack_speed: 1.0, defense: 5}, 
        loot_list: [
            {item_name: "凝胶", chance: 0.1},
            {item_name: "五彩凝胶", chance: 0.01},
            {item_name: "初始黄宝石", chance:0.075},
            //0.90C(+0.01C)
        ],
    });

    enemy_templates["聚灵骸骨"] = new Enemy({
        name: "Spirit-Gathering Skeleton",
        description: "It seized its sword and shield through its own strength! Do not underestimate it!",
        xp_value: 3, 
        rank: 1113,
        image: "image/enemy/E1113.png",
        realm: "<span class=realm_basic><b>Dust Rank: Expert +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 40, attack: 21, agility: 10, attack_speed: 1.0, defense: 9}, 
        loot_list: [
            {item_name: "骨头", chance: 0.1},
            {item_name: "金属残片", chance: 0.08},
            {item_name: "魔力碎晶", chance: 0.05},
            {item_name: "初始黄宝石", chance:0.075},

            //1.27C(+0.47C)   
        ],
    });

    enemy_templates["大飞蛾"] = new Enemy({
        name: "Large Moth",
        description: "A bigger moth, not very agile, but it can strike twice!",
        xp_value: 3, 
        rank: 1114,
        image: "image/enemy/E1114.png",
        realm: "<span class=realm_basic><b>Dust Rank: Expert +</b></span>",
        size: "small",
        spec: [3],
        tags: [],
        stats: {health: 33, attack: 18, agility: 8, attack_speed: 1.0, defense: 9}, 
        loot_list: [
            {item_name: "飞蛾翅膀", chance: 0.1},
            {item_name: "初始黄宝石", chance:0.075},
            //0.45C(-0.35C)
        ],

    });

    //以下是万物级怪物-NekoRPG-

    enemy_templates["血洛游卒"] = new Enemy({
        name: "Xuelo Wandering Soldier",
        description: "Legend has it that everyone who passes through Stage 1 has some trauma from this one..",
        xp_value: 5, 
        rank: 1115,
        image: "image/enemy/E1115.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Novice</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 32, attack: 45, agility: 16, attack_speed: 1.1, defense: 8}, 
        loot_list: [
            {item_name: "魔力碎晶", chance: 0.1},
            {item_name: "金属残片", chance: 0.1},
            {item_name: "初始黄宝石", chance:0.12},
            //1.08C(-0.52C)
        ],
    });

    enemy_templates["石精"] = new Enemy({
        name: "Stone Spirit",
        description: "Each time you hit it, it loses at most 1 HP~",
        xp_value: 5, 
        rank: 1116,
        image: "image/enemy/E1116.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Novice</b></span>",
        size: "small",
        spec: [1],
        tags: [],
        stats: {health: 4, attack: 36, agility: 12, attack_speed: 1.1, defense: 0}, 
        loot_list: [
            {item_name: "坚硬石块", chance: 0.2},
            {item_name: "魔力碎晶", chance: 0.04},
            {item_name: "初始黄宝石", chance:0.12},
            //1.32C(-0.28C)
        ],
    });

    enemy_templates["弱小意念"] = new Enemy({
        name: "Feeble Psyche",
        description: "The embodiment of a nightmare, yet with drops as colorful as a dream!",
        xp_value: 5, 
        rank: 1117,
        image: "image/enemy/E1117.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Novice</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 48, attack: 49, agility: 20, attack_speed: 1.1, defense: 12}, 
        loot_list: [
            {item_name: "初始黄宝石", chance:0.12},
            {item_name: "五彩凝胶", chance: 0.04},
            //3.08C(+1.48C)
        ],
    });

    enemy_templates["聚魂骸骨"] = new Enemy({
        name: "Soul-Gathering Skeleton",
        description: "It has tempered its bones to a bronze hue, demonstrating its considerable strength",
        xp_value: 5, 
        rank: 1118,
        image: "image/enemy/E1118.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Novice</b></span>",
        size: "small",
        spec: [4],
        tags: [],
        stats: {health: 40, attack: 63, agility: 24, attack_speed: 1.1, defense: 14}, 
        loot_list: [
            {item_name: "铜骨", chance: 0.1},
            {item_name: "初始黄宝石", chance:0.12},
            //2.08C(+0.48C)
        ],
    });
    enemy_templates["青年法师"] = new Enemy({
        name: "Adolescent Mage",
        description: "A slightly older mage. Still ignores defense, and considerably more powerful",
        xp_value: 5, 
        rank: 1119,
        image: "image/enemy/E1119.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Novice</b></span>",
        size: "small",
        spec: [0],
        tags: [],
        stats: {health: 70, attack: 17, agility: 24, attack_speed: 1.1, defense: 17}, 
        loot_list: [
            {item_name: "魔力碎晶", chance: 0.15},
            {item_name: "初始黄宝石", chance:0.12},
            //0.98C(-0.62C)
        ],
    });
    enemy_templates["武装橙毛茸茸"] = new Enemy({
        name: "Armed Orange Fluffy",
        description: "Legend says the color of ordinary/armed Slimes shifts like a rainbow as they grow stronger...",
        xp_value: 5, 
        rank: 1120,
        image: "image/enemy/E1120.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Novice +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 120, attack: 56, agility: 24, attack_speed: 1.1, defense: 16}, 
        loot_list: [
            {item_name: "凝胶", chance: 0.1},
            {item_name: "五彩凝胶", chance: 0.02},
            {item_name: "金属残片", chance:0.15},
            {item_name: "初始黄宝石", chance:0.12},
            {item_name: "初始蓝宝石", chance:0.015},

            //2.30C(-0.26C)
        ],
    });
    enemy_templates["万物级凶兽"] = new Enemy({
        name: "Myriad Rank Wild Beast",
        description: "At a similar evolution stage as the Dust Rank Wild Beast, but its larger body grants it greater strength... and more meat.",
        xp_value: 5, 
        rank: 1121,
        image: "image/enemy/E1121.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Novice +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 360, attack: 50, agility: 24, attack_speed: 1.1, defense: 24}, 
        loot_list: [
            {item_name: "微尘·凶兽肉块", chance: 0.2},
            {item_name: "金属残片", chance:0.15},
            {item_name: "初始黄宝石", chance:0.12},
            {item_name: "初始蓝宝石", chance:0.015},

            //2.40C(-0.16C)
        ],
    });
    enemy_templates["习武孩童"] = new Enemy({
        name: "Martial Arts Child",
        description: "Some other family's kid who snuck over to the Na Family to learn techniques - they deserve a punishment!",
        xp_value: 5, 
        rank: 1122,
        image: "image/enemy/E1122.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Novice +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 120, attack: 72, agility: 24, attack_speed: 1.1, defense: 15}, 
        loot_list: [
            {item_name: "铜板", chance:0.4},
            {item_name: "铜板", chance:0.4},
            {item_name: "铜板", chance:0.4},
            {item_name: "大铜板", chance:0.2},
            {item_name: "初始黄宝石", chance:0.12},
            {item_name: "初始蓝宝石", chance:0.015},

            //2.30C(-0.26C)
        ],
    });
    enemy_templates["出芽茸茸"] = new Enemy({
        name: "Budding Fluffy",
        description: "That bud is the crystallization of its cultivation! But not even a single copper coin can be sold at Myriad Rank..",
        xp_value: 8, 
        rank: 1123,
        image: "image/enemy/E1123.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Expert</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 180, attack: 84, agility: 40, attack_speed: 1.1, defense: 18}, 
        loot_list: [
            {item_name: "凝胶", chance: 0.1},
            {item_name: "魔力碎晶", chance: 0.1},
            {item_name: "五彩凝胶", chance: 0.05},
            {item_name: "初始黄宝石", chance:0.06},
            {item_name: "初始蓝宝石", chance:0.045},
            //4.55C(-0.55C)
        ],
    });
    enemy_templates["试炼木偶"] = new Enemy({
        name: "Trial Puppet",
        description: "Ave Musica 奇跡を日常に(Fortuna)... Not that kind of puppet!",
        xp_value: 8, 
        rank: 1124,
        image: "image/enemy/E1124.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Expert</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 240, attack: 69, agility: 40, attack_speed: 1.1, defense: 35}, 
        loot_list: [
            {item_name: "魔力碎晶", chance: 1},
            {item_name: "初始黄宝石", chance:0.06},
            {item_name: "初始蓝宝石", chance:0.045},
            //4.10C(-0.90C)
        ],
    });
    //1-2 below  
    enemy_templates["纳家待从"] = new Enemy({
        name: "Na Family Attendant",
        description: "An ordinary Na Family follower. Since they are on the city streets, they hold back their strength.",
        xp_value: 13, 
        rank: 1201,
        image: "image/enemy/E1201.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Pinnacle</b></span>",
        size: "small",
        spec: [5],
        tags: [],
        stats: {health: 344, attack: 111, agility: 60, attack_speed: 1.1, defense: 44} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.045},
            {item_name: "初始红宝石", chance:0.008},
            {item_name: "银钱", chance: 0.1},
            {item_name: "金属残片", chance:0.4},
            //~16C
        ],
    });
    enemy_templates["轻型傀儡"] = new Enemy({
        name: "Light Golem",
        description: "A Golem made of painted iron sheeting, a bit stronger than its stone counterpart.",
        xp_value: 8, 
        rank: 1202,
        image: "image/enemy/E1202.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Expert +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 150, attack: 103, agility: 80, attack_speed: 1.2, defense: 33} , //都说了是轻型的！
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.045},
            {item_name: "初始红宝石", chance:0.008},
            {item_name: "金属残片", chance:0.3},
            {item_name: "合金残片", chance:0.05},
            //~9C
        ],
    });
    enemy_templates["出芽红茸茸"] = new Enemy({
        name: "Budding Red Fluffy",
        description: "Another member of the Fluffy family - though only marginally stronger than the Budding Fluffy.",
        xp_value: 8, 
        rank: 1203,
        image: "image/enemy/E1203.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Expert +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 97, attack: 97, agility: 60, attack_speed: 1.1, defense: 42} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.045},
            {item_name: "初始红宝石", chance:0.008},
            {item_name: "凝胶", chance:0.3},
            {item_name: "五彩凝胶", chance:0.1},
            {item_name: "魔力碎晶", chance:0.1},
            //~9C
        ],
    });
    enemy_templates["万物级异兽"] = new Enemy({
        name: "Myriad Rank Strange Beast",
        description: "A strange beast that wields restraining power. Its meat is extremely nutritious when enhanced by energy.",
        xp_value: 8, 
        rank: 1204,
        image: "image/enemy/E1204.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Expert +</b></span>",
        size: "small",
        spec: [5],
        tags: [],
        stats: {health: 840, attack: 128, agility: 60, attack_speed: 1.2, defense: 16} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.045},
            {item_name: "万物·凶兽肉块", chance:0.03},
            {item_name: "异兽皮", chance:0.01},
            //~9C
        ],
    });
    enemy_templates["高速傀儡"] = new Enemy({
        name: "High-Speed Golem",
        description: "A Golem made of lightweight alloy, sacrificing defense for speed",
        xp_value: 13, 
        rank: 1205,
        image: "image/enemy/E1205.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Pinnacle</b></span>",
        size: "small",
        spec: [6],
        tags: [],
        stats: {health: 150, attack: 180, agility: 120, attack_speed: 1.1, defense: 0} , //不要忘记agi基准值是80，spd基准值还是1.1
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.045},
            {item_name: "初始红宝石", chance:0.015},
            {item_name: "金属残片", chance:0.2},
            {item_name: "合金残片", chance:0.1}
            //~16C
        ],
    });//需要3连击
    enemy_templates["黄毛茸茸"] = new Enemy({
        name: "Yellow Fluffy",
        description: "A tanky Fluffy that learned magic attacks!",
        xp_value: 13, 
        rank: 1206,
        image: "image/enemy/E1206.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Pinnacle</b></span>",
        size: "small",
        spec: [0],
        tags: [],
        stats: {health: 600, attack: 20, agility: 80, attack_speed: 1.1, defense: 45} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.045},
            {item_name: "初始红宝石", chance:0.015},
            {item_name: "凝胶", chance:0.3},
            {item_name: "五彩凝胶", chance:0.2},
            {item_name: "魔力碎晶", chance:0.15},
            
            //~16C
        ],
    });
    enemy_templates["纳家塑像"] = new Enemy({
        name: "Na Family Statue",
        description: "A mass-produced Golem statue by the Na Family. Not very powerful, but cheap.",
        xp_value: 13, 
        rank: 1207,
        image: "image/enemy/E1207.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Pinnacle</b></span>",
        size: "small",
        spec: [1],
        tags: [],
        stats: {health: 4, attack: 140, agility: 60, attack_speed: 1.1, defense: 0} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.045},
            {item_name: "初始红宝石", chance:0.015},
            {item_name: "坚硬石块", chance: 0.3},
            {item_name: "银钱", chance: 0.12},
            //~16C
        ],
    });
    enemy_templates["出芽橙茸茸"] = new Enemy({
        name: "Budding Orange Fluffy",
        description: "Its bud contains enough magical power to produce a batch of Rainbow Gel.",
        xp_value: 13, 
        rank: 1208,
        image: "image/enemy/E1208.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 300, attack: 175, agility: 90, attack_speed: 1.1, defense: 30} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.045},
            {item_name: "初始红宝石", chance:0.015},
            {item_name: "凝胶", chance: 0.4},
            {item_name: "五彩凝胶", chance:0.3},
            {item_name: "魔力碎晶", chance:0.15},
            //~26C
        ],
    });
    enemy_templates["森林野蝠"] = new Enemy({
        name: "Forest Wild Bat",
        description: "The red bat from floor 24 of the Magic Tower has reincarnated here, bringing a wound-deepening effect!",
        xp_value: 13, 
        rank: 1209,
        image: "image/enemy/E1209.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [7],
        tags: [],
        stats: {health: 440, attack: 120, agility: 90, attack_speed: 1.1, defense: 50} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.045},
            {item_name: "初始红宝石", chance:0.015},
            {item_name: "异兽皮", chance: 0.05},
            {item_name: "魔力碎晶", chance:0.15},
            //~26C
        ],
    });
    enemy_templates["血洛喽啰"] = new Enemy({
        name: "Xuelo Lackey",
        description: "Compared to its younger sibling, it appeared too late and was tragically forgotten",
        xp_value: 21, 
        rank: 1210,
        image: "image/enemy/E1210.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Novice</b></span>",
        size: "small",
        spec: [8],
        spec_value:{8:10},
        tags: [],
        stats: {health: 700, attack: 151, agility: 120, attack_speed: 1.2, defense: 70} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.03},
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "合金残片", chance: 0.10},
            {item_name: "金属残片", chance: 0.40},
            {item_name: "红色刀币", chance: 0.02},
            //~50C
        ],
    });
    enemy_templates["百家小卒"] = new Enemy({
        name: "Hundred Clans Pawn",
        description: "A Hundred Clans Pawn that is not so determined - it will flee at the first minor injury.",
        xp_value: 13, 
        rank: 1211,
        image: "image/enemy/E1211.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Pinnacle</b></span>",
        size: "small",
        spec: [2],
        tags: [],
        stats: {health: 660, attack: 144, agility: 90, attack_speed: 1.1, defense: 60} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.045},
            {item_name: "初始红宝石", chance:0.015},
            {item_name: "银钱", chance: 0.15},
            {item_name: "金属残片", chance: 0.30},
            //~16C
        ],
    });
    enemy_templates["下位佣兵"] = new Enemy({
        name: "Lower-Rank Mercenary",
        description: "A low-level Xuelo mercenary, guarding mediocre treasures",
        xp_value: 21, 
        rank: 1212,
        image: "image/enemy/E1212.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Novice</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 560, attack: 230, agility: 120, attack_speed: 1.2, defense: 48} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.03},
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "合金残片", chance: 0.12},
            {item_name: "银钱", chance: 0.25},
            {item_name: "铁锭", chance: 0.25},
            //50C
        ],
    });
    enemy_templates["地龙荒兽"] = new Enemy({
        name: "Earth Dragon Wild Beast",
        description: "A strange beast that capitalizes on its racial advantage with a preemptive strike strategy",
        xp_value: 21, 
        rank: 1213,
        image: "image/enemy/E1213.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Novice</b></span>",
        size: "small",
        spec: [4],
        tags: [],
        stats: {health: 190, attack: 340, agility: 120, attack_speed: 1.2, defense: 60} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.03},
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "异兽皮", chance: 0.08},
            {item_name: "万物·凶兽肉块", chance: 0.08},
            //~50C
        ],
    });
    enemy_templates["毒虫"] = new Enemy({
        name: "Poison Bug",
        description: "A strangely structured slime. When fighting it, stats are reversed!",
        xp_value: 21, 
        rank: 1214,
        image: "image/enemy/E1214.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Novice</b></span>",
        size: "small",
        spec: [9],
        tags: [],
        stats: {health: 560, attack: 230, agility: 120, attack_speed: 1.2, defense: 48} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.03},
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "魔力碎晶", chance: 0.5},
            {item_name: "异兽皮", chance: 0.12},

            //~50C
        ],
    });
    enemy_templates["精壮青年"] = new Enemy({
        name: "Strapping Youth",
        description: "A strapping young man from Yangang City, his strength is above average among his peers",
        xp_value: 21, 
        rank: 1215,
        image: "image/enemy/E1215.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Novice</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 900, attack: 181, agility: 140, attack_speed: 1.2, defense: 40} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.03},
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "红色刀币", chance: 0.01},
            {item_name: "银钱", chance: 0.4},
            //~50C
            //{item_name: "铁剑·改", count: [1], quality: [81, 100], chance: 0.2},
        ],
    });enemy_templates["法师学徒"] = new Enemy({
        name: "Mage Apprentice",
        description: "A stronger mage than the Adolescent Mage, who has learned new spells",
        xp_value: 21, 
        rank: 1216,
        image: "image/enemy/E1216.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Novice +</b></span>",
        size: "small",
        spec: [10],
        tags: [],
        stats: {health: 900, attack: 240, agility: 150, attack_speed: 1.2, defense: 80} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.03},
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "初始绿宝石", chance:0.02},
            {item_name: "魔力碎晶", chance: 0.5},
            {item_name: "红色刀币", chance: 0.08},
            //~90C
        ],
    });
    enemy_templates["生灵骸骨"] = new Enemy({
        name: "Living Skeleton",
        description: "An undead that has condensed flesh onto a Soul-Gathering Skeleton, balancing offense and defense.",
        xp_value: 21, 
        rank: 1217,
        image: "image/enemy/E1217.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Novice +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 1120, attack: 236, agility: 160, attack_speed: 1.2, defense: 105} , 
        loot_list: [
            {item_name: "初始蓝宝石", chance:0.03},
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "铜骨", chance: 0.6},
            {item_name: "万物·凶兽肉块", chance: 0.15},
            {item_name: "异兽皮", chance: 0.1},
            //~90C
        ],
    });
    enemy_templates["腐蚀质石精"] = new Enemy({
        name: "Corrosive Stone Spirit",
        description: "A large rock outside the city. Not very hostile - it will retreat at minor injuries.",
        xp_value: 34, 
        rank: 1301,
        image: "image/enemy/E1301.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Expert</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 1770, attack: 380, agility: 200, attack_speed: 1.2, defense: 160},
        loot_list: [
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "初始绿宝石", chance:0.02},
            {item_name: "毒液", chance:0.08},
            //应为160C
        ],
    });
    enemy_templates["绿毛茸茸"] = new Enemy({
        name: "Green Fluffy",
        description: "Fluffy family - wild exclusive edition",
        xp_value: 21, 
        rank: 1302,
        image: "image/enemy/E1302.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Novice +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 375, attack: 438, agility: 160, attack_speed: 1.2, defense: 135},
        loot_list: [
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "五彩凝胶", chance:0.5},
            {item_name: "灵液", chance:0.01},
            //应为90C
        ],
    });
    enemy_templates["荒野蜂"] = new Enemy({
        name: "Wasteland Wasp",
        description: "A mutated giant wasp. Its venom can weaken its enemies.",
        xp_value: 21, 
        rank: 1303,
        image: "image/enemy/E1303.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Novice +</b></span>",
        size: "small",
        spec: [8],
        spec_value:{8:10},
        tags: [],
        stats: {health: 850, attack: 360, agility: 180, attack_speed: 1.2, defense: 90},
        loot_list: [
            {item_name: "初始绿宝石", chance:0.03},
            {item_name: "毒液", chance:0.04},
            //应为90C
        ],
    });
    enemy_templates["切叶虫茧"] = new Enemy({
        name: "Leafcutter Cocoon",
        description: "A butterfly that has emerged from its cocoon. Its sharp forelegs can tear enemies apart.",
        xp_value: 21, 
        rank: 1304,
        image: "image/enemy/E1304.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Novice +</b></span>",
        size: "small",
        spec: [7],
        tags: [],
        stats: {health: 520, attack: 380, agility: 140, attack_speed: 1.2, defense: 150}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "天蚕丝", chance:0.03},
            //应为90C
        ],
    });
    enemy_templates["花灵液"] = new Enemy({
        name: "Floral Spirit Slime",
        description: "A mutant variant of the Green Fluffy. Its irregular form gives it both agility and damage absorption.",
        xp_value: 34, 
        rank: 1305,
        image: "image/enemy/E1305.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Expert</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 1400, attack: 415, agility: 220, attack_speed: 1.2, defense: 50}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "初始绿宝石", chance:0.02},
            {item_name: "灵液", chance:0.06},
            //应为160C
        ],
    });
    enemy_templates["燕岗领从者"] = new Enemy({
        name: "Yangang Domain Follower",
        description: "A common cultivator found everywhere. Modest in cultivation, modest in wealth.",
        xp_value: 34, 
        rank: 1306,
        image: "image/enemy/E1306.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Expert</b></span>",
        size: "small",
        spec: [3],
        tags: [],
        stats: {health: 1400, attack: 464, agility: 240, attack_speed: 1.2, defense: 190}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "初始绿宝石", chance:0.02},
            {item_name: "银钱", chance:0.6},
            {item_name: "红色刀币", chance:0.1},
            //应为160C
        ],
    });
    enemy_templates["野生幽灵"] = new Enemy({
        name: "Wild Ghost",
        description: "A ghost that has survived in the wilderness. Very fragile, but elusive.",
        xp_value: 34, 
        rank: 1307,
        image: "image/enemy/E1307.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Expert</b></span>",
        size: "small",
        spec: [2],
        tags: [],
        stats: {health: 290, attack: 875, agility: 360, attack_speed: 1.2, defense: 125}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "初始绿宝石", chance:0.02},
            //{item_name: "潮汐·凶兽肉排", chance:1.0},
            //应为160C
        ],
    });
    enemy_templates["荒兽尼尔"] = new Enemy({
        name: "Wild Beast Niel",
        description: "An avian Wild Beast. Well-muscled with thick hide.",
        xp_value: 34, 
        rank: 1308,
        image: "image/enemy/E1308.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Expert +</b></span>",
        size: "small",
        spec: [5],
        tags: [],
        stats: {health: 1080, attack: 910, agility: 320, attack_speed: 1.2, defense: 190}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "初始绿宝石", chance:0.02},
            {item_name: "天蚕丝", chance:0.04},
            {item_name: "潮汐·凶兽肉块", chance:0.03},
            //应为260C
        ],
    });
    enemy_templates["司雍世界修士"] = new Enemy({
        name: "Siyong World Cultivator",
        description: "A slightly rarer ordinary cultivator, considered strong among Tidal Rank Advanced.",
        xp_value: 34, 
        rank: 1309,
        image: "image/enemy/E1309.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Expert +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 1080, attack: 550, agility: 300, attack_speed: 1.2, defense: 230}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "初始绿宝石", chance:0.02},
            {item_name: "精钢锭", chance:0.5},
            {item_name: "银钱", chance:0.5},
            //应为260C
        ],
    });
    enemy_templates["潮汐级荒兽"] = new Enemy({
        name: "Tidal Rank Wild Beast",
        description: "A ground-dwelling Wild Beast, with slightly more meat than Wild Beast Niel",
        xp_value: 34, 
        rank: 1310,
        image: "image/enemy/E1310.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Expert +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 870, attack: 610, agility: 300, attack_speed: 1.2, defense: 190}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "初始绿宝石", chance:0.02},
            {item_name: "潮汐·凶兽肉块", chance:0.05},
            //应为260C
        ],
    });
    enemy_templates["掠原蝠"] = new Enemy({
        name: "Plains Raider Bat",
        description: "A small Wild Beast known for its speed - it will snatch a bit of everything",
        xp_value: 34, 
        rank: 1311,
        image: "image/enemy/E1311.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Expert +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 720, attack: 670, agility: 360, attack_speed: 1.2, defense: 210}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "初始绿宝石", chance:0.02},
            {item_name: "灵液", chance:0.03},
            {item_name: "毒液", chance:0.03},
            {item_name: "异兽皮", chance:0.15},
            //应为260C
        ],
    });
    enemy_templates["黑夜傀儡"] = new Enemy({
        name: "Night Golem",
        description: "A Golem spontaneously formed within rocks, often with gemstones embedded in its body",
        xp_value: 55, 
        rank: 1312,
        image: "image/enemy/E1312.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Pinnacle</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 1600, attack: 585, agility: 360, attack_speed: 1.2, defense: 320}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.2},
            {item_name: "初始绿宝石", chance:0.2},
            //应为500C
        ],
    });
    enemy_templates["来一口"] = new Enemy({
        name: "Take a Bite",
        description: "A Magical Creature that lurks underground, specifically targeting an adventurer's weak defensive areas, extremely troublesome",
        xp_value: 55, 
        rank: 1313,
        image: "image/enemy/E1313.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Pinnacle</b></span>",
        size: "small",
        spec: [0,7],
        tags: [],
        stats: {health: 700, attack: 288, agility: 300, attack_speed: 1.2, defense: 288}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "初始绿宝石", chance:0.02},
            {item_name: "毒液", chance:0.20},
            {item_name: "异兽皮", chance:0.20},
            //应为500C
        ],
    });
    enemy_templates["绿原行者"] = new Enemy({
        name: "Green Plains Wanderer",
        description: "An old man who exhausted his potential but barely reached Peak Tidal Rank, willing to pay any price for a chance at Earth Rank",
        xp_value: 55, 
        rank: 1314,
        image: "image/enemy/E1314.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Pinnacle</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 2000, attack: 700, agility: 270, attack_speed: 1.2, defense: 350}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "初始绿宝石", chance:0.02},
            {item_name: "煤炭", chance:0.15},
            {item_name: "异兽皮", chance:0.60},
            //应为500C
        ],
    });
    enemy_templates["初生鬼"] = new Enemy({
        name: "Newborn Wraith",
        description: "A Magical Creature formed from the resentment of dead adventurers. Having died in poverty, it craved money to its last breath.",
        xp_value: 55, 
        rank: 1315,
        image: "image/enemy/E1315.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Pinnacle</b></span>",
        size: "small",
        spec: [18],
        spec_value:{18:2000},
        tags: [],
        stats: {health: 3430, attack: 720, agility: 400, attack_speed: 1.2, defense: 0}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.04},
            {item_name: "初始绿宝石", chance:0.02},
            {item_name: "煤炭", chance:0.15},
            //应为500C
        ],
    });
    enemy_templates["燕岗领佣兵"] = new Enemy({
        name: "Yangang Domain Mercenary",
        description: "The first Earth Rank enemy. Friendly reminder: EXP gain rate doubles for Earth Rank and above!",
        xp_value: 144, 
        rank: 1316,
        image: "image/enemy/E1316.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 1</b></span>",
        size: "small",
        spec: [3],
        tags: [],
        stats: {health: 2990, attack: 1225, agility: 600, attack_speed: 1.2, defense: 400}, 
        loot_list: [
            {item_name: "高级黄宝石", chance:0.04},
            {item_name: "高级蓝宝石", chance:0.01},
            {item_name: "毒液", chance:0.6},
            {item_name: "紫铜锭", chance:0.2},
            //应为5X
        ],
    });

    enemy_templates["冷冻火"] = new Enemy({
        name: "Frozen Flame",
        description: "Don't think about fighting a war of attrition against it... unless you can kill it through defense.",
        xp_value: 55, 
        rank: 1317,
        image: "image/enemy/E1317.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [12],//时封
        tags: [],
        stats: {health: 2100, attack: 750, agility: 360, attack_speed: 1.2, defense: 100}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.02},
            {item_name: "初始绿宝石", chance:0.04},
            {item_name: "灵液", chance:0.35},
            //应为900C
        ],
    });

    enemy_templates["缠绕骸骨"] = new Enemy({
        name: "Entwined Skeleton",
        description: "An enhanced version of the Living Skeleton. The bones on it are top-quality materials!",
        xp_value: 55, 
        rank: 1318,
        image: "image/enemy/E1318.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 1350, attack: 960, agility: 400, attack_speed: 1.2, defense: 240}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.02},
            {item_name: "初始绿宝石", chance:0.04},
            {item_name: "天蚕丝", chance:0.2},
            {item_name: "润灵铜骨", chance:0.03},
            //应为900C
        ],
    });

    
    enemy_templates["灵蔓茸茸"] = new Enemy({
        name: "Spirit Vine Fluffy",
        description: "A Fluffy containing ferocious power. Wild Beasts nearby are influenced by it and become aggressive",
        xp_value: 55, 
        rank: 1319,
        image: "image/enemy/E1319.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [11],
        tags: [],
        stats: {health: 3430, attack: 720, agility: 400, attack_speed: 1.2, defense: 0}, 
        loot_list: [
            {item_name: "初始红宝石", chance:0.02},
            {item_name: "初始绿宝石", chance:0.04},
            {item_name: "毒液", chance:0.15},
            {item_name: "灵液", chance:0.10},
            {item_name: "天蚕丝", chance:0.15},
            //应为900C
        ],
    });
    enemy_templates["夜行幽灵"] = new Enemy({
        name: "Night-Stalking Ghost",
        description: "The only Tidal Rank Magical Creature in the Dungeon. It survived thanks to the convenience of lamplight.",
        xp_value: 55, 
        rank: 1401,
        image: "image/enemy/E1401.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [13],
        tags: [],
        stats: {health: 1000, attack: 1800, agility: 700, attack_speed: 1.2, defense: 0}, 
        loot_list: [
            {item_name: "高级黄宝石", chance:0.02},
            {item_name: "灵液", chance:0.36},
            //{item_name: "宝石吊坠", chance:1}
            //应为900C
        ],
    });
    enemy_templates["石风家族剑士"] = new Enemy({
        name: "Shifeng Family Swordsman",
        description: "Being a branch of a branch of the family, there is no need to worry about the city lord coming after you for fighting him",
        xp_value: 144, 
        rank: 1402,
        image: "image/enemy/E1402.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 1</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 4000, attack: 1450, agility: 800, attack_speed: 1.2, defense: 500}, 
        loot_list: [
            {item_name: "高级黄宝石", chance:0.04},
            {item_name: "高级蓝宝石", chance:0.01},
            {item_name: "断剑", chance:0.025},
            {item_name: "紫铜锭", chance:0.18},
            //应为5X
        ],
    });
    enemy_templates["能量络合球"] = new Enemy({
        name: "Energy Binding Sphere",
        description: "A lifeform generated from pure organized energy. Naturally uses magic attacks, but extremely fragile.",
        xp_value: 144, 
        rank: 1403,
        image: "image/enemy/E1403.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 1</b></span>",
        size: "small",
        spec: [0],
        tags: [],
        stats: {health: 980, attack: 830, agility: 830, attack_speed: 1.2, defense: 830}, 
        loot_list: [
            {item_name: "高级黄宝石", chance:0.04},
            {item_name: "高级蓝宝石", chance:0.01},
            {item_name: "大地级魂魄", chance:0.06},
            //应为5X
        ],
    });
    enemy_templates["短视蝠"] = new Enemy({
        name: "Shortsighted Bat",
        description: "Its enormous eyeballs don't actually improve its vision... it seems to have forgotten how convex lenses work.",
        xp_value: 144, 
        rank: 1404,
        image: "image/enemy/E1404.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 1</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 7500, attack: 1300, agility: 650, attack_speed: 1.2, defense: 800}, 
        loot_list: [
            {item_name: "高级黄宝石", chance:0.04},
            {item_name: "高级蓝宝石", chance:0.01},
            {item_name: "巨型眼球", chance:0.05},
            //应为5X
        ],
    });
    enemy_templates["金衣除草者"] = new Enemy({
        name: "Golden-Robed Weeder",
        description: "Its formation technique is a bit slow to set up, but the effect is still very powerful.",
        xp_value: 144, 
        rank: 1405,
        image: "image/enemy/E1405.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 1</b></span>",
        size: "small",
        spec: [14],
        tags: [],
        stats: {health: 1920, attack: 2580, agility: 880, attack_speed: 0.9, defense: 280}, 
        loot_list: [
            {item_name: "高级黄宝石", chance:0.04},
            {item_name: "高级蓝宝石", chance:0.01},
            {item_name: "断剑", chance:0.03},
            {item_name: "润灵铜骨", chance:0.25},
            //应为5X
        ],
    });
    enemy_templates["阴暗茸茸"] = new Enemy({
        name: "Shadow Fluffy",
        description: "Its absolute darkness reverses the rules of offense and defense. But who says that has to be a bad thing?",
        xp_value: 144, 
        rank: 1406,
        image: "image/enemy/E1406.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 1</b></span>",
        size: "small",
        spec: [9],
        tags: [],
        stats: {health: 5800, attack: 1150, agility: 900, attack_speed: 1.2, defense: 300}, 
        loot_list: [
            {item_name: "高级黄宝石", chance:0.04},
            {item_name: "高级蓝宝石", chance:0.01},
            {item_name: "大地级魂魄", chance:0.045},
            {item_name: "A1·能量核心", chance:0.02},
            //应为5X
        ],
    });
    enemy_templates["地宫妖偶"] = new Enemy({
        name: "Dungeon Puppet",
        description: "A puppet that learned restraint techniques from reading books in the Dungeon. By the way, restraint has topped the \"trap effects\" chart at number two!",
        xp_value: 144, 
        rank: 1407,
        image: "image/enemy/E1407.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 1</b></span>",
        size: "small",
        spec: [5],
        tags: [],
        stats: {health: 3000, attack: 2500, agility: 900, attack_speed: 1.2, defense: 600}, 
        loot_list: [
            {item_name: "高级黄宝石", chance:0.04},
            {item_name: "高级蓝宝石", chance:0.01},
            {item_name: "牵制-从入门到入土", chance:0.01},
            //应为5X
        ],
    });
     enemy_templates["地宫虫卒"] = new Enemy({
        name: "Dungeon Bug Soldier",
        description: "It read more books and discovered restraint is a huge trap. Unfortunately, its own stats aren't great..",
        xp_value: 233, 
        rank: 1408,
        image: "image/enemy/E1408.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 6400, attack: 1700, agility: 1200, attack_speed: 1.2, defense: 750}, 
        loot_list: [

            {item_name: "高级黄宝石", chance:0.04},
            {item_name: "高级蓝宝石", chance:0.02},
            {item_name: "牵制-从入门到入土", chance:0.001},
            {item_name: "断剑", chance:0.05},
            {item_name: "润灵铜骨", chance:0.5},
            //应为9X
        ],
    });
    enemy_templates["地刺"] = new Enemy({
        name: "Earth Spike",
        description: "A spiky Fluffy lurking in the shadows. It lost its capture skill - but then again, all Magical Creatures here have capture skills.",
        xp_value: 233, 
        rank: 1409,
        image: "image/enemy/E1409.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 6300, attack: 2400, agility: 1080, attack_speed: 1.2, defense: 1200}, 
        loot_list: [

            {item_name: "高级黄宝石", chance:0.04},
            {item_name: "高级蓝宝石", chance:0.02},
            {item_name: "巨型眼球", chance:0.06},
            {item_name: "A1·能量核心", chance:0.02},
            //应为9X
        ],
    });
    enemy_templates["探险者亡魂"] = new Enemy({
        name: "Explorer's Vengeful Spirit",
        description: "Going dark makes you ten times stronger, going clean makes you thirty percent weaker. And here you can see the former in action~",
        xp_value: 233, 
        rank: 1410,
        image: "image/enemy/E1410.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [15],
        tags: [],
        stats: {health: 3000, attack: 4000, agility: 1600, attack_speed: 1.2, defense: 1500}, 
        loot_list: [

            {item_name: "高级黄宝石", chance:0.04},
            {item_name: "高级蓝宝石", chance:0.02},
            {item_name: "大地级魂魄", chance:0.225},
            {item_name: "A1·能量核心", chance:0.06},
            //应为9X
            //因为这玩意真的太强了所以翻了三倍
        ],
    });
    enemy_templates["布菇妖"] = new Enemy({
        name: "Cloth Mushroom Fiend",
        description: "Its spores contain a weakening toxin. While its traces have long vanished from the outside world, it spreads freely in the dark Dungeon.",
        xp_value: 233, 
        rank: 1411,
        image: "image/enemy/E1411.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [8],
        spec_value:{8:10},
        tags: [],
        stats: {health: 7000, attack: 2250, agility: 1400, attack_speed: 1.2, defense: 400}, 
        loot_list: [

            {item_name: "高级黄宝石", chance:0.04},
            {item_name: "高级蓝宝石", chance:0.02},
            {item_name: "紫铜锭", chance:0.35},
            {item_name: "毒液", chance:1.0},
            //应为9X
        ],
    });
    enemy_templates["腾风塑像"] = new Enemy({
        name: "Storm Statue",
        description: "Like a true tempest! Swift Wind? A mere crude imitation of this one!",
        xp_value: 233, 
        rank: 1412,
        image: "image/enemy/E1412.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [16],
        tags: [],
        stats: {health: 2800, attack: 1800, agility: 1600, attack_speed: 1.2, defense: 1000}, 
        loot_list: [

            {item_name: "高级黄宝石", chance:0.04},
            {item_name: "高级蓝宝石", chance:0.02},
            {item_name: "断剑", chance:0.06},
            {item_name: "A1·能量核心", chance:0.02},
            //应为9X
        ],
    });
    enemy_templates["出芽黄茸茸"] = new Enemy({
        name: "Budding Yellow Fluffy",
        description: "A noble-blooded Yellow Fluffy - sprouting a bud means entering Earth Rank. Of course, the 99.8% of Yellow Fluffies who died won't have any complaints about that.",
        xp_value: 233, 
        rank: 1413,
        image: "image/enemy/E1413.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [0],
        tags: [],
        stats: {health: 4200, attack: 800, agility: 1500, attack_speed: 1.2, defense: 800}, 
        loot_list: [

            {item_name: "高级黄宝石", chance:0.04},
            {item_name: "高级蓝宝石", chance:0.02},
            {item_name: "A1·能量核心", chance:0.06},
            //应为9X
        ],
    });
    enemy_templates["大地级卫戍"] = new Enemy({
        name: "Earth Rank Garrison",
        description: "I was once the Wall of Sighs here, until Sayuki discovered that an extra 0 had been added to the def value..",
        xp_value: 377, 
        rank: 1414,
        image: "image/enemy/E1414.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 2</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 5500, attack: 3360, agility: 1800, attack_speed: 1.2, defense: 1280}, 
        loot_list: [
            {item_name: "高级蓝宝石", chance:0.04},
            {item_name: "高级红宝石", chance:0.005},
            {item_name: "地宫金属锭", chance:0.03},
            //应为16X
        ],
    });
    //1-5
    enemy_templates["地宫看门人"] = new Enemy({
        name: "Dungeon Gatekeeper",
        description: "You can't escape now.. but it isn't that strong anymore!",
        xp_value: 987, 
        rank: 1501,
        image: "image/enemy/E1501.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 3</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 27000, attack: 7500, agility: 6000, attack_speed: 1.2, defense: 3750}, 
        loot_list: [
            {item_name: "高级红宝石", chance:0.04},
            {item_name: "高级绿宝石", chance:0.005},
            {item_name: "A1·能量核心", chance:0.2},
            {item_name: "黑色刀币", chance:0.05},
            //应为50X
        ],
    });
    enemy_templates["行走树妖"] = new Enemy({
        name: "Walking Tree Fiend",
        description: "The hurricane mechanic makes it not much easier to deal with than the Boss version...",
        xp_value: 377, 
        rank: 1502,
        image: "image/enemy/E1502.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 2</b></span>",
        size: "small",
        spec: [16],
        tags: [],
        stats: {health: 13500, attack:2900, agility: 3000, attack_speed: 1.2, defense: 1800}, 
        loot_list: [
            {item_name: "高级蓝宝石", chance:0.04},
            {item_name: "高级红宝石", chance:0.005},
            {item_name: "A1·能量核心", chance:0.12},
            //应为16X
        ],
    });
    enemy_templates["深邃之影"] = new Enemy({
        name: "Abyssal Shadow",
        description: "An Elite Wild Beast from the upper layers, overflowing in abundance at the core",
        xp_value: 377, 
        rank: 1503,
        image: "image/enemy/E1503.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 2</b></span>",
        size: "small",
        spec: [17],
        tags: [],
        stats: {health: 8100, attack:4800, agility: 3000, attack_speed: 1.2, defense: 2000}, 
        loot_list: [
            {item_name: "高级蓝宝石", chance:0.04},
            {item_name: "高级红宝石", chance:0.005},
            {item_name: "流动凝胶", chance:0.03},
            //应为16X
        ],
    });
    enemy_templates["抽丝鬼"] = new Enemy({
        name: "Silk-Drawing Ghost",
        description: "An evolved ghost from the Dungeon. Like all ghost-type Magical Creatures, its body is fragile but its attacks are devastating.",
        xp_value: 377, 
        rank: 1504,
        image: "image/enemy/E1504.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 2</b></span>",
        size: "small",
        spec: [6,7],
        tags: [],
        stats: {health: 3750, attack:5000, agility: 3600, attack_speed: 1.2, defense: 900}, 
        loot_list: [
            {item_name: "高级蓝宝石", chance:0.04},
            {item_name: "高级红宝石", chance:0.005},
            {item_name: "大地级魂魄", chance:0.20},
            //应为16X
        ],
    });
    enemy_templates["燕岗堕落狩士"] = new Enemy({
        name: "Yangang Fallen Hunter",
        description: "An Earth Rank hunter who has fallen into madness. He became stronger, but at what cost?",
        xp_value: 377, 
        rank: 1505,
        image: "image/enemy/E1505.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 2</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 3000, attack:5500, agility: 4200, attack_speed: 1.2, defense: 3000}, 
        loot_list: [
            {item_name: "高级蓝宝石", chance:0.04},
            {item_name: "高级红宝石", chance:0.005},
            {item_name: "断剑", chance:0.25},
            //应为16X
        ],
    });
    enemy_templates["二极蝠"] = new Enemy({
        name: "Bipolar Bat",
        description: "Fusing ice and flame within itself, it has gained synchronized power. At least it doesn't steal agility...",
        xp_value: 610, 
        rank: 1506,
        image: "image/enemy/E1506.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 2 +</b></span>",
        size: "small",
        spec: [19],
        tags: [],
        stats: {health: 22200, attack:4800, agility: 3750, attack_speed: 1.2, defense: 1000}, 
        loot_list: [
            {item_name: "高级蓝宝石", chance:0.03},
            {item_name: "高级红宝石", chance:0.02},
            {item_name: "霜炙皮草", chance:0.05},
            {item_name: "大地级魂魄", chance:0.10},
            //应为28X
        ],
    });
    enemy_templates["凶戾骨将"] = new Enemy({
        name: "Ferocious Bone General",
        description: "Hey hey, attack check point! The Explorer's Vengeful Spirit bug will never happen again~",
        xp_value: 987, 
        rank: 1507,
        image: "image/enemy/E1507.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 3</b></span>",
        size: "small",
        spec: [12],
        tags: [],
        stats: {health: 8450, attack:8880, agility: 6000, attack_speed: 1.2, defense: 4440}, 
        loot_list: [
            {item_name: "高级红宝石", chance:0.04},
            {item_name: "高级绿宝石", chance:0.005},
            {item_name: "A1·能量核心", chance:0.2},
            {item_name: "大地级魂魄", chance:0.3},
            //应为50X
        ],
    });
    enemy_templates["武装绿毛茸茸"] = new Enemy({
        name: "Armed Green Fluffy",
        description: "As a higher-tier Fluffy, it needs to reach the third stage before it can form a bud. However, the Dungeon metal it stole is quite good!",
        xp_value: 610, 
        rank: 1508,
        image: "image/enemy/E1508.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 2 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 8900, attack:6000, agility: 4800, attack_speed: 1.2, defense: 2400}, 
        loot_list: [
            {item_name: "高级蓝宝石", chance:0.03},
            {item_name: "高级红宝石", chance:0.02},
            {item_name: "流动凝胶", chance:0.04},
            {item_name: "地宫金属锭", chance:0.04},
            //应为28X
        ],
    });
    enemy_templates["二阶荒兽"] = new Enemy({
        name: "Stage Two Wild Beast",
        description: "At last - an edible Wild Beast appears in the Dungeon! The Heaven Sword is nothing against its paltry 3400 attack.",
        xp_value: 610, 
        rank: 1509,
        image: "image/enemy/E1509.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 2 +</b></span>",
        size: "small",
        spec: [20],
        tags: [],
        stats: {health: 10500, attack:3400, agility: 4800, attack_speed: 1.2, defense: 2600}, 
        loot_list: [
            {item_name: "高级蓝宝石", chance:0.03},
            {item_name: "高级红宝石", chance:0.02},
            {item_name: "地宫·荒兽肉块", chance:0.09},
            {item_name: "巨型眼球", chance:0.10},
            //应为28X
        ],
    });
    enemy_templates["地下岩火"] = new Enemy({
        name: "Underground Magma Flame",
        description: "How come it doesn't have Time Seal? Did the Stage Three Skeleton snatch it away?",
        xp_value: 610, 
        rank: 1510,
        image: "image/enemy/E1510.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 2 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 1080, attack:16000, agility: 5400, attack_speed: 1.2, defense: 4000}, 
        loot_list: [
            {item_name: "高级蓝宝石", chance:0.03},
            {item_name: "高级红宝石", chance:0.02},
            {item_name: "大地级魂魄", chance:0.45},
            //应为28X
        ],
    });
    enemy_templates["初级魔法师"] = new Enemy({
        name: "Novice Mage",
        description: "Of all things to learn, it learned restraint.. Can you guess why it got stuck at Novice level?",
        xp_value: 610, 
        rank: 1511,
        image: "image/enemy/E1511.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 2 +</b></span>",
        size: "small",
        spec: [0,5],
        tags: [],
        stats: {health: 7500, attack:3000, agility: 5500, attack_speed: 1.2, defense: 3000}, 
        loot_list: [
            {item_name: "高级蓝宝石", chance:0.03},
            {item_name: "高级红宝石", chance:0.02},
            {item_name: "霜炙皮草", chance:0.07},
            //应为28X
        ],
    });
    enemy_templates["喵咕哩"] = new Enemy({
        name: "Miaoguli",
        description: "~True God Descends~ Stats and mechanics combined - the spirit body has chased you all the way to this RPG!",
        xp_value: 1587, 
        rank: 1512,
        image: "image/enemy/E1512.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 3 +</b></span>",
        size: "small",
        spec: [21],
        spec_value:{21:8000},
        tags: [],
        stats: {health: 36500, attack:10040, agility: 8000, attack_speed: 1.2, defense: 2333}, 
        loot_list: [
            {item_name: "高级红宝石", chance:0.03},
            {item_name: "高级绿宝石", chance:0.02},
            {item_name: "流动凝胶", chance:0.18},
            //应为89X
        ],
    });
    enemy_templates["颂歌符文"] = new Enemy({
        name: "Anthem Rune",
        description: "It really looks just like an aura monster... yet turns out it isn't.",
        xp_value: 610, 
        rank: 1513,
        image: "image/enemy/E1513.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 2 +</b></span>",
        size: "small",
        spec: [22],
        tags: [],
        stats: {health: 16900, attack:5750, agility: 5750, attack_speed: 1.2, defense: 1800}, 
        loot_list: [
            {item_name: "高级蓝宝石", chance:0.03},
            {item_name: "高级红宝石", chance:0.02},
            {item_name: "A1·能量核心", chance:0.25},
            //应为28X
        ],
    });
    enemy_templates["地宫执法者"] = new Enemy({
        name: "Dungeon Enforcer",
        description: "Seemingly a construct left behind by the Dungeon's master, but its frenzied aura has left it knowing only slaughter",
        xp_value: 987, 
        rank: 1514,
        image: "image/enemy/E1514.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 3</b></span>",
        size: "small",
        spec: [0,23],
        tags: [],
        stats: {health: 9999, attack:6999, agility: 6000, attack_speed: 1.2, defense: 3499}, 
        loot_list: [
            {item_name: "高级红宝石", chance:0.04},
            {item_name: "高级绿宝石", chance:0.005},
            {item_name: "黑色刀币", chance:0.05},
            //应为50X
        ],
    });
    enemy_templates["出芽绿茸茸"] = new Enemy({
        name: "Budding Green Fluffy",
        description: "Natural secret art: Triple Strike! However, activating the secret art seems to drain its life force..",
        xp_value: 987, 
        rank: 1515,
        image: "image/enemy/E1515.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 3</b></span>",
        size: "small",
        spec: [6],
        tags: [],
        stats: {health: 5000, attack:7600, agility: 4800, attack_speed: 1.2, defense: 3800}, 
        loot_list: [
            {item_name: "高级红宝石", chance:0.04},
            {item_name: "高级绿宝石", chance:0.005},
            {item_name: "A1·能量核心", chance:0.1},
            {item_name: "流动凝胶", chance:0.08},
            //应为50X
        ],
    });
    enemy_templates["巨型蜘蛛"] = new Enemy({
        name: "Giant Spider",
        description: "Only two of its legs are strong enough, so it can only do a double strike. The gel it drops is made from spider silk.",
        xp_value: 987, 
        rank: 1516,
        image: "image/enemy/E1516.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 3</b></span>",
        size: "small",
        spec: [3],
        tags: [],
        stats: {health: 8000, attack:9500, agility: 7800, attack_speed: 1.2, defense: 4000}, 
        loot_list: [
            {item_name: "高级红宝石", chance:0.04},
            {item_name: "高级绿宝石", chance:0.005},
            {item_name: "流动凝胶", chance:0.10},
            //应为50X
        ],
    });
    enemy_templates["地穴飞鸟"] = new Enemy({
        name: "Cave Flying Bird",
        description: "A giant bird that endlessly flies around the Dungeon because its pathfinding system broke down.",
        xp_value: 987, 
        rank: 1517,
        image: "image/enemy/E1517.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 3</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 17500, attack:8000, agility: 7200, attack_speed: 1.2, defense: 3500}, 
        loot_list: [
            {item_name: "高级红宝石", chance:0.04},
            {item_name: "高级绿宝石", chance:0.005},
            {item_name: "地宫·荒兽肉块", chance:0.075},
            {item_name: "巨型眼球", chance:0.15},
            {item_name: "霜炙皮草", chance:0.10},
            //应为50X
        ],
    });
    enemy_templates["小势力探险者"] = new Enemy({
        name: "Minor Faction Adventurer",
        description: "He's too poor to buy recovery items. Fortunately, he has an ancestral secret technique that lets him drain an enemy's power as life force.",
        xp_value: 1597, 
        rank: 1518,
        image: "image/enemy/E1518.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 3 +</b></span>",
        size: "small",
        spec: [24,25],
        tags: [],
        stats: {health: 1, attack:15000, agility: 7800, attack_speed: 1.2, defense: 6500}, 
        loot_list: [
            {item_name: "高级红宝石", chance:0.03},
            {item_name: "高级绿宝石", chance:0.01},
            {item_name: "大地级魂魄", chance:1.00},
            //应为89X
        ],
    });
    enemy_templates["踏地荒兽"] = new Enemy({
        name: "Earth-Treading Wild Beast",
        description: "Enormous! Delicious! Even Neko is drooling!",
        xp_value: 1597, 
        rank: 1519,
        image: "image/enemy/E1519.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 3 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 25000, attack:9000, agility: 8400, attack_speed: 1.2, defense: 5000}, 
        loot_list: [
            {item_name: "高级红宝石", chance:0.03},
            {item_name: "高级绿宝石", chance:0.01},
            {item_name: "地宫·荒兽肉块", chance:0.30},
            {item_name: "巨型眼球", chance:0.25},
            //应为89X
        ],
    });
    enemy_templates["扭曲菇菇"] = new Enemy({
        name: "Twisted Mushroom",
        description: "Red cap~ white stalk~ eat it and lie down together~ Wait, it's not even red..",
        xp_value: 1597, 
        rank: 1520,
        image: "image/enemy/E1520.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 3 +</b></span>",
        size: "small",
        spec: [26],
        tags: [],
        stats: {health: 14000, attack:5500, agility: 8000, attack_speed: 1.2, defense: 6500}, 
        loot_list: [
            {item_name: "高级红宝石", chance:0.03},
            {item_name: "高级绿宝石", chance:0.01},
            {item_name: "流动凝胶", chance:0.10},
            {item_name: "霜炙皮草", chance:0.10},
            //应为89X
        ],
    });
    enemy_templates["温热飞蛾"] = new Enemy({
        name: "Warm Moth",
        description: "Appears to be a super-evolved form of the Glowing Moth. It's so hot it's glowing red!",
        xp_value: 1597, 
        rank: 1521,
        image: "image/enemy/E1521.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 3 +</b></span>",
        size: "small",
        spec: [22,27],
        tags: [],
        stats: {health: 14000, attack:5500, agility: 8000, attack_speed: 1.2, defense: 6500}, 
        loot_list: [
            {item_name: "高级红宝石", chance:0.03},
            {item_name: "高级绿宝石", chance:0.01},
            {item_name: "霜炙皮草", chance:0.22},
            //应为89X
        ],
    });
    enemy_templates["苍白之触"] = new Enemy({
        name: "Pallid Touch",
        description: "It absorbed the essence of many wild beasts and adventurers... but all those attributes clashed, and it lost every skill.",
        xp_value: 1597, 
        rank: 1522,
        image: "image/enemy/E1522.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 3 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 6000, attack:13000, agility: 9000, attack_speed: 1.2, defense: 7200}, 
        loot_list: [
            {item_name: "高级红宝石", chance:0.03},
            {item_name: "高级绿宝石", chance:0.01},
            {item_name: "流动凝胶", chance:0.12},
            {item_name: "黑色刀币", chance:0.06},
            //应为89X
        ],
    });
    enemy_templates["燕岗城守卫"] = new Enemy({
        name: "Yangang City Guard",
        description: "Tough, and packs a lot of health. Looks pretty powerful... but toughness fears the elder sister!",
        xp_value: 2584, 
        rank: 1523,
        image: "image/enemy/E1523.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4</b></span>",
        size: "small",
        spec: [1],
        tags: [],
        stats: {health: 32, attack:11111, agility: 10081, attack_speed: 1.2, defense: 0}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.015},
            {item_name: "黑色刀币", chance:0.16},
            //应为160X
        ],
    });

    // 第二幕！！！
    enemy_templates["灵能菇菇"] = new Enemy({
        name: "Psionic Mushroom",
        description: "A mushroom-type wild beast that habitually uses weakening tricks. Works pretty well!",
        xp_value: 2584, 
        rank: 2101,
        image: "image/enemy/E2101.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4</b></span>",
        size: "small",
        spec: [8],
        spec_value:{8:10},
        tags: [],
        stats: {health: 36000, attack:13600, agility: 8000, attack_speed: 1.0, defense: 6400}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.015},
            {item_name: "大地级魂魄", chance:0.5},
            {item_name: "流动凝胶", chance:0.24},
            //应为160X
        ],
    });
    enemy_templates["妖灵飞蛾"] = new Enemy({
        name: "Specter Moth",
        description: "A light green moth from the Wild Beast Forest. Contrary to popular belief, green does not mean poisonous.",
        xp_value: 2584, 
        rank: 2102,
        image: "image/enemy/E2102.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 16000, attack:14000, agility: 8400, attack_speed: 1.3, defense: 7000}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.015},
            {item_name: "荒兽精华", chance:0.08},
            
            {item_name: "大地级魂魄", chance:0.5},
            //应为160X
        ],
    });
    enemy_templates["飞叶级魔法师"] = new Enemy({
        name: "Soaring Leaf Rank Mage",
        description: "A Novice Mage that broke free of all restraints and became more than twice as powerful.",
        xp_value: 2584, 
        rank: 2103,
        image: "image/enemy/E2103.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4</b></span>",
        size: "small",
        spec: [0],
        tags: [],
        stats: {health: 23000, attack:8000, agility: 8000, attack_speed: 1.3, defense: 8000}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.015},
            {item_name: "黑色刀币", chance:0.08},
            {item_name: "A4·能量核心", chance:0.08},
            //应为160X
        ],
    });
    enemy_templates["血洛箭手"] = new Enemy({
        name: "Xuelo Archer",
        description: "The damage from its arrows is a bit underwhelming, but its melee is way too strong...",
        xp_value: 2584, 
        rank: 2104,
        image: "image/enemy/E2104.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4</b></span>",
        size: "small",
        spec: [29],
        spec_value:{29:1000},
        tags: [],
        stats: {health: 9900, attack:70000, agility: 9000, attack_speed: 1.0, defense: 7000}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.015},
            {item_name: "黑色刀币", chance:0.03},
            {item_name: "甲壳碎片", chance:0.10},
            //应为160X
        ],
    });
    enemy_templates["有角一族"] = new Enemy({
        name: "Horned Tribe",
        description: "A wild beast that seems far stronger than the others nearby. Its charging horns let it deal damage in two hits!",
        xp_value: 4181, 
        rank: 2105,
        image: "image/enemy/E2105.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4 +</b></span>",
        size: "small",
        spec: [10],
        tags: [],
        stats: {health: 105000, attack:25000, agility: 12800, attack_speed: 1.1, defense: 10000}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.05},
            {item_name: "极品黄宝石", chance:0.02},
            {item_name: "甲壳碎片", chance:0.10},
            {item_name: "荒兽精华", chance:0.10},
            //应为280X
        ],
    });
    enemy_templates["噬血术傀儡"] = new Enemy({
        name: "Blood-Devouring Golem",
        description: "Still steaming! The Dungeon Rancher is still steaming! (Note: basic attack multipliers deal extra damage to armored enemies)",
        xp_value: 2584, 
        rank: 2106,
        image: "image/enemy/E2106.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4</b></span>",
        size: "small",
        spec: [1],
        tags: [],
        stats: {health: 15, attack:16000, agility: 10000, attack_speed: 1.1, defense: 0}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.015},
            {item_name: "A4·能量核心", chance:0.18},
            //应为160X
        ],
    });
    enemy_templates["司雍世界行者"] = new Enemy({
        name: "Siyong World Wanderer",
        description: "Surprisingly, people from other domains have also come to the Wild Beast Forest for training. What a popular place.",
        xp_value: 2584, 
        rank: 2107,
        image: "image/enemy/E2107.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 55000, attack:14000, agility: 10500, attack_speed: 1.2, defense: 9000}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.015},
            {item_name: "黑色刀币", chance:0.04},
            {item_name: "甲壳碎片", chance:0.08},
            
            //应为160X
        ],
    });
    enemy_templates["密林大鸟"] = new Enemy({
        name: "Deep Forest Giant Bird",
        description: "A Cave Flying Bird that evolved after crawling out of the Dungeon. The pathfinding system has been repaired!",
        xp_value: 2584, 
        rank: 2108,
        image: "image/enemy/E2108.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4</b></span>",
        size: "small",
        spec: [6],
        tags: [],
        stats: {health: 72000, attack:17000, agility: 11000, attack_speed: 1.3, defense: 3000}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.015},
            {item_name: "森林·荒兽肉块", chance:0.10},
            {item_name: "大地级魂魄", chance:0.5},
            
            //应为160X
        ],
    });
    enemy_templates["地龙幼崽"] = new Enemy({
        name: "Earth Dragon Hatchling",
        description: "An Earth Dragon hatchling with fairly pure bloodline. Compared to this one, the one inside Yangang City is at best a big snake!",
        xp_value: 2584, 
        rank: 2109,
        image: "image/enemy/E2109.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 45000, attack:19000, agility: 11000, attack_speed: 1.1, defense: 11000}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.015},
            {item_name: "森林·荒兽肉块", chance:0.06},
            {item_name: "荒兽精华", chance:0.06},
            //应为160X
        ],
    });
    enemy_templates["人立茸茸"] = new Enemy({
        name: "Upright Fluffy",
        description: "The Budding Green Fluffy's evolution path stalled at the third tier of the Earth Rank. So it resolutely decided to grow arms and legs...",
        xp_value: 4181, 
        rank: 2110,
        image: "image/enemy/E2110.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4 +</b></span>",
        size: "small",
        spec: [26],
        tags: [],
        stats: {health: 37000, attack:9100, agility: 11500, attack_speed: 1.2, defense: 10900}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.05},
            {item_name: "极品黄宝石", chance:0.02},
            {item_name: "流动凝胶", chance:0.20},
            {item_name: "A4·能量核心", chance:0.20},
            
            //应为280X
        ],
    });
    enemy_templates["草木蜘蛛"] = new Enemy({
        name: "Woodland Spider",
        description: "A spider that can recover health during battle. Without the turn-doubling restriction, it's even more troublesome.",
        xp_value: 4181, 
        rank: 2111,
        image: "image/enemy/E2111.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4 +</b></span>",
        size: "small",
        spec: [30,31],
        spec_value: {30:0.5},
        tags: [],
        stats: {health: 120000, attack:18500, agility: 12000, attack_speed: 0.9, defense: 3300}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.05},
            {item_name: "极品黄宝石", chance:0.02},
            {item_name: "荒兽精华", chance:0.15},
            {item_name: "大地级魂魄", chance:0.50},
            
            //应为280X
        ],
    });
    enemy_templates["持盾荒兽"] = new Enemy({
        name: "Shield-Bearing Wild Beast",
        description: "Wild beasts on the Xuelo Continent aren't like monsters on Earth — they usually don't gain full intelligence until the Sky Rank. This one... maybe it mutated?",
        xp_value: 4181, 
        rank: 2112,
        image: "image/enemy/E2112.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 15000, attack:28000, agility: 12500, attack_speed: 1.2, defense: 14000}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.05},
            {item_name: "极品黄宝石", chance:0.02},
            {item_name: "甲壳碎片", chance:0.20},
            //应为280X
        ],
    });
    enemy_templates["芊叶蝠"] = new Enemy({
        name: "Qianye Bat",
        description: "Qianye - Yqian - Qianye... wordplay jokes are so last season!",
        xp_value: 4181, 
        rank: 2113,
        image: "image/enemy/E2113.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 60000, attack:33000, agility: 13500, attack_speed: 1.2, defense: 11000}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.05},
            {item_name: "极品黄宝石", chance:0.02},
            {item_name: "荒兽精华", chance:0.10},
            {item_name: "A4·能量核心", chance:0.15},
            
            //应为280X
        ],
    });
    enemy_templates["深林妖偶"] = new Enemy({
        name: "Deep Forest Puppet",
        description: "A puppet that escaped the Dungeon in the same batch as the Cave Flying Bird and the Novice Mage. Sadly, it still clings to its restraint ability.",
        xp_value: 4181, 
        rank: 2114,
        image: "image/enemy/E2114.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4 +</b></span>",
        size: "small",
        spec: [5],
        tags: [],
        stats: {health: 80000, attack:30000, agility: 12500, attack_speed: 1.2, defense: 9000}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.05},
            {item_name: "极品黄宝石", chance:0.02},
            {item_name: "流动凝胶", chance:0.50},
            {item_name: "甲壳碎片", chance:0.20},
            //应为280X
        ],
    });
    enemy_templates["银杖茸茸"] = new Enemy({
        name: "Silver Staff Fluffy",
        description: "A Fluffy that chose to study magic when faced with the fourth-tier bottleneck. But the magic is just way too weak!",
        xp_value: 4181, 
        rank: 2115,
        image: "image/enemy/E2115.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 4 +</b></span>",
        size: "small",
        spec: [0],
        tags: [],
        stats: {health: 25000, attack:4000, agility: 13500, attack_speed: 1.2, defense: 16000}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.05},
            {item_name: "极品黄宝石", chance:0.02},
            {item_name: "A4·能量核心", chance:0.30},
            {item_name: "甲壳碎片", chance:0.05},
            //应为280X
        ],
    });
    enemy_templates["小门派执事"] = new Enemy({
        name: "Minor Sect Steward",
        description: "Were the remnants of the Blood Kill Hall really wiped out...? Why does this steward look like a wild beast?",
        xp_value: 7575, 
        rank: 2116,
        image: "image/enemy/E2116.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5</b></span>",
        size: "small",
        spec: [5,7],
        tags: [],
        stats: {health: 135000, attack:49000, agility: 14500, attack_speed: 1.2, defense: 7500}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.02},
            {item_name: "极品黄宝石", chance:0.05},
            {item_name: "黑色刀币", chance:0.40},
            {item_name: "大地级魂魄", chance:1.0},
            
            //应为500X
        ],
    });
    enemy_templates["哥布林战士"] = new Enemy({
        name: "Goblin Warrior",
        description: "A goblin with remarkably thick hide and tough flesh. Would be even better if it weren't so easy to hit.",
        xp_value: 7575, 
        rank: 2117,
        image: "image/enemy/E2117.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 180000, attack:32000, agility: 10500, attack_speed: 1.2, defense: 10000}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.02},
            {item_name: "极品黄宝石", chance:0.05},
            {item_name: "森林·荒兽肉块", chance:0.40},
            {item_name: "甲壳碎片", chance:0.10},
            //应为500X
        ],
    });
    enemy_templates["刺猬精"] = new Enemy({
        name: "Hedgehog Fiend",
        description: "At least it doesn't have thorns damage. Just looking at it makes your hands feel prickly.",
        xp_value: 7575, 
        rank: 2118,
        image: "image/enemy/E2118.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5</b></span>",
        size: "small",
        spec: [20],
        tags: [],
        stats: {health: 72000, attack:20000, agility: 15000, attack_speed: 1.2, defense: 16000}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.02},
            {item_name: "极品黄宝石", chance:0.05},
            {item_name: "甲壳碎片", chance:0.40},
            //应为500X
        ],
    });
    enemy_templates["毒枭蝎"] = new Enemy({
        name: "Venom Lord Scorpion",
        description: "The normal approach would be to use a pickaxe to go around it... unfortunately, a pickaxe can't break forest terrain in an RPG.",
        xp_value: 7575, 
        rank: 2119,
        image: "image/enemy/E2119.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5</b></span>",
        size: "small",
        spec: [16,22],
        tags: [],
        stats: {health: 216000, attack:36000, agility: 15000, attack_speed: 1.2, defense: 15000}, 
        loot_list: [
            {item_name: "高级绿宝石", chance:0.02},
            {item_name: "极品黄宝石", chance:0.05},
            {item_name: "甲壳碎片", chance:0.20},
            {item_name: "荒兽精华", chance:0.20},
            //应为500X
        ],
    });
//2-2
    enemy_templates["百家近卫"] = new Enemy({
        name: "Hundred Clans Guard",
        description: "The relentless Bai Fang left many Hundred Clans spies along the riverside. But they have no will to fight — who risks their life for 3000X a month?",
        xp_value: 7575, 
        rank: 2201,
        image: "image/enemy/E2201.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5</b></span>",
        size: "small",
        spec: [3],
        tags: [],
        stats: {health: 200000, attack:44000, agility: 24000, attack_speed: 1.2, defense: 22000}, 
        loot_list: [
            {item_name: "极品黄宝石", chance:0.05},
            {item_name: "极品蓝宝石", chance:0.01},
            {item_name: "甲壳碎片", chance:0.40},
            //应为500X
        ],
    });
    enemy_templates["怨灵船夫"] = new Enemy({
        name: "Wraith Ferryman",
        description: "Setting everything else aside — looking like that, who would dare get on your boat?!",
        xp_value: 7575, 
        rank: 2202,
        image: "image/enemy/E2202.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5</b></span>",
        size: "small",
        spec: [19],
        tags: [],
        stats: {health: 250000, attack:40000, agility: 22000, attack_speed: 1.2, defense: 16000}, 
        loot_list: [
            {item_name: "极品黄宝石", chance:0.05},
            {item_name: "极品蓝宝石", chance:0.01},
            {item_name: "A4·能量核心", chance:0.50},
            //应为500X
        ],
    });
    enemy_templates["旱魃龟"] = new Enemy({
        name: "Drought Demon Turtle",
        description: "In one timeline, it burrowed into the upper Dungeon and conspired with the Floral Spirit Array, making Neko's life miserable. Fortunately, here it simply stays put beside the river.",
        xp_value: 7575, 
        rank: 2203,
        image: "image/enemy/E2203.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5</b></span>",
        size: "small",
        spec: [1],
        tags: [],
        stats: {health: 10, attack:45000, agility: 20000, attack_speed: 1.2, defense: 0}, 
        loot_list: [
            {item_name: "极品黄宝石", chance:0.05},
            {item_name: "极品蓝宝石", chance:0.01},
            {item_name: "甲壳碎片", chance:0.20},
            {item_name: "水溶精华", chance:0.05},
            //应为500X
        ],
    });
    enemy_templates["复苏骸骨"] = new Enemy({
        name: "Revived Skeleton",
        description: "Spirit-Gathering~ Soul-Gathering~ Entwined~ Revived. The Xuelo Continent has so much ambient energy, even bones can become powerful!",
        xp_value: 10496, 
        rank: 2204,
        image: "image/enemy/E2204.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5 +</b></span>",
        size: "small",
        spec: [24,25],
        tags: [],
        stats: {health: 100000, attack:61000, agility: 32000, attack_speed: 1.2, defense: 19000}, 
        loot_list: [
            {item_name: "极品黄宝石", chance:0.03},
            {item_name: "极品蓝宝石", chance:0.03},
            {item_name: "水溶精华", chance:0.10},
            {item_name: "荒兽精华", chance:0.30},
            //应为900X
        ],
    });
    enemy_templates["旅行魔术师"] = new Enemy({
        name: "Traveling Magician",
        description: "Performing shows everywhere pays far better than weeding in the Dungeon! With a heavenly sword, who needs a lousy skill like Formation Slash?",
        xp_value: 10496, 
        rank: 2205,
        image: "image/enemy/E2205.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5 +</b></span>",
        size: "small",
        spec: [20],
        tags: [],
        stats: {health: 100000, attack:33000, agility: 32000, attack_speed: 1.0, defense: 12000}, 
        loot_list: [
            {item_name: "极品黄宝石", chance:0.03},
            {item_name: "极品蓝宝石", chance:0.03},
            {item_name: "A4·能量核心", chance:0.50},
            {item_name: "活化柳木", chance:0.20},
            //应为900X
        ],
    });
    enemy_templates["水溶茸茸"] = new Enemy({
        name: "Water-Dissolving Fluffy",
        description: "An aura-type Fluffy that seems to have taken a wrong turn. Its buff effect is only half that of the Spirit Vine Fluffy. Its only distinguishing feature is that it can lurk in water, making it hard to catch.",
        xp_value: 10496, 
        rank: 2206,
        image: "image/enemy/E2206.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5 +</b></span>",
        size: "small",
        spec: [11],
        tags: [],
        stats: {health: 150000, attack:45000, agility: 36000, attack_speed: 1.2, defense: 30000}, 
        loot_list: [
            {item_name: "极品黄宝石", chance:0.03},
            {item_name: "极品蓝宝石", chance:0.03},
            {item_name: "水溶精华", chance:0.20},
            //应为900X
        ],
    });
    enemy_templates["飞龙幼崽"] = new Enemy({
        name: "Wyvern Hatchling",
        description: "Compared to the Earth Dragon Hatchling, it additionally has the ability to breathe fire in the air. Before the Sky Rank, flight is the ultimate symbol of power!",
        xp_value: 10496, 
        rank: 2207,
        image: "image/enemy/E2207.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5 +</b></span>",
        size: "small",
        spec: [22],
        tags: [],
        stats: {health: 90000, attack:70000, agility: 36000, attack_speed: 1.2, defense: 25000}, 
        loot_list: [
            {item_name: "极品黄宝石", chance:0.03},
            {item_name: "极品蓝宝石", chance:0.03},
            {item_name: "森林·荒兽肉块", chance:0.50},
            {item_name: "A4·能量核心", chance:0.50},
            //应为900X
        ],
    });
    enemy_templates["鲜红八爪鱼"] = new Enemy({
        name: "Crimson Octopus",
        description: "Why is there an octopus on land... After crawling up, its movements are clumsy, it can't combo, and it's not fast either. Best to go back to the river.",
        xp_value: 10496, 
        rank: 2208,
        image: "image/enemy/E2208.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 81000, attack:80000, agility: 24000, attack_speed: 0.9, defense: 22500}, 
        loot_list: [
            {item_name: "极品黄宝石", chance:0.03},
            {item_name: "极品蓝宝石", chance:0.03},
            {item_name: "荒兽精华", chance:0.30},
            {item_name: "水溶精华", chance:0.10},
            //应为900X
        ],
    });
    enemy_templates["商船水手"] = new Enemy({
        name: "Merchant Ship Sailor",
        description: "Every seasoned sailor by the river has a few tricks up their sleeve. Zhuge Repeating Crossbow, engage... though it only fires three bolts.",
        xp_value: 10496, 
        rank: 2209,
        image: "image/enemy/E2209.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5 +</b></span>",
        size: "small",
        spec: [4],
        tags: [],
        stats: {health: 120000, attack:81000, agility: 36000, attack_speed: 1.2, defense: 27000}, 
        loot_list: [
            {item_name: "极品黄宝石", chance:0.03},
            {item_name: "极品蓝宝石", chance:0.03},
            {item_name: "活化柳木", chance:0.20},
            {item_name: "一捆黑币", chance:0.04},
            //应为900X
        ],
    });
    enemy_templates["深水恐怖"] = new Enemy({
        name: "Deep Water Terror",
        description: "Oh no! It's the Grand Illusion! Quick, use the Aqua Heart Shield!... Oh, it's not that one. Just a measly 10000 Domain~",
        xp_value: 10496, 
        rank: 2210,
        image: "image/enemy/E2210.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5 +</b></span>",
        size: "small",
        spec: [35],
        spec_value:{35:10000},
        tags: [],
        stats: {health: 140000, attack:66500, agility: 40000, attack_speed: 1.2, defense: 33500}, 
        loot_list: [
            {item_name: "极品黄宝石", chance:0.03},
            {item_name: "极品蓝宝石", chance:0.03},
            {item_name: "A4·能量核心", chance:0.50},
            {item_name: "水溶精华", chance:0.10},
            //应为900X
        ],
    });
    enemy_templates["礁石灵"] = new Enemy({
        name: "Reef Spirit",
        description: "So evil — an armored enemy with base defense... For that reason, the 0.1% magic attack was removed!",
        xp_value: 17711, 
        rank: 2211,
        image: "image/enemy/E2211.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6</b></span>",
        size: "small",
        spec: [1],
        tags: [],
        stats: {health: 20, attack:88000, agility: 54000, attack_speed: 1.0, defense: 55000}, 
        loot_list: [
            {item_name: "极品蓝宝石", chance:0.05},
            {item_name: "极品红宝石", chance:0.02},
            {item_name: "水溶精华", chance:0.15},
            {item_name: "甲壳碎片", chance:1.00},
            //应为1.6Z
        ],
    });
    enemy_templates["火烧云"] = new Enemy({
        name: "Burning Cloud",
        description: "A cloud-type monster that grins with malicious intent. Its attack capability is astonishing.",
        xp_value: 17711, 
        rank: 2212,
        image: "image/enemy/E2212.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6</b></span>",
        size: "small",
        spec: [33],
        spec_value:{33:6},
        tags: [],
        stats: {health: 220000, attack:94000, agility: 50000, attack_speed: 0.8, defense: 45000}, 
        loot_list: [
            {item_name: "极品蓝宝石", chance:0.05},
            {item_name: "极品红宝石", chance:0.02},
            {item_name: "荒兽精华", chance:0.50},
            {item_name: "A4·能量核心", chance:0.75},
            
            //应为1.6Z
        ],
    });
    enemy_templates["Traveling Merchant"] = new Enemy({
        name: "Traveling Merchant",
        description: "Seems to be the leader of those sailors from before. He's also opened a shop nearby... worth a visit~",
        xp_value: 17711, 
        rank: 2213,
        image: "image/enemy/E2213.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 440000, attack:110000, agility: 54000, attack_speed: 1.2, defense: 45000}, 
        loot_list: [
            {item_name: "极品蓝宝石", chance:0.05},
            {item_name: "极品红宝石", chance:0.02},
            {item_name: "活化柳木", chance:0.30},
            {item_name: "一捆黑币", chance:0.09},
            //应为1.6Z
        ],
    });
    enemy_templates["马里奥菇菇"] = new Enemy({
        name: "Mario Mushroom",
        description: "Doesn't look as strong as the ones before... wait a moment? How much debuff does it stack?",
        xp_value: 17711, 
        rank: 2214,
        image: "image/enemy/E2214.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6</b></span>",
        size: "small",
        spec: [8],
        spec_value:{8:50},
        tags: [],
        stats: {health: 240000, attack:135000, agility: 36000, attack_speed: 1.2, defense: 20000}, 
        loot_list: [
            {item_name: "极品蓝宝石", chance:0.05},
            {item_name: "极品红宝石", chance:0.02},
            {item_name: "水溶精华", chance:0.32},
            //应为1.6Z
        ],
    });
    enemy_templates["清野江盗匪"] = new Enemy({
        name: "Qingye River Bandit",
        description: "Years of picking on the weak have left it far less powerful than wild beasts, monsters, or humans of the same rank. Still, it can push around fifth-tier sailors.",
        xp_value: 17711, 
        rank: 2215,
        image: "image/enemy/E2215.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6</b></span>",
        size: "small",
        spec: [26],
        tags: [],
        stats: {health: 88000, attack:90000, agility: 48000, attack_speed: 1.2, defense: 30000}, 
        loot_list: [
            {item_name: "极品蓝宝石", chance:0.05},
            {item_name: "极品红宝石", chance:0.02},
            {item_name: "甲壳碎片", chance:0.80},
            {item_name: "黑色刀币", chance:0.60},
            //应为1.6Z
        ],
    });
    enemy_templates["极冰火"] = new Enemy({
        name: "Extreme Ice Flame",
        description: "A monster that appears to have inverted a self-destruct spell. If the HP exchange ratio exceeds 4:1, the single HP left after self-destruction is not a bad way to scavenge loot.",
        xp_value: 17711, 
        rank: 2216,
        image: "image/enemy/E2216.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6</b></span>",
        size: "small",
        spec: [36],
        tags: [],
        stats: {health: 810000, attack:108000, agility: 48000, attack_speed: 1.2, defense: 36000}, 
        loot_list: [
            {item_name: "极品蓝宝石", chance:0.05},
            {item_name: "极品红宝石", chance:0.02},
            {item_name: "水溶精华", chance:0.20},
            {item_name: "荒兽精华", chance:0.30},
            //应为1.6Z
        ],
    });
    enemy_templates["清野江窃贼"] = new Enemy({
        name: "Qingye River Thief",
        description: "The ships he steals are worth far more than the ones bandits rob. Through years of practice, he has honed an incredibly agile fighting style!",
        xp_value: 17711, 
        rank: 2217,
        image: "image/enemy/E2217.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 250000, attack:105000, agility: 72000, attack_speed: 1.3, defense: 21000}, 
        loot_list: [
            {item_name: "极品蓝宝石", chance:0.05},
            {item_name: "极品红宝石", chance:0.02},
            {item_name: "活化柳木", chance:0.30},
            {item_name: "A4·能量核心", chance:0.75},
            //应为1.6Z
        ],
    });

    //2-3
    
    enemy_templates["大门派杂役"] = new Enemy({
        name: "Major Sect Handyman",
        description: "Why would the Na Family's secret realm be open to other sects... Perhaps the Na Family disciples aren't enough to explore such a vast realm?",
        xp_value: 17711, 
        rank: 2301,
        image: "image/enemy/E2301.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6</b></span>",
        size: "small",
        spec: [32,6],
        spec_value:{},
        tags: [],
        stats: {health: 390000, attack:125000, agility: 60000, attack_speed: 1.2, defense: 15000}, 
        loot_list: [
            {item_name: "极品蓝宝石", chance:0.05},
            {item_name: "极品红宝石", chance:0.02},
            {item_name: "A4·能量核心", chance:0.40},
            {item_name: "秘境芦苇", chance:0.05},
            //1.6Z
        ],
    });
    enemy_templates["燕岗高等散修"] = new Enemy({
        name: "Yangang High-Rank Rogue Cultivator",
        description: "Even rogue cultivators showed up! Seems the realm's opening is some kind of once-every-half-year grand event...",
        xp_value: 17711, 
        rank: 2302,
        image: "image/enemy/E2302.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 370000, attack:124000, agility: 64000, attack_speed: 1.2, defense: 54000}, 
        loot_list: [
            {item_name: "极品蓝宝石", chance:0.05},
            {item_name: "极品红宝石", chance:0.02},
            {item_name: "秘境芦苇", chance:0.07},
            //1.6Z
        ],
    });
    enemy_templates["高歌骸骨"] = new Enemy({
        name: "Singing Skeleton",
        description: "The next evolutionary stage of the skeleton after Revived. Rather than the brute approach of dual-wielding, it chose to equip shield and armor.",
        xp_value: 28657, 
        rank: 2303,
        image: "image/enemy/E2303.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 225000, attack:155000, agility: 72000, attack_speed: 1.2, defense: 60000}, 
        loot_list: [
            {item_name: "极品蓝宝石", chance:0.03},
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "甲壳碎片", chance:0.80},
            {item_name: "浅蓝晶粉", chance:0.04},
            //2.8Z
        ],
    });
    enemy_templates["微花灵阵"] = new Enemy({
        name: "Floral Spirit Array",
        description: "A mechanism inside the secret realm that enhances the power of wild beasts and monsters. It has no attack capability, but can only be shattered once your power reaches a certain threshold. (Or magic attack)",
        xp_value: 28657, 
        rank: 2304,
        image: "image/enemy/E2304.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 1, attack:1, agility: 1, attack_speed: 0.1, defense: 100000}, 
        loot_list: [
            {item_name: "极品蓝宝石", chance:0.03},
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "浅蓝晶粉", chance:0.09},
            //2.8Z
        ],
    });
     enemy_templates["灵慧石人"] = new Enemy({
        name: "Spirit-Wise Stone Golem",
        description: "A red-eyed monster with reversal ability. Its HP is a bit fragile, but high defense compensates for that.",
        xp_value: 28657, 
        rank: 2305,
        image: "image/enemy/E2305.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6 +</b></span>",
        size: "small",
        spec: [9],
        spec_value:{},
        tags: [],
        stats: {health: 75000, attack:150000, agility: 80000, attack_speed: 1.3, defense: 88000}, 
        loot_list: [
            {item_name: "极品蓝宝石", chance:0.03},
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "水溶精华", chance:0.3},
            {item_name: "秘境芦苇", chance:0.05},
            //2.8Z
        ],
    });
    enemy_templates["纳家探宝者"] = new Enemy({
        name: "Na Family Treasure Hunter",
        description: "Dang, it's a rival! Why does everyone else get to enter right at the level cap...",
        xp_value: 28657, 
        rank: 2306,
        image: "image/enemy/E2306.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6 +</b></span>",
        size: "small",
        spec: [3],
        spec_value:{},
        tags: [],
        stats: {health: 150000, attack:141000, agility: 88000, attack_speed: 1.2, defense: 66000}, 
        loot_list: [
            {item_name: "极品蓝宝石", chance:0.03},
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "秘境芦苇", chance:0.05},
            {item_name: "浅蓝晶粉", chance:0.05},
            //2.8Z
        ],
    });
    enemy_templates["秘境蝎龙"] = new Enemy({
        name: "Secret Realm Scorpion Dragon",
        description: "Appears to be a hybrid of the Venom Lord Scorpion and the Earth Dragon. That night, they weren't drunk — it's just unbearably long to wait half a year for the realm to open again.",
        xp_value: 28657, 
        rank: 2307,
        image: "image/enemy/E2307.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 64000, attack:480000, agility: 96000, attack_speed: 1.5, defense: 80000}, 
        loot_list: [
            {item_name: "极品蓝宝石", chance:0.03},
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "甲壳碎片", chance:0.5},
            {item_name: "A4·能量核心", chance:0.5},
            {item_name: "浅蓝晶粉", chance:0.05},
            //2.8Z
        ],
    });
    enemy_templates["荒兽法兵"] = new Enemy({
        name: "Wild Beast Mage Soldier",
        description: "A powerful magic-wielding wild beast. Its endless vitality combined with Scattered Blossom mastery makes it exceptionally troublesome.",
        xp_value: 28657, 
        rank: 2308,
        image: "image/enemy/E2308.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6 +</b></span>",
        size: "small",
        spec: [19,37],
        spec_value:{},
        tags: [],
        stats: {health: 1090000, attack:160000, agility: 91600, attack_speed: 1.2, defense: 50000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "水溶精华", chance:0.2},
            {item_name: "浅蓝晶粉", chance:0.09},
            //2.8Z
        ],
    });
    enemy_templates["巨人先锋"] = new Enemy({
        name: "Giant Vanguard",
        description: "185,000 attack, 20-hit combo, 40% aura... The depths of the secret realm are destined to be full of hardship.",
        xp_value: 28657, 
        rank: 2309,
        image: "image/enemy/E2309.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6 +</b></span>",
        size: "small",
        spec: [16],
        spec_value:{},
        tags: [],
        stats: {health: 327000, attack:185000, agility: 108000, attack_speed: 0.8, defense: 77000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "秘境芦苇", chance:0.15},
            //2.8Z
        ],
    });
    //2-4
    
    enemy_templates["威武武士"] = new Enemy({
        name: "Majestic Warrior",
        description: "A luckless enemy exiled to 2-2 because of its poor defense. Remember to go back for the fly... the Flawless Green Gem!",
        xp_value: 46368,  
        rank: 2401,
        image: "image/enemy/E2401.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 750000, attack:370000, agility: 150000, attack_speed: 1.2, defense: 30000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "极品绿宝石", chance:0.02},
            {item_name: "蓝金碎片", chance:0.05},
            {item_name: "秘境芦苇", chance:0.05},
            //5.0Z
        ],
    });
    enemy_templates["七阶卫戍"] = new Enemy({
        name: "Seventh-Tier Garrison",
        description: "Guardian of the Boundary Lake. However, just as the patriarch feared, adventurers have swarmed in.",
        xp_value: 46368, 
        rank: 2402,
        image: "image/enemy/E2402.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 390000, attack:260000, agility: 160000, attack_speed: 1.2, defense: 130000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "极品绿宝石", chance:0.02},
            {item_name: "A7·能量核心", chance:0.08},
            //5.0Z
        ],
    });
    enemy_templates["秘境帕芙之灵"] = new Enemy({
        name: "Secret Realm Paf Spirit",
        description: "A \"Spirit\" that naturally grew within the Boundary Lake. After accumulating energy for years, it has reached the seventh tier of the Earth Rank.",
        xp_value: 46368, 
        rank: 2403,
        image: "image/enemy/E2403.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7</b></span>",
        size: "small",
        spec: [0],
        spec_value:{},
        tags: [],
        stats: {health: 280000, attack:140000, agility: 168000, attack_speed: 1.2, defense: 140000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "极品绿宝石", chance:0.02},
            {item_name: "A7·能量核心", chance:0.08},
            //5.0Z
        ],
    });
    enemy_templates["秘境猬精"] = new Enemy({
        name: "Secret Realm Hedgehog Fiend",
        description: "A Hedgehog Fiend that became translucent from preying on Spirits. It ran all the way from the Wild Beast Forest — quite the journey.",
        xp_value: 46368, 
        rank: 2404,
        image: "image/enemy/E2404.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7</b></span>",
        size: "small",
        spec: [20],
        spec_value:{},
        tags: [],
        stats: {health: 600000, attack:200000, agility: 152000, attack_speed: 1.2, defense: 90000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "极品绿宝石", chance:0.02},
            {item_name: "浅蓝晶粉", chance:0.07},
            {item_name: "透明水晶", chance:0.03},
            //5.0Z
        ],
    }); 
    enemy_templates["秘境心火精灵"] = new Enemy({
        name: "Secret Realm Heart Flame Sprite",
        description: "Actually, the one from before was the strongest of this tribe. All the others were cast into the Boundary Lake as exiles...",
        xp_value: 46368, 
        rank: 2405,
        image: "image/enemy/E2405.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7</b></span>",
        size: "small",
        spec: [27,13],
        spec_value:{},
        tags: [],
        stats: {health: 320000, attack:280000, agility: 144000, attack_speed: 1.2, defense: 120000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "极品绿宝石", chance:0.02},
            {item_name: "秘境芦苇", chance:0.10},
            {item_name: "透明水晶", chance:0.03},
            //5.0Z
        ],
    });
    enemy_templates["纳家冰雪亲卫"] = new Enemy({
        name: "Na Family Ice and Snow Royal Guard",
        description: "A fairy guard that has obtained the power of [9]. If you don't deal with it quickly, there will be big trouble.",
        xp_value: 46368, 
        rank: 2406,
        image: "image/enemy/E2406.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7</b></span>",
        size: "small",
        spec: [38],
        spec_value:{},
        tags: [],
        stats: {health: 990000, attack:350000, agility: 180000, attack_speed: 1.6, defense: 75000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "极品绿宝石", chance:0.02},
            {item_name: "蓝金碎片", chance:0.05},
            {item_name: "A7·能量核心", chance:0.03},
            //5.0Z
        ],
    });
    enemy_templates["有甲有角族"] = new Enemy({
        name: "Armored Horned Tribe",
        description: "Why did the Horned Tribe and the Hundred Clans guards get drunk too... People can't — or at least shouldn't!",
        xp_value: 46368, 
        rank: 2407,
        image: "image/enemy/E2407.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7</b></span>",
        size: "small",
        spec: [38],
        spec_value:{},
        tags: [],
        stats: {health: 520000, attack:280000, agility: 180000, attack_speed: 1.2, defense: 150000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "极品绿宝石", chance:0.02},
            {item_name: "蓝金碎片", chance:0.07},
            //5.0Z
        ],
    });
    enemy_templates["水晶傀儡"] = new Enemy({
        name: "Crystal Golem",
        description: "A form where the secret realm's \"Spirit\" possesses a rock. Slightly harder than the Reef Spirit.",
        xp_value: 46368, 
        rank: 2408,
        image: "image/enemy/E2408.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7</b></span>",
        size: "small",
        spec: [1],
        spec_value:{},
        tags: [],
        stats: {health: 30, attack:250000, agility: 160000, attack_speed: 1.2, defense: 180000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "极品绿宝石", chance:0.02},
            {item_name: "透明水晶", chance:0.06},
            //5.0Z
        ],
    });
    enemy_templates["原力刀客"] = new Enemy({
        name: "Force Swordsman",
        description: "A swordsman who wields ordinary weapons as if they were psychic weapons. Known in the martial world as the 14th reserve member of the Thirteen Axes.",
        xp_value: 46368, 
        rank: 2409,
        image: "image/enemy/E2409.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7</b></span>",
        size: "small",
        spec: [10],
        spec_value:{},
        tags: [],
        stats: {health: 270000, attack:1350000, agility: 200000, attack_speed: 1.2, defense: 0}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "极品绿宝石", chance:0.02},
            {item_name: "蓝金碎片", chance:0.07},
            //5.0Z
        ],
    });
     enemy_templates["秘境胖胖鸟"] = new Enemy({
        name: "Secret Realm Chubby Bird",
        description: "You really can't blame it for learning Restraint. When everyone nearby is a burst-attack player, it's simply too profitable...",
        xp_value: 46368, 
        rank: 2410,
        image: "image/enemy/E2410.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7</b></span>",
        size: "small",
        spec: [5],
        spec_value:{},
        tags: [],
        stats: {health: 720000, attack:360000, agility: 210000, attack_speed: 1.2, defense: 180000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "极品绿宝石", chance:0.02},
            {item_name: "结界湖血肉", chance:0.05},
            //5.0Z
        ],
    });
    enemy_templates["人立金茸茸"] = new Enemy({
        name: "Upright Gold Fluffy",
        description: "A Fluffy that switched evolution paths halfway through. The end of this road is the second tier of the Sky Rank, but the secret realm's energy is already running thin.",
        xp_value: 46368, 
        rank: 2411,
        image: "image/enemy/E2411.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7</b></span>",
        size: "small",
        spec: [26],
        spec_value:{},
        tags: [],
        stats: {health: 700000, attack:220000, agility: 220000, attack_speed: 1.2, defense: 120000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.05},
            {item_name: "极品绿宝石", chance:0.02},
            {item_name: "A7·能量核心", chance:0.08},
            //5.0Z
        ],
    });
    enemy_templates["喵咕咕哩"] = new Enemy({
        name: "Miaoguguli",
        description: "A Slime variant that lacks base stats but can deal tons of damage through its spiritual body. (Not quite that many tons though)",
        xp_value: 75025, 
        rank: 2412,
        image: "image/enemy/E2412.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7 +</b></span>",
        size: "small",
        spec: [21],
        spec_value:{21:360000},
        tags: [],
        stats: {health: 2400000, attack:1, agility: 240000, attack_speed: 1.2, defense: 1}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.03},
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "A7·能量核心", chance:0.08},
            {item_name: "结界湖血肉", chance:0.04},
            //9.0Z
        ],
    });
    enemy_templates["秘境滋生魔"] = new Enemy({
        name: "Secret Realm Proliferation Fiend",
        description: "The Temporal Seal one has arrived... its hide is so fragile! Basic attack multipliers really are a great thing.",
        xp_value: 75025, 
        rank: 2413,
        image: "image/enemy/E2413.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7 +</b></span>",
        size: "small",
        spec: [12],
        spec_value:{},
        tags: [],
        stats: {health: 300000, attack:300000, agility: 240000, attack_speed: 1.2, defense: 200000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.03},
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "A7·能量核心", chance:0.08},
            {item_name: "蓝金碎片", chance:0.06},
            //9.0Z
        ],
    });
    enemy_templates["蓝帽行者"] = new Enemy({
        name: "Blue Hat Wanderer",
        description: "A massive HP tank. Even Restraint can't curb its outrageous damage trades.",
        xp_value: 75025, 
        rank: 2414,
        image: "image/enemy/E2414.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7 +</b></span>",
        size: "small",
        spec: [3,5],
        spec_value:{},
        tags: [],
        stats: {health: 15000000, attack:400000, agility: 250000, attack_speed: 1.2, defense: 40000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.03},
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "A7·能量核心", chance:0.13},
            //9.0Z
        ],
    });
    enemy_templates["流云级魔法师"] = new Enemy({
        name: "Drifting Cloud Rank Mage",
        description: "A mage in the secret realm. Not only did it skip learning Restraint, it learned combo attacks — right on the mark...",
        xp_value: 75025, 
        rank: 2415,
        image: "image/enemy/E2415.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7 +</b></span>",
        size: "small",
        spec: [0,6],
        spec_value:{},
        tags: [],
        stats: {health: 256000, attack:80000, agility: 260000, attack_speed: 1.2, defense: 240000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.03},
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "透明水晶", chance:0.12},
            //9.0Z
        ],
    });
    enemy_templates["威武异衣士"] = new Enemy({
        name: "Majestic Strange-Robed Warrior",
        description: "All it took was changing its outfit and it got this strong! So the green clothes and black-red shield from before were really that useless...",
        xp_value: 75025, 
        rank: 2416,
        image: "image/enemy/E2416.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 2200000, attack:560000, agility: 270000, attack_speed: 1.2, defense: 90000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.03},
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "蓝金碎片", chance:0.05},
            {item_name: "蓝金锭", chance:0.015},
            //9.0Z
        ],
    });
    enemy_templates["雪魅蝠"] = new Enemy({
        name: "Snow Specter Bat",
        description: "Despite looking like a poison-type wild beast, it counter-intuitively has the ability to heal itself.",
        xp_value: 75025, 
        rank: 2417,
        image: "image/enemy/E2417.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7 +</b></span>",
        size: "small",
        spec: [31],
        spec_value:{},
        tags: [],
        stats: {health: 650000, attack:420000, agility: 280000, attack_speed: 1.5, defense: 260000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.03},
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "结界湖血肉", chance:0.02},
            {item_name: "A7·能量核心", chance:0.10},
            //9.0Z
        ],
    });
    enemy_templates["大眼八爪鱼"] = new Enemy({
        name: "Big-Eyed Octopus",
        description: "An exceptionally high-defense wild beast. No octopus so far seems to have an 8-hit combo... perhaps simultaneously empowering eight limbs requires too much energy.",
        xp_value: 75025, 
        rank: 2418,
        image: "image/enemy/E2418.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7 +</b></span>",
        size: "small",
        spec: [10],
        spec_value:{},
        tags: [],
        stats: {health: 950000, attack:480000, agility: 300000, attack_speed: 1.2, defense: 300000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.03},
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "结界湖血肉", chance:0.06},
            {item_name: "A7·能量核心", chance:0.04},
            //9.0Z
        ],
    });
    enemy_templates["废墟猎兵"] = new Enemy({
        name: "Ruin Hunter",
        description: "An ordinary ruins adventurer. The competition here has gotten so fierce that only late-stage Earth Rank cultivators can enter.",
        xp_value: 75025, 
        rank: 2501,
        image: "image/enemy/E2501.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7 +</b></span>",
        size: "small",
        spec: [3],
        spec_value:{},
        tags: [],
        stats: {health: 1750000, attack:490000, agility: 330000, attack_speed: 1.4, defense: 290000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.03},
            {item_name: "极品绿宝石", chance:0.05},{item_name: "废墟精华", chance:0.07},
            //9.0Z
        ],
    });
    enemy_templates["废墟菇灵"] = new Enemy({
        name: "Ruin Mushroom Spirit",
        description: "Appears to be a mushroom from Shenghuang City. It inherited the mushroom's trademark poison magic, yet it's surprisingly greedy?",
        xp_value: 75025, 
        rank: 2502,
        image: "image/enemy/E2502.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7 +</b></span>",
        size: "small",
        spec: [8,18],
        spec_value:{8:10,18:2e9},
        tags: [],
        stats: {health: 900000, attack:600000, agility: 360000, attack_speed: 1.2, defense: 333333}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.03},
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "废墟精华", chance:0.07},
            //9.0Z
        ],
    });
    enemy_templates["燕岗城探险者"] = new Enemy({
        name: "Yangang City Adventurer",
        description: "Hey, a fellow local~ Yangang City folk have no particular weakness. Unlike Shenghuang City residents who freeze when they see money, or Lanling City residents obsessed with gems.",
        xp_value: 75025, 
        rank: 2503,
        image: "image/enemy/E2503.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 3000000, attack:700000, agility: 360000, attack_speed: 1.2, defense: 140000}, 
        loot_list: [
            {item_name: "极品红宝石", chance:0.03},
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "绿色刀币", chance:0.01},
            //9.0Z
        ],
    });
    enemy_templates["声律城骸骨"] = new Enemy({
        name: "Shenglu City Skeleton",
        description: "Its bones have been tempered to the [Blue Jade] tier. You could pick them up and use them directly as entwining crystals!",
        xp_value: 121393, 
        rank: 2504,
        image: "image/enemy/E2504.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 6000000, attack:610000, agility: 400000, attack_speed: 1.2, defense: 265000}, 
        loot_list: [
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "殿堂黄宝石", chance:0.02},
            {item_name: "透明水晶", chance:0.1},
            {item_name: "A7·能量核心", chance:0.1},
            //16Z
        ],
    });
    enemy_templates["声律城难民"] = new Enemy({
        name: "Shenglu City Refugee",
        description: "Has a decent set of mechanics, but has been starving for days and its HP is nearly depleted. The Otherworld Gate can't do much in this state.",
        xp_value: 121393, 
        rank: 2505,
        image: "image/enemy/E2505.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8</b></span>",
        size: "small",
        spec: [19,15],
        spec_value:{},
        tags: [],
        stats: {health: 1280000, attack:570000, agility: 390600, attack_speed: 1.6, defense: 34000}, 
        loot_list: [
            {item_name: "绿色刀币", chance:0.01},
            {item_name: "废墟符文", chance:0.04},
            //16Z
        ],
    });
    enemy_templates["锈胎人"] = new Enemy({
        name: "Rust Golem",
        description: "Sad fact: summons don't drop gems or items, only experience.",
        xp_value: 121393, 
        rank: 2506,
        image: "image/enemy/E2506.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8</b></span>",
        size: "small",
        spec: [41,33],
        spec_value:{33:4},
        tags: [],
        stats: {health: 9000000, attack:540000, agility: 480000, attack_speed: 1.2, defense: 0}, 
        loot_list: [
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "殿堂黄宝石", chance:0.02},
            {item_name: "废墟精华", chance:0.07},
            {item_name: "A7·能量核心", chance:0.06},
            //16Z
        ],
    });
    enemy_templates["紫锈胎人"] = new Enemy({
        name: "Purple Rust Golem",
        description: "Ugh, a summon. How does something like this even have that skill...",
        xp_value: 121393, 
        rank: 2506.5,
        image: "image/enemy/E2506a.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8</b></span>",
        size: "small",
        spec: [33],
        spec_value:{33:4},
        tags: [],
        stats: {health: 9000000, attack:540000, agility: 480000, attack_speed: 1.2, defense: 0}, 
        loot_list: [
            //16Z
        ],
    });
    enemy_templates["双棱晶体"] = new Enemy({
        name: "Dual-Edge Crystal",
        description: "No matter how you look at it, it's a reskin of the Bipolar Bat. Red + Green is more striking than Red + Blue.",
        xp_value: 121393, 
        rank: 2507,
        image: "image/enemy/E2507.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 750000, attack:2500000, agility: 520000, attack_speed: 1.2, defense: 480000}, 
        loot_list: [
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "殿堂黄宝石", chance:0.02},
            {item_name: "绿色刀币", chance:0.016},
            //16Z
        ],
    });
    enemy_templates["废墟恐怖"] = new Enemy({
        name: "Ruin Terror",
        description: "Finally, a Domain worth mentioning. If your attack only barely exceeds its defense, you'll take massive reflected damage...",
        xp_value: 121393, 
        rank: 2508,
        image: "image/enemy/E2508.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8</b></span>",
        size: "small",
        spec: [35],
        spec_value:{35:1000000},
        tags: [],
        stats: {health: 2000000, attack:750000, agility: 560000, attack_speed: 1.2, defense: 500000}, 
        loot_list: [
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "殿堂黄宝石", chance:0.02},
            {item_name: "废墟符文", chance:0.06},
            {item_name: "废墟精华", chance:0.07},
            //16Z
        ],
    });
    enemy_templates["兰陵城探险者"] = new Enemy({
        name: "Lanling City Adventurer",
        description: "Lanling City, also known as Blue Zero City. Since Neko RPG has no blue keys, this attribute was changed to fluctuate based on VP!",
        xp_value: 121393, 
        rank: 2509,
        image: "image/enemy/E2509.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8</b></span>",
        size: "small",
        spec: [39],
        spec_value:{39:1500},
        tags: [],
        stats: {health: 3500000, attack:690000, agility: 520000, attack_speed: 1.2, defense: 410000}, 
        loot_list: [
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "殿堂黄宝石", chance:0.02},
            {item_name: "废墟恢复药水", chance:0.01},
            //16Z
        ],
    });
    enemy_templates["猫茸茸"] = new Enemy({
        name: "Cat Fluffy",
        description: "Contrary to popular belief, it has no aura. It must be the Spirit Vine Fluffy and Water-Dissolving Fluffy that gave people the impression that \"all blue Fluffies are aura Fluffies\"!",
        xp_value: 121393, 
        rank: 2510,
        image: "image/enemy/E2510.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8</b></span>",
        size: "small",
        spec: [37],
        spec_value:{},
        tags: [],
        stats: {health: 16000000, attack:720000, agility: 600000, attack_speed: 1.2, defense: 240000}, 
        loot_list: [
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "殿堂黄宝石", chance:0.02},
            {item_name: "废墟精华", chance:0.04},
            {item_name: "A7·能量核心", chance:0.1},//16Z
        ],
    });
    enemy_templates["圣荒城探险者"] = new Enemy({
        name: "Shenghuang City Adventurer",
        description: "Shenghuang City, also known as the Frugal Wealth City. Legends say that even someone as powerful as Hao Huang, a Sky-Soaring Rank powerhouse, is utterly helpless when faced with enough money.",
        xp_value: 121393, 
        rank: 2511,
        image: "image/enemy/E2511.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8</b></span>",
        size: "small",
        spec: [18],
        spec_value:{18:4e9},
        tags: [],
        stats: {health: 7200000, attack:880000, agility: 640000, attack_speed: 1.2, defense: 440000}, 
        loot_list: [
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "殿堂黄宝石", chance:0.02},
            {item_name: "绿色刀币", chance:0.02},//16Z
        ],
    });
    enemy_templates["远古傀儡"] = new Enemy({
        name: "Ancient Golem",
        description: "When the D9 ship crashed, relics from the previous era came crawling out. Its peak was far beyond this, but it's nearly out of power now... only its defense remains formidable.",
        xp_value: 121393, 
        rank: 2512,
        image: "image/enemy/E2512.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 2340000, attack:900000, agility: 680000, attack_speed: 1.2, defense: 600000}, 
        loot_list: [
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "殿堂黄宝石", chance:0.02},
            {item_name: "A7·能量核心", chance:0.17},//16Z
        ],
    });
    enemy_templates["血洛幽灵"] = new Enemy({
        name: "Xuelo Ghost",
        description: "Appears to be the early form of the Ruin Light Chaser. Before learning [Light Chasing], it was just an ordinary shadow-type wild beast.",
        xp_value: 121393, 
        rank: 2513,
        image: "image/enemy/E2513.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 1690000, attack:1270000, agility: 720000, attack_speed: 1.2, defense: 390000}, 
        loot_list: [
            {item_name: "极品绿宝石", chance:0.05},
            {item_name: "殿堂黄宝石", chance:0.02},
            {item_name: "绿色刀币", chance:0.02},//16Z
        ],
    });
    enemy_templates["废墟飞鸟"] = new Enemy({
        name: "Ruin Flying Bird",
        description: "Seriously... even the bird learned Hurricane! The stat inflation of special attributes speaks for itself.",
        xp_value: 196418, 
        rank: 2514,
        image: "image/enemy/E2514.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8 +</b></span>",
        size: "small",
        spec: [16],
        spec_value:{},
        tags: [],
        stats: {health: 6000000, attack:1000000, agility: 760000, attack_speed: 1.2, defense: 500000}, 
        loot_list: [
            {item_name: "极品绿宝石", chance:0.03},
            {item_name: "殿堂黄宝石", chance:0.05},
            {item_name: "废墟精华", chance:0.20},//28Z
        ],
    });
    enemy_templates["兰陵城小队长"] = new Enemy({
        name: "Lanling City Squad Leader",
        description: "It might be unable to damage you due to too much VP, but if you can't damage it either, that damage reduction seems a bit pointless.",
        xp_value: 196418, 
        rank: 2515,
        image: "image/enemy/E2515.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8 +</b></span>",
        size: "small",
        spec: [39],
        spec_value:{39:5000},
        tags: [],
        stats: {health: 6500000, attack:990000, agility: 800000, attack_speed: 1.2, defense: 710000}, 
        loot_list: [
            {item_name: "极品绿宝石", chance:0.03},
            {item_name: "殿堂黄宝石", chance:0.05},
            {item_name: "废墟狂暴药水", chance:0.025},
            {item_name: "绿色刀币", chance:0.02},
            //28Z
        ],
    });
    enemy_templates["伏地精"] = new Enemy({
        name: "Ground Crawler Sprite",
        description: "A glass cannon-type wild beast. Fortunately, the life gate isn't on its back...",
        xp_value: 196418, 
        rank: 2516,
        image: "image/enemy/E2516.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8 +</b></span>",
        size: "small",
        spec: [7],
        spec_value:{},
        tags: [],
        stats: {health: 4800000, attack:1200000, agility: 840000, attack_speed: 1.2, defense: 300000}, 
        loot_list: [
            {item_name: "极品绿宝石", chance:0.03},
            {item_name: "殿堂黄宝石", chance:0.05},
            {item_name: "废墟符文", chance:0.08},
            {item_name: "绿色刀币", chance:0.02},
            //28Z
        ],
    });

    //2-6


    enemy_templates["废墟虫卒"] = new Enemy({
        name: "Ruin Bug Soldier",
        description: "A well-balanced (not really) intelligent wild beast — a grunt on the suburban battlefield.",
        xp_value: 196418, 
        rank: 2601,
        image: "image/enemy/E2601.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 2500000, attack:1080000, agility: 800000, attack_speed: 1.2, defense: 690000}, 
        loot_list: [
            {item_name: "殿堂黄宝石", chance:0.05},
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "战场·荒兽肉块", chance:0.07},
            //28Z
        ],
    });
    enemy_templates["战场亡魂"] = new Enemy({
        name: "Battlefield Vengeful Spirit",
        description: "Appears to be the spirit left behind by a fallen member of the Thirteen Axes. Unrivaled is out of the meta... Hurricane and Light Chasing are the mainstream now.",
        xp_value: 196418, 
        rank: 2602,
        image: "image/enemy/E2602.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8 +</b></span>",
        size: "small",
        spec: [22],
        spec_value:{},
        tags: [],
        stats: {health: 1100000, attack:2100000, agility: 880000, attack_speed: 1.8, defense: 0}, 
        loot_list: [
            {item_name: "殿堂黄宝石", chance:0.05},
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "高能凝胶", chance:0.17},
            //28Z
        ],
    });
    enemy_templates["废墟追风者"] = new Enemy({
        name: "Ruin Wind Chaser",
        description: "Light element is quite scarce on the dark battlefield outside the city. The wind element mastery is slightly inferior, but it'll have to do.",
        xp_value: 196418, 
        rank: 2603,
        image: "image/enemy/E2603.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8 +</b></span>",
        size: "small",
        spec: [16],
        spec_value:{},
        tags: [],
        stats: {health: 10200000, attack:1600000, agility: 960000, attack_speed: 1.2, defense: 520000}, 
        loot_list: [
            {item_name: "殿堂黄宝石", chance:0.05},
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "废墟符文", chance:0.1},
            {item_name: "废墟精华", chance:0.1},
            //28Z
        ],
    });
    
    enemy_templates["古寒铁石精"] = new Enemy({
        name: "Ancient Cold Iron Stone Spirit",
        description: "In theory, an essence-grade metal is one full rank higher... but considering iron itself is low-tier, Iron Spirit won't surpass the A9 level.",
        xp_value: 196418, 
        rank: 2604,
        image: "image/enemy/E2604.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8 +</b></span>",
        size: "small",
        spec: [1],
        spec_value:{},
        tags: [],
        stats: {health: 10, attack:1500000, agility: 1040000, attack_speed: 1.2, defense: 1000000}, 
        loot_list: [
            {item_name: "殿堂黄宝石", chance:0.05},
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "铁锭", chance:20},
            {item_name: "精钢锭", chance:10},
            //28Z
        ],
    });
    
    enemy_templates["暗茸茸战士"] = new Enemy({
        name: "Dark Fluffy Warrior",
        description: "A Shadow Fluffy that fought its way through blood and fire. Powerful but lacking in staying power.",
        xp_value: 196418, 
        rank: 2605,
        image: "image/enemy/E2605.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 600000, attack:1440000, agility: 1040000, attack_speed: 1.2, defense: 960000}, 
        loot_list: [
            {item_name: "殿堂黄宝石", chance:0.05},
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "高能凝胶", chance:0.10},
            {item_name: "废墟精华", chance:0.08},
            //28Z
        ],
    });

    
    enemy_templates["魔族潜行者"] = new Enemy({
        name: "Demon Clan Stalker",
        description: "Gotcha~ It appears twice as often as other enemies.",
        xp_value: 196418, 
        rank: 2606,
        image: "image/enemy/E2606.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 4480000, attack:1370000, agility: 1040000, attack_speed: 1.2, defense: 760000}, 
        loot_list: [
            {item_name: "殿堂黄宝石", chance:0.05},
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "高能凝胶", chance:0.10},
            {item_name: "废墟精华", chance:0.20},
            //28Z
        ],
    });

    enemy_templates["圣荒城骑士"] = new Enemy({
        name: "Shenghuang City Knight",
        description: "Shenghuang City people never submit! Unless room and board are included!",
        xp_value: 196418, 
        rank: 2607,
        image: "image/enemy/E2607.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8 +</b></span>",
        size: "small",
        spec: [18],
        spec_value:{18:8e9},
        tags: [],
        stats: {health: 3300000, attack:1360000, agility: 1100000, attack_speed: 1.2, defense: 1040000}, 
        loot_list: [
            {item_name: "殿堂黄宝石", chance:0.05},
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "绿色刀币", chance:0.03},
            //28Z
        ],
    });
    enemy_templates["战场凶残暴徒"] = new Enemy({
        name: "Battlefield Vicious Brute",
        description: "Rather than calling it vicious, it relies on an absolute defense tactic — once it grabs a treasure, it refuses to let go.",
        xp_value: 196418, 
        rank: 2608,
        image: "image/enemy/E2608.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 1450000, attack:1530000, agility: 1200000, attack_speed: 1.2, defense: 1080000}, 
        loot_list: [
            {item_name: "殿堂黄宝石", chance:0.05},
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "高能织料", chance:0.14},
            //28Z
        ],
    });
    enemy_templates["战场复苏骸骨"] = new Enemy({
        name: "Battlefield Revived Skeleton",
        description: "Unlike previous skeletons, it has only a skull left. Although it regained mobility through symbiosis with worms, the large amount of aura it leaks enrages the wild beasts around it.",
        xp_value: 196418, 
        rank: 2609,
        image: "image/enemy/E2609.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 8 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 1240000, attack:1700000, agility: 1200000, attack_speed: 1.2, defense: 800000}, 
        loot_list: [
            {item_name: "殿堂黄宝石", chance:0.05},
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "微花残片", chance:0.15},
            {item_name: "A7·能量核心", chance:0.2},
            //28Z
        ],
    });
    enemy_templates["探险者队长"] = new Enemy({
        name: "Adventurer Captain",
        description: "A squad leader from Yangang City. Has no special weakness, while possessing powerful formation mastery.",
        xp_value: 317811, 
        rank: 2610,
        image: "image/enemy/E2610.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle</b></span>",
        size: "small",
        spec: [42],
        spec_value:{},
        tags: [],
        stats: {health: 11250000, attack:1690000, agility: 1200000, attack_speed: 1.2, defense: 800000}, 
        loot_list: [
            {item_name: "殿堂黄宝石", chance:0.03},
            {item_name: "殿堂蓝宝石", chance:0.05},
            {item_name: "海绿锭", chance:0.06},
            //50Z
        ],
    });
    enemy_templates["废墟荒兽"] = new Enemy({
        name: "Ruin Wild Beast",
        description: "A powerful wild beast at the peak of the Earth Rank. Neko, who has been starving for days, finally has something to eat —.",
        xp_value: 317811, 
        rank: 2611,
        image: "image/enemy/E2611.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle</b></span>",
        size: "small",
        spec: [3],
        spec_value:{},
        tags: [],
        stats: {health: 6250000, attack:1850000, agility: 1200000, attack_speed: 1.2, defense: 750000}, 
        loot_list: [
            {item_name: "殿堂黄宝石", chance:0.03},
            {item_name: "殿堂蓝宝石", chance:0.05},
            {item_name: "战场·荒兽肉块", chance:0.10},
            //50Z
        ],
    });
    enemy_templates["哥布林盾兵"] = new Enemy({
        name: "Goblin Shield Soldier",
        description: "Why do you look just like the one in 2-1? Are you brothers...? Shield soldiers have a lower death rate, so their cultivation can accumulate higher.",
        xp_value: 317811, 
        rank: 2612,
        image: "image/enemy/E2612.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 3300000, attack:1750000, agility: 1280000, attack_speed: 1.2, defense: 1150000}, 
        loot_list: [
            {item_name: "殿堂黄宝石", chance:0.03},
            {item_name: "殿堂蓝宝石", chance:0.05},
            {item_name: "战场·荒兽肉块", chance:0.07},
            {item_name: "废墟精华", chance:0.10},
            //50Z
        ],
    });
    enemy_templates["鎏银幽灵"] = new Enemy({
        name: "Gilded Silver Ghost",
        description: "Flowing Silver Guard... a kindred existence. Fight to the last moment — then slit your own throat and ascend!",
        xp_value: 317811, 
        rank: 2613,
        image: "image/enemy/E2613.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle</b></span>",
        size: "small",
        spec: [16,36],
        spec_value:{},
        tags: [],
        stats: {health: 4000000, attack:1900000, agility: 1360000, attack_speed: 1.2, defense: 1320000}, 
        loot_list: [
            {item_name: "殿堂黄宝石", chance:0.03},
            {item_name: "殿堂蓝宝石", chance:0.05},
            {item_name: "高能凝胶", chance:0.2},
            {item_name: "废墟精华", chance:0.20},
            //50Z
        ],
    });
    enemy_templates["血洛老年修士"] = new Enemy({
        name: "Xuelo Elder Cultivator",
        description: "The prefix is Xuelo, you know. The reason he's not that old is because he spent hundreds of years running across multiple worlds...",
        xp_value: 317811, 
        rank: 2614,
        image: "image/enemy/E2614.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 5600000, attack:1400000, agility: 1200000, attack_speed: 1.2, defense: 880000}, 
        loot_list: [
            {item_name: "殿堂黄宝石", chance:0.03},
            {item_name: "殿堂蓝宝石", chance:0.05},
            {item_name: "废墟精华", chance:0.30},
            {item_name: "A7·能量核心", chance:0.16},
            //50Z
        ],
    });
    enemy_templates["初级卫兵A9"] = new Enemy({
        name: "Junior Guard A9",
        description: "Perhaps the rank should be called Planetary Tier Nine? Scattered Blossom below full HP, unbeatable at full HP.",
        xp_value: 317811, 
        rank: 2701,
        image: "image/enemy/E2701.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle</b></span>",
        size: "small",
        spec: [37],
        spec_value:{},
        tags: [],
        stats: {health: 14400000, attack:3200000, agility: 1600000, attack_speed: 1.2, defense: 1250000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.05},
            {item_name: "殿堂红宝石", chance:0.005},
            {item_name: "重甲残骸", chance:0.09},
            //50Z
        ],
    });
    
    enemy_templates["领域之械A9"] = new Enemy({
        name: "Domain Mechanism A9",
        description: "A quite irritating Domain ability. Its stats are in the same tier as the Ruin Terror — the only silver lining is that Hall-tier gems raised the HP cap.",
        xp_value: 317811, 
        rank: 2702,
        image: "image/enemy/E2702.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle</b></span>",
        size: "small",
        spec: [35],
        spec_value:{35:5000000},
        tags: [],
        stats: {health: 1840000, attack:2900000, agility: 1800000, attack_speed: 1.2, defense: 2000000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.05},
            {item_name: "殿堂红宝石", chance:0.005},
            {item_name: "雷电加护", chance:0.07},
            //50Z
        ],
    });

    
    enemy_templates["荒兽电法兵"] = new Enemy({
        name: "Wild Beast Lightning Mage Soldier",
        description: "At least it lost Scattered Blossom. The secret realm's low-HP harvester is gone for good.....",
        xp_value: 317811, 
        rank: 2703,
        image: "image/enemy/E2703.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle</b></span>",
        size: "small",
        spec: [0],
        spec_value:{},
        tags: [],
        stats: {health: 3750000, attack:1000000, agility: 2000000, attack_speed: 1.2, defense: 1000000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.05},
            {item_name: "殿堂红宝石", chance:0.005},
            {item_name: "雷电加护", chance:0.08},
            //50Z
        ],
    });
    
    enemy_templates["黑桃重工A9"] = new Enemy({
        name: "Spades Heavy Industry A9",
        description: "Heavy Industry series (1/4). Has decent damage output and damage reduction, but its vitality is limited and fragile.",
        xp_value: 317811, 
        rank: 2704,
        image: "image/enemy/E2704.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle</b></span>",
        size: "small",
        spec: [0,23],
        spec_value:{},
        tags: [],
        stats: {health: 5750000, attack:2250000, agility: 2200000, attack_speed: 1.2, defense: 1500000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.05},
            {item_name: "殿堂红宝石", chance:0.005},
            {item_name: "红黑印记", chance:0.06},
            //50Z
        ],
    });

    
    enemy_templates["夹击之械A9"] = new Enemy({
        name: "Pincer Mechanism A9",
        description: "Given that attacks in Neko RPG are conducted in linear infantry formation... flanking is utterly useless!",
        xp_value: 514229, 
        rank: 2705,
        image: "image/enemy/E2705.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 2250000, attack:2800000, agility: 2300000, attack_speed: 1.2, defense: 1600000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.04},
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "雷电加护", chance:0.13},
            //90Z
        ],
    });

    
    enemy_templates["神权十字A9"] = new Enemy({
        name: "Divine Cross A9",
        description: "A perfectly ordinary heavy armored infantry. How did it split into two sets of armor?",
        xp_value: 514229, 
        rank: 2706,
        image: "image/enemy/E2706.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [26],
        spec_value:{},
        tags: [],
        stats: {health: 4100000, attack:1500000, agility: 2400000, attack_speed: 1.2, defense: 1500000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.04},
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "重甲残骸", chance:0.18},
            //90Z
        ],
    });

    
    enemy_templates["梅花重工A9"] = new Enemy({
        name: "Clubs Heavy Industry A9",
        description: "Its specialties are Reversal and... Restraint. With that little defense, it must be a liability...",
        xp_value: 514229, 
        rank: 2707,
        image: "image/enemy/E2707.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [9,5],
        spec_value:{},
        tags: [],
        stats: {health: 28000000, attack:5400000, agility: 2500000, attack_speed: 1.2, defense: 1080000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.04},
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "红黑印记", chance:0.14},
            //90Z
        ],
    });

    enemy_templates["古老符文"] = new Enemy({
        name: "Ancient Rune",
        description: "Huh? Is the one in the Dungeon your relative? You look exactly the same.",
        xp_value: 514229, 
        rank: 2708,
        image: "image/enemy/E2708.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [9],
        spec_value:{},
        tags: [],
        stats: {health: 3600000, attack:3500000, agility: 2600000, attack_speed: 1.2, defense: 1100000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.04},
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "摩羽币", chance:0.07},
            //90Z
        ],
    });

    enemy_templates["生命熔炉A9"] = new Enemy({
        name: "Life Furnace A9",
        description: "The traitor is here. -20% area aura changed to -10% global aura... since area-based effects were too painful to deal with x",
        xp_value: 514229, 
        rank: 2709,
        image: "image/enemy/E2709.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [29],
        spec_value:{29:4000000},
        tags: [],
        stats: {health: 8800000, attack: 4900000, agility: 2700000, attack_speed: 1.2, defense: 1440000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.04},
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "重甲残骸", chance:0.15},
            //90Z
        ],
    });

    
    enemy_templates["高级卫兵B1"] = new Enemy({
        name: "Senior Guard B1",
        description: "A9 and B1 grade lifeforms inside the ship are generally intermingled... sorry, walked onto the wrong set.",
        xp_value: 1346269, 
        rank: 2710,
        image: "image/enemy/E2710.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1</b></span>",
        size: "small",
        spec: [37],
        spec_value:{},
        tags: [],
        stats: {health: 52800000, attack: 4700000, agility: 3600000, attack_speed: 1.2, defense: 2750000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "殿堂红宝石", chance:0.05},
            {item_name: "B1·能量核心", chance:0.15},
            {item_name: "重甲残骸", chance:0.25},
            //500Z
        ],
    });
    enemy_templates["白银之锋A9"] = new Enemy({
        name: "Silver Edge A9",
        description: "What are \"ordinary\" and \"all-in attack\" anyway?",
        xp_value: 514229, 
        rank: 2711,
        image: "image/enemy/E2711.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 700000, attack: 7500000, agility: 3000000, attack_speed: 1.2, defense: 2000000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.04},
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "摩羽币", chance:0.07},
            //90Z
        ],
    });
    enemy_templates["黑铁战士B1"] = new Enemy({
        name: "Black Iron Warrior B1",
        description: "416! 416! 416! I am the ultimate defense killer!",
        xp_value: 1346269, 
        rank: 2712,
        image: "image/enemy/E2712.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 41600000, attack: 4160000, agility: 4160000, attack_speed: 1.2, defense: 4160000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "殿堂红宝石", chance:0.05},
            {item_name: "B1·能量核心", chance:0.15},
            {item_name: "摩羽币", chance:0.05},
            {item_name: "雷电加护", chance:0.4},
            //500Z
        ],
    });
    enemy_templates["持盾战士A9"] = new Enemy({
        name: "Shield Warrior A9",
        description: "No matter how many shields you carry, you'll never be as strong as that Sky Rank guy. Speaking of which, the Dungeon Rancher's 600,000 means nothing here...",
        xp_value: 514229, 
        rank: 2713,
        image: "image/enemy/E2713.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [1],
        spec_value:{},
        tags: [],
        stats: {health: 10, attack: 5000000, agility: 3200000, attack_speed: 1.2, defense: 3000000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.04},
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "重甲残骸", chance:0.18},
            //90Z
        ],
    });
    enemy_templates["血洛游侠"] = new Enemy({
        name: "Xuelo Wandering Hero",
        description: "A dual-natured creature that is part mage, part bat. The bat side seems a bit stronger.",
        xp_value: 1346269, 
        rank: 2714,
        image: "image/enemy/E2714.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1</b></span>",
        size: "small",
        spec: [10],
        spec_value:{},
        tags: [],
        stats: {health: 52800000, attack: 3200000, agility: 3200000, attack_speed: 1.2, defense: 1600000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "殿堂红宝石", chance:0.05},
            {item_name: "摩羽币", chance:0.3},
            //500Z
        ],
    });
    
    enemy_templates["方片重工A9"] = new Enemy({
        name: "Diamonds Heavy Industry A9",
        description: "Heavy Industry series (3/4). The best synergy between two special attributes in the series — feels like it could take on even B1-grade creatures easily!",
        xp_value: 514229, 
        rank: 2715,
        image: "image/enemy/E2715.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [8,40],
        spec_value:{8:10},
        tags: [],
        stats: {health: 4500000, attack: 5000000, agility: 3200000, attack_speed: 1.2, defense: 3000000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.04},
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "红黑印记", chance:0.2},
            {item_name: "雷电加护", chance:0.4},
            //90Z
        ],
    });
    enemy_templates["燕岗狂战傀儡"] = new Enemy({
        name: "Yangang Berserker Golem",
        description: "How can a golem convert damage into life force? Truly an unsolved mystery.",
        xp_value: 1346269, 
        rank: 2716,
        image: "image/enemy/E2716.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1</b></span>",
        size: "small",
        spec: [7,24],
        spec_value:{},
        tags: [],
        stats: {health: 2600000, attack: 4100000, agility: 3200000, attack_speed: 1.2, defense: 1900000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "殿堂红宝石", chance:0.05},
            {item_name: "B1·能量核心", chance:0.2},
            //500Z
        ],
    });
    
    enemy_templates["激光炮塔A9"] = new Enemy({
        name: "Laser Turret A9",
        description: "The laser is not a hit-received effect, but an attack effect! Regardless of whether the normal attack hits or not, the laser always hits~",
        xp_value: 514229, 
        rank: 2717,
        image: "image/enemy/E2717.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [43],
        spec_value:{43:2500000},
        tags: [],
        stats: {health: 960000, attack: 3600000, agility: 3400000, attack_speed: 1.2, defense: 2800000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.04},
            {item_name: "雷电加护", chance:0.2},
            //90Z
        ],
    });
    enemy_templates["舰船护卫A9"] = new Enemy({
        name: "Ship Guard A9",
        description: "Looks like Bai Fang somehow got his hands on two of these nearly out-of-power guards. His two are actually quite useful though — they can land a 6-hit combo.",
        xp_value: 514229, 
        rank: 2718,
        image: "image/enemy/E2718.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 19900000, attack: 3300000, agility: 3200000, attack_speed: 1.2, defense: 2330000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.04},
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "重甲残骸", chance:0.2},
            //90Z
        ],
    });
    
    enemy_templates["红桃重工B1"] = new Enemy({
        name: "Hearts Heavy Industry B1",
        description: "The pinnacle of the Heavy Industry series... what? Temporal Seal paired with Drink Shield? Are you kidding? Diamonds is still better.",
        xp_value: 1346269, 
        rank: 2719,
        image: "image/enemy/E2719.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1</b></span>",
        size: "small",
        spec: [12,25],
        spec_value:{},
        tags: [],
        stats: {health: 1, attack: 4800000, agility: 3800000, attack_speed: 1.2, defense: 3000000}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "殿堂红宝石", chance:0.05},
            {item_name: "红黑印记", chance:0.8},
            //500Z
        ],
    });
    
    enemy_templates["塔门战甲B1"] = new Enemy({
        name: "Tower Gate Battle Armor B1",
        description: "Can summon many Ship Weeders. Though it looks a lot like an XP piñata...",
        xp_value: 1346269, 
        rank: 2801,
        image: "image/enemy/E2801.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1</b></span>",
        size: "small",
        spec: [44],
        spec_value:{},
        tags: [],
        stats: {health: 1900e4, attack: 880e4, agility: 400e4, attack_speed: 1.2, defense: 200e4}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "殿堂红宝石", chance:0.05},
            {item_name: "红钢锭", chance:0.2},
            {item_name: "一捆高能凝胶", chance:0.01},
            //500Z
        ],
    });
    enemy_templates["万象天引B1"] = new Enemy({
        name: "Ten Thousand Phenomena Celestial Lure B1",
        description: "Looks like some kind of Aladdin's lamp. But it won't be granting your wishes.",
        xp_value: 1346269, 
        rank: 2802,
        image: "image/enemy/E2802.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 1521e4, attack: 740e4, agility: 420e4, attack_speed: 1.2, defense: 280e4}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "殿堂红宝石", chance:0.05},
            {item_name: "血气升腾药剂", chance:0.1},
            {item_name: "一捆B1·能量核心", chance:0.001},
            //500Z
        ],
    });
     enemy_templates["镭射步兵B1"] = new Enemy({
        name: "Laser Infantry B1",
        description: "As long as you can hit it, you won't take damage from the wicked sniper shot. But doesn't \"laser\" mean laser too...",
        xp_value: 1346269, 
        rank: 2803,
        image: "image/enemy/E2803.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1</b></span>",
        size: "small",
        spec: [29],
        spec_value:{29:10000000},
        tags: [],
        stats: {health: 640e4, attack: 600e4, agility: 400e4, attack_speed: 1.2, defense: 420e4}, 
        loot_list: [
            {item_name: "殿堂蓝宝石", chance:0.02},
            {item_name: "殿堂红宝石", chance:0.05},
            {item_name: "红黑印记", chance:0.2},
            {item_name: "一捆B1·能量核心", chance:0.001},
            //500Z
        ],
    });
    enemy_templates["空间三角B1"] = new Enemy({
        name: "Space Triangle B1",
        description: "Actually just the core enemy. The reason the outer one has so many gems... king of the hill, desu.",
        xp_value: 2178309, 
        rank: 2804,
        image: "image/enemy/E2804.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 1050e4, attack: 650e4, agility: 440e4, attack_speed: 1.2, defense: 350e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.05},
            {item_name: "殿堂绿宝石", chance:0.02},
            {item_name: "摩羽币", chance:0.5},
            {item_name: "一捆高能凝胶", chance:0.006},
            //900Z
        ],
    });
    enemy_templates["舰船除草机B1"] = new Enemy({
        name: "Ship Weeder B1",
        description: "Actually quite tricky, but as long as you have enough wall-breaking pickaxes... I mean Green Blade Coins.",
        xp_value: 2178309, 
        rank: 2805,
        image: "image/enemy/E2805.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [8,18],
        spec_value:{8:10,18:10e9},
        tags: [],
        stats: {health: 529e4, attack: 830e4, agility: 460e4, attack_speed: 1.2, defense: 350e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.05},
            {item_name: "殿堂绿宝石", chance:0.02},
            {item_name: "紫色刀币", chance:0.0009},
            //900Z
        ],
    });
    enemy_templates["异化者B1"] = new Enemy({
        name: "Aberrant B1",
        description: "In the end, Light Chasing got the MVP. Why keep staring at that damage number? It'll corrupt all the effort put into Reversal!",
        xp_value: 2178309, 
        rank: 2806,
        image: "image/enemy/E2806.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [9],
        spec_value:{},
        tags: [],
        stats: {health: 850e4, attack: 770e4, agility: 480e4, attack_speed: 1.2, defense: 380e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.05},
            {item_name: "殿堂绿宝石", chance:0.02},
            {item_name: "血气升腾药剂", chance:0.13},
            {item_name: "一捆高能凝胶", chance:0.03},
            //900Z
        ],
    });
    enemy_templates["核爆能源"] = new Enemy({
        name: "Nuclear Blast Energy",
        description: "A real nuclear explosion couldn't be much worse than this. Speaking of which, should the Thirteen Axes consider recruiting a nuclear bomb?",
        xp_value: 3524578, 
        rank: 2807,
        image: "image/enemy/E2807.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 2</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 5555.5e4, attack: 1111e4, agility: 500e4, attack_speed: 1.2, defense: 0e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "殿堂绿宝石", chance:0.05},
            {item_name: "雷电加护", chance:1},
            {item_name: "一捆B1·能量核心", chance:0.004},
            //1.6D
        ],
    });
    enemy_templates["鲜血之锋B1"] = new Enemy({
        name: "Blood Edge B1",
        description: "What? That much HP? Scattered Blossom? Would anyone believe it's only Sky Tier One? Go fetch the magic-attack Restraint grandmaster, quick!",
        xp_value: 5702887, 
        rank: 2808,
        image: "image/enemy/E2808.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1 +++</b></span>",
        size: "small",
        spec: [37],
        spec_value:{},
        tags: [],
        stats: {health: 81920e4, attack: 1600e4, agility: 600e4, attack_speed: 1.2, defense: 10e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "殿堂绿宝石", chance:0.05},
            {item_name: "血气升腾药剂", chance:0.5},
            //1.6D
        ],
    });
    enemy_templates["剧毒恐怖B1"] = new Enemy({
        name: "Deadly Poison Terror B1",
        description: "Still easier to fight than the one below you. So far no poison has ever rivaled the [Mario Mushroom]...",
        xp_value: 2178309, 
        rank: 2809,
        image: "image/enemy/E2809.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [8],
        spec_value:{8:10},
        tags: [],
        stats: {health: 450e4, attack: 940e4, agility: 540e4, attack_speed: 1.2, defense: 500e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.05},
            {item_name: "殿堂绿宝石", chance:0.02},
            {item_name: "一捆B1·能量核心", chance:0.003},
            //900Z
        ],
    });
    enemy_templates["黄金茸茸"] = new Enemy({
        name: "Golden Fluffy",
        description: "The precious metal Fluffy seems like a solid evolution path. But personally, the back-to-basics [Friendly Fluffy] is the true ultimate form.",
        xp_value: 3524578, 
        rank: 2810,
        image: "image/enemy/E2810.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 2</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 800e4, attack: 900e4, agility: 560e4, attack_speed: 1.2, defense: 240e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "殿堂绿宝石", chance:0.05},
            {item_name: "一捆高能凝胶", chance:0.05},
            //1.6D
        ],
    });
    enemy_templates["银色血眼B1"] = new Enemy({
        name: "Silver Blood Eye B1",
        description: "The long-awaited (?) armored attribute. The trident is made to crack hard rocks like you!",
        xp_value: 2178309, 
        rank: 2811,
        image: "image/enemy/E2811.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [1],
        spec_value:{},
        tags: [],
        stats: {health: 28, attack: 1100e4, agility: 600e4, attack_speed: 1.2, defense: 600e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.05},
            {item_name: "殿堂绿宝石", chance:0.02},
            {item_name: "红钢锭", chance:0.33},
            {item_name: "一捆B1·能量核心", chance:0.001},
            //900Z
        ],
    });
    enemy_templates["光子石像B1"] = new Enemy({
        name: "Photon Stone Statue B1",
        description: "Be wary of anything related to [light]. Sky Tier One and arc's constant 10.6 have become the same tier...",
        xp_value: 5702887, 
        rank: 2812,
        image: "image/enemy/E2812.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1 +++</b></span>",
        size: "small",
        spec: [40],
        spec_value:{},
        tags: [],
        stats: {health: 500e4, attack: 1050e4, agility: 640e4, attack_speed: 1.2, defense: 550e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "殿堂绿宝石", chance:0.05},
            {item_name: "一捆B1·能量核心", chance:0.0025},
            {item_name: "B1·能量核心", chance:0.25},
            {item_name: "A7·能量核心", chance:2.5},
            //1.6D
        ],
    });
    enemy_templates["游走三头蛇"] = new Enemy({
        name: "Roaming Three-Headed Serpent",
        description: "How come it hasn't caused a mechanical short circuit on the ship? The protection work was done very well.",
        xp_value: 3524578, 
        rank: 2813,
        image: "image/enemy/E2813.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 2</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 4400e4, attack: 980e4, agility: 660e4, attack_speed: 1.2, defense: 420e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "殿堂绿宝石", chance:0.05},
            {item_name: "战场·荒兽肉排", chance:1},
            {item_name: "一捆高能凝胶", chance:0.05},
            //1.6D
        ],
    });
    enemy_templates["质子粉碎机B1"] = new Enemy({
        name: "Proton Crusher B1",
        description: "Oh no—— quark confinement has broken down——",
        xp_value: 2178309, 
        rank: 2814,
        image: "image/enemy/E2814.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [7],
        spec_value:{},
        tags: [],
        stats: {health: 1440e4, attack: 960e4, agility: 680e4, attack_speed: 1.2, defense: 500e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.05},
            {item_name: "殿堂绿宝石", chance:0.02},
            {item_name: "雷电加护", chance:1},
            {item_name: "一捆高能凝胶", chance:0.02},
            //900Z
        ],
    });
    enemy_templates["城主府基层"] = new Enemy({
        name: "City Lord Mansion Grunt",
        description: "Not stated explicitly, but the one immune to greed should be Yangang City's City Lord Mansion. Swift Dash is out of the meta... now even Hurricane would be embarrassing to show.",
        xp_value: 3524578, 
        rank: 2815,
        image: "image/enemy/E2815.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 2</b></span>",
        size: "small",
        spec: [4],
        spec_value:{},
        tags: [],
        stats: {health: 422.5e4, attack: 2500e4, agility: 680e4, attack_speed: 1.2, defense: 640e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "殿堂绿宝石", chance:0.05},
            {item_name: "绿色刀币", chance:0.4},
            {item_name: "绿色刀币", chance:0.4},
            {item_name: "绿色刀币", chance:0.4},
            {item_name: "绿色刀币", chance:0.4},
            //1.6D
        ],
    });
    enemy_templates["合金弹头B1"] = new Enemy({
        name: "Alloy Warhead B1",
        description: "How does a warhead have segmented strikes like Sacred Formation?! And it's so incredibly tanky.",
        xp_value: 5702887, 
        rank: 2816,
        image: "image/enemy/E2816.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1 +++</b></span>",
        size: "small",
        spec: [42],
        spec_value:{},
        tags: [],
        stats: {health: 1764e4, attack: 1000e4, agility: 700e4, attack_speed: 1.2, defense: 700e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "殿堂绿宝石", chance:0.05},
            {item_name: "红钢锭", chance:0.2},
            {item_name: "一捆B1·能量核心", chance:0.006},
            //1.6D
        ],
    });
    enemy_templates["深邃之暗B2"] = new Enemy({
        name: "Abyssal Darkness B2",
        description: "Its base stats are tremendously powerful, but thankfully it doesn't have the bizarre masteries that those Tier One specialized robots have.",
        xp_value: 3524578, 
        rank: 2817,
        image: "image/enemy/E2817.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 2</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 7744e4, attack: 1296e4, agility: 720e4, attack_speed: 1.2, defense: 720e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "殿堂绿宝石", chance:0.05},
            {item_name: "一捆B1·能量核心", chance:0.008},
            //1.6D
        ],
    });
    enemy_templates["无面修者"] = new Enemy({
        name: "Faceless Cultivator",
        description: "Curious why there are so few Sky Tier Two enemies? The answer is that the classification among the Beyond-Sky tribes is very strict — many B2-grade ones were classified as B1...",
        xp_value: 5702887, 
        rank: 3101,
        image: "image/enemy/E3101.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 2 +</b></span>",
        spec: [],
        stats: {health: 600e4, attack: 1490e4, agility: 1080e4, attack_speed: 1.2, defense: 900e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "殿堂绿宝石", chance:0.05},
            {item_name: "荒兽凭证", chance:1.0},
            //2.8D
        ],
    });
    enemy_templates["大教掌灯人"] = new Enemy({
        name: "Grand Temple Lamplighter",
        description: "Upon discovering during the beast tide that a large section of the soul lamps at home had gone out, he is now furiously preparing to take revenge on the wild beasts!",
        xp_value: 9227465, 
        rank: 3102,
        image: "image/enemy/E3102.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3</b></span>",
        spec: [],
        stats: {health: 880e4, attack: 1580e4, agility: 1200e4, attack_speed: 1.3, defense: 1080e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.04},
            {item_name: "史诗黄宝石", chance:0.015},
            {item_name: "沼泽兽油", chance:0.1},
            //5D
        ],
    });
    enemy_templates["单眼蝠幼体"] = new Enemy({
        name: "Cyclops Bat Juvenile",
        description: "A bat with a seemingly very robust bloodline — thick-hided and tough-fleshed. But... did something unclean sneak into your innate talent?",
        xp_value: 5702887, 
        rank: 3103,
        image: "image/enemy/E3103.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 2 +</b></span>",
        spec: [5],
        stats: {health: 9025e4, attack: 1680e4, agility: 1200e4, attack_speed: 1.3, defense: 400e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "殿堂绿宝石", chance:0.05},
            {item_name: "沼泽兽油", chance:0.04},
            {item_name: "荒兽凭证", chance:1,ignore_luck:true},
            //2.8D
        ],
    });
    enemy_templates["淳羽家族近卫"] = new Enemy({
        name: "Chunyu Family Guard",
        description: "As the number one family in the Yangang Domain, why use poison? *I won't tell you anything!*",
        xp_value: 5702887, 
        rank: 3104,
        image: "image/enemy/E3104.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 2 +</b></span>",
        spec: [8],
        spec_value: {8:10},
        stats: {health: 350e4, attack: 1850e4, agility: 1320e4, attack_speed: 1.3, defense: 800e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "殿堂绿宝石", chance:0.05},
            {item_name: "紫色刀币", chance:0.001},
            {item_name: "荒兽凭证", chance:1},
            //2.8D
        ],
    });
    enemy_templates["赫尔沼泽野火"] = new Enemy({
        name: "Hel Swamp Wildfire",
        description: "A wild \"Spirit\" that uses fire as its vessel. Its temperature is far less than a nuclear explosion, yet it commands multiple abilities.",
        xp_value: 5702887, 
        rank: 3105,
        image: "image/enemy/E3105.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 2 +</b></span>",
        spec: [23,0],
        spec_value: {8:10},
        stats: {health: 480e4, attack: 1200e4, agility: 1320e4, attack_speed: 1.3, defense: 720e4}, 
        loot_list: [
            {item_name: "殿堂红宝石", chance:0.02},
            {item_name: "殿堂绿宝石", chance:0.05},
            {item_name: "荧光精华", chance:0.04},
            //2.8D
        ],
    });
    enemy_templates["地龙成长期"] = new Enemy({
        name: "Earth Dragon Growth Stage",
        description: "In theory, the Sky Rank is already capable of flight. But its combat style and weight means it won't stay airborne for long.",
        xp_value: 9227465, 
        rank: 3106,
        image: "image/enemy/E3106.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3</b></span>",
        spec: [],
        stats: {health: 2000e4, attack: 1900e4, agility: 1440e4, attack_speed: 1.3, defense: 1225e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.04},
            {item_name: "史诗黄宝石", chance:0.015},
            {item_name: "沼泽·荒兽肉块", chance:0.05},
            {item_name: "荒兽凭证", chance:1,ignore_luck:true},
            //5D
        ],
    });
    enemy_templates["圣荒杀手傀儡"] = new Enemy({
        name: "Shenghuang Killer Golem",
        description: "A golem imported from Shenghuang City. Because it's too dumb, it won't go money-crazy like other Shenghuang City units — but the cost is that it can't tell friend from foe.",
        xp_value: 9227465, 
        rank: 3107,
        image: "image/enemy/E3107.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3</b></span>",
        spec: [10],
        stats: {health: 1900e4, attack: 2100e4, agility: 1440e4, attack_speed: 1.3, defense: 550e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.04},
            {item_name: "史诗黄宝石", chance:0.015},
            {item_name: "一捆B1·能量核心", chance:0.02},
            //5D
        ],
    });
    enemy_templates["小门派供奉"] = new Enemy({
        name: "Minor Sect Retainer",
        description: "A cultivator who joined the suppression operation to face the beast tide threat. You ask about the 3-hit combo? Take a look at that attack speed (laughs)",
        xp_value: 9227465, 
        rank: 3108,
        image: "image/enemy/E3108.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3</b></span>",
        spec: [],
        stats: {health: 3250e4, attack: 1750e4, agility: 1560e4, attack_speed: 3.9, defense: 500e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.04},
            {item_name: "史诗黄宝石", chance:0.015},
            {item_name: "荒兽凭证", chance:2.5},
            //5D
        ],
    });
    enemy_templates["化灵蝶"] = new Enemy({
        name: "Spirit-Transformed Butterfly",
        description: "Floral Spirit Slime? It feels like a complete homophone of that creature.",
        xp_value: 9227465, 
        rank: 3109,
        image: "image/enemy/E3109.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3</b></span>",
        spec: [31],
        stats: {health: 800e4, attack: 2116e4, agility: 1620e4, attack_speed: 1.3, defense: 1100e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.04},
            {item_name: "史诗黄宝石", chance:0.015},
            {item_name: "荒兽凭证", chance:1,ignore_luck:true},
            {item_name: "荧光精华", chance:0.06},
            //5D
        ],
    });
    enemy_templates["沼泽石灵"] = new Enemy({
        name: "Swamp Stone Spirit",
        description: "Is there some kind of stone deity for this era? Why are there armored stone monsters everywhere? Also, many wild beasts have crashed into it and died, so it's covered in oil..",
        xp_value: 9227465, 
        rank: 3110,
        image: "image/enemy/E3110.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3</b></span>",
        spec: [1],
        stats: {health: 20, attack: 2600e4, agility: 1680e4, attack_speed: 1.3, defense: 1300e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.04},
            {item_name: "史诗黄宝石", chance:0.015},
            {item_name: "荒兽凭证", chance:1,ignore_luck:true},
            {item_name: "沼泽兽油", chance:0.1},
            //5D
        ],
    });
    enemy_templates["冈崎猫妖"] = new Enemy({
        name: "Okazaki Cat Fiend",
        description: "Sounds like a cat fiend from District 11. Absolutely plays dirty with surprise attacks!",
        xp_value: 9227465, 
        rank: 3111,
        image: "image/enemy/E3111.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3</b></span>",
        spec: [2],
        stats: {health: 240e4, attack: 9000e4, agility: 1680e4, attack_speed: 1.3, defense: 1500e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.04},
            {item_name: "史诗黄宝石", chance:0.015},
            {item_name: "荒兽凭证", chance:1,ignore_luck:true},
            {item_name: "沼泽·荒兽肉块", chance:0.08},
            //5D
        ],
    });
    enemy_templates["沉陷死者"] = new Enemy({
        name: "Sunken Corpse",
        description: "The 1-4 Explorer's Vengeful Spirit also had the Otherworld Gate. It seems to be some kind of death-related mastery...",
        xp_value: 9227465, 
        rank: 3112,
        image: "image/enemy/E3112.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3</b></span>",
        spec: [15],
        stats: {health: 2000e4, attack: 4000e4, agility: 1800e4, attack_speed: 1.3, defense: 1400e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.04},
            {item_name: "史诗黄宝石", chance:0.015},
            {item_name: "沼泽兽油", chance:0.1},
            //5D
        ],
    });
    enemy_templates["赫尔沼泽飞鼠"] = new Enemy({
        name: "Hel Swamp Flying Rat",
        description: "When a rat takes to the sky, is it still a rat? Or can it already be classified as a flesh-winged bird?",
        xp_value: 14930352, 
        rank: 3113,
        image: "image/enemy/E3113.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3 +</b></span>",
        spec: [],
        stats: {health: 1296e4, attack: 2400e4, agility: 1860e4, attack_speed: 1.3, defense: 1250e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.015},
            {item_name: "史诗黄宝石", chance:0.04},
            {item_name: "荒兽凭证", chance:1,ignore_luck:true},
            {item_name: "沼泽·荒兽肉块", chance:0.12},
            {item_name: "荧光精华", chance:0.04},
            //9D
        ],
    });
    enemy_templates["赫尔沼泽蝠"] = new Enemy({
        name: "Hel Swamp Bat",
        description: "Just imagining the scene of a bat swooping down from the sky clutching a sword... it makes me want to laugh w",
        xp_value: 14930352, 
        rank: 3114,
        image: "image/enemy/E3114.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3 +</b></span>",
        spec: [20],
        stats: {health: 400e4, attack: 2000e4, agility: 1920e4, attack_speed: 1.3, defense: 1350e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.015},
            {item_name: "史诗黄宝石", chance:0.04},
            {item_name: "荒兽凭证", chance:1,ignore_luck:true},
            {item_name: "荧光精华", chance:0.15},
            //9D
        ],
    });
    enemy_templates["不瞑之目"] = new Enemy({
        name: "Unsleeping Eye",
        description: "Staaare~ (Wakaba Mutsumi emote.jpg)",
        xp_value: 14930352, 
        rank: 3115,
        image: "image/enemy/E3115.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3 +</b></span>",
        spec: [19],
        stats: {health: 1849e4, attack: 2600e4, agility: 1780e4, attack_speed: 1.3, defense: 1200e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.015},
            {item_name: "史诗黄宝石", chance:0.04},
            {item_name: "荧光精华", chance:0.16},
            //9D
        ],
    });
    enemy_templates["兰陵天空骑士"] = new Enemy({
        name: "Lanling Sky Knight",
        description: "A Sky Rank knight sounds about as plausible as condensing fighting spirit into a horse. But it seems knight is just a title here~",
        xp_value: 14930352, 
        rank: 3116,
        image: "image/enemy/E3116.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3 +</b></span>",
        spec: [39],
        spec_value: {39:1000e4},
        stats: {health: 1280e4, attack: 2200e4, agility: 2040e4, attack_speed: 1.3, defense: 1681e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.015},
            {item_name: "史诗黄宝石", chance:0.04},
            {item_name: "荒兽凭证", chance:3.2},
            //9D
        ],
    });
    enemy_templates["大教外门弟子"] = new Enemy({
        name: "Grand Temple Outer Disciple",
        description: "What's the relationship between a Temple and a Sect? But a burst-attack-focused temple like this doesn't seem like it'll last long.",
        xp_value: 14930352, 
        rank: 3117,
        image: "image/enemy/E3117.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3 +</b></span>",
        spec: [],
        stats: {health: 300e4, attack: 6600e4, agility: 2100e4, attack_speed: 1.3, defense: 1444e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.015},
            {item_name: "史诗黄宝石", chance:0.04},
            {item_name: "荒兽凭证", chance:4.0},
            //9D
        ],
    });
    enemy_templates["燕岗精英佣兵"] = new Enemy({
        name: "Yangang Elite Mercenary",
        description: "In all martial arts under heaven, only speed is unbreakable. That is the guiding principle of these blade-licking mercenaries. Though they don't seem all that fast.",
        xp_value: 14930352, 
        rank: 3118,
        image: "image/enemy/E3118.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3 +</b></span>",
        spec: [],
        stats: {health: 900e4, attack: 2401e4, agility: 2160e4, attack_speed: 2.7, defense: 1400e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.015},
            {item_name: "史诗黄宝石", chance:0.04},
            {item_name: "荒兽凭证", chance:2.0},
            {item_name: "沼泽兽油", chance:0.1},
            //9D
        ],
    });
    enemy_templates["凌空级魔法师"] = new Enemy({
        name: "Sky-Soaring Rank Mage",
        description: "Balanced stat allocation is indeed the meta answer in some sense. Full defense + magic attack has theoretically higher win rates, but can't adapt to the ever-changing battlefield.",
        xp_value: 14930352, 
        rank: 3119,
        image: "image/enemy/E3119.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3 +</b></span>",
        spec: [],
        stats: {health: 6400e4, attack: 1800e4, agility: 2220e4, attack_speed: 1.2, defense: 1800e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.015},
            {item_name: "史诗黄宝石", chance:0.04},
            {item_name: "一捆B1·能量核心", chance:0.04},
            //9D
        ],
    });
    enemy_templates["飞龙成长期"] = new Enemy({
        name: "Wyvern Growth Stage",
        description: "A dragon whose growth stage was also accelerated by primordial energy radiation. Seems to innately know how to squeeze twice the effect out of a single unit of power.",
        xp_value: 14930352, 
        rank: 3120,
        image: "image/enemy/E3120.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3 +</b></span>",
        spec: [],
        stats: {health: 3844e4, attack: 3000e4, agility: 2222e4, attack_speed: 1.2, defense: 1500e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.015},
            {item_name: "史诗黄宝石", chance:0.04},
            {item_name: "荒兽凭证", chance:1,ignore_luck:true},
            {item_name: "沼泽兽油", chance:0.08},
            {item_name: "沼泽·荒兽肉块", chance:0.08},
            //9D
        ],
    });
    //【LIFE CHANGE】
    // 10%↑
    //
    // 20%↓

    enemy_templates["有角族壮年"] = new Enemy({
        name: "Horned Tribe Adult",
        description: "An evolved version of the Wild Beast Forest enemy. Does a berserker aesthetic really go with that mastery...",
        xp_value: 14930352, 
        rank: 3201,
        image: "image/enemy/E3201.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3 +</b></span>",
        spec: [9],
        stats: {health: 11200e4, attack: 3100e4, agility: 2400e4, attack_speed: 1.3, defense: 1200e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.015},
            {item_name: "史诗黄宝石", chance:0.04},
            {item_name: "天空兽角", chance:0.025},
            //9D
        ],
    });
    
    enemy_templates["黑森异惑之花"] = new Enemy({
        name: "Black Forest Bewildering Flower",
        description: "Sounds like the XOR Flower. Is there an OR Flower or an AND Flower?",
        xp_value: 14930352, 
        rank: 3202,
        image: "image/enemy/E3202.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3 +</b></span>",
        spec: [8],
        spec_value: {8:10},
        stats: {health: 10000e4, attack: 3300e4, agility: 2520e4, attack_speed: 1.3, defense: 1750e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.015},
            {item_name: "史诗黄宝石", chance:0.04},
            {item_name: "荧光精华", chance:0.05},
            {item_name: "黑森叶片", chance:0.01},
            //9D
        ],
    });
    enemy_templates["黑森镔铁战士"] = new Enemy({
        name: "Black Forest Iron Warrior",
        description: "Unfortunately there's no Tower Gate Battle Armor B3 here to summon a whole nest at once. Otherwise it'd be quite a headache.",
        xp_value: 14930352, 
        rank: 3203,
        image: "image/enemy/E3203.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3 +</b></span>",
        spec: [],
        stats: {health: 3864e4, attack: 3750e4, agility: 2640e4, attack_speed: 1.3, defense: 2300e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.015},
            {item_name: "史诗黄宝石", chance:0.04},
            {item_name: "B4·能量核心", chance:0.02},
            {item_name: "黑白枝丫", chance:0.015},
            //9D
        ],
    });
    enemy_templates["黑森骸骨"] = new Enemy({
        name: "Black Forest Skeleton",
        description: "Nothing like any of the previous skeletons in aesthetic. 99^2, 2^12, 7^4... gone mad studying math?",
        xp_value: 14930352, 
        rank: 3204,
        image: "image/enemy/E3204.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 3 +</b></span>",
        spec: [32],
        stats: {health: 1960.2e4, attack: 4096e4, agility: 2662e4, attack_speed: 1.331, defense: 2401e4}, 
        loot_list: [
            {item_name: "殿堂绿宝石", chance:0.015},
            {item_name: "史诗黄宝石", chance:0.04},
            {item_name: "B4·能量核心", chance:0.03},
            //9D
        ],
    });
    enemy_templates["司雍世界骨干"] = new Enemy({
        name: "Siyong World Core Member",
        description: "Honestly I think the one below is more deserving of the title \"backbone\". B4 rank is too low for a position of power, but just right for a monster.",
        xp_value: 24157817, 
        rank: 3205,
        image: "image/enemy/E3205.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4</b></span>",
        spec: [],
        stats: {health: 15000e4, attack: 5000e4, agility: 3276.8e4, attack_speed: 1.3, defense: 2500e4}, 
        loot_list: [
            {item_name: "史诗黄宝石", chance:0.035},
            {item_name: "史诗蓝宝石", chance:0.014},
            {item_name: "黑白枝丫", chance:0.03},
            {item_name: "黑森叶片", chance:0.015},
            //16D
        ],
    });
    enemy_templates["黑森僵尸茸茸"] = new Enemy({
        name: "Black Forest Zombie Fluffy",
        description: "So Fluffies can undergo corpse transformation too! I thought they were the type that would just dissolve when they died...",
        xp_value: 24157817, 
        rank: 3206,
        image: "image/enemy/E3206.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4</b></span>",
        spec: [9],
        stats: {health: 11200e4, attack: 4400e4, agility: 3430e4, attack_speed: 1.3, defense: 2500e4}, 
        loot_list: [
            {item_name: "史诗黄宝石", chance:0.035},
            {item_name: "史诗蓝宝石", chance:0.014},
            {item_name: "荧光精华", chance:0.09},
            {item_name: "B4·能量核心", chance:0.05},
            //16D
        ],
    });
    enemy_templates["黑森猿人战士"] = new Enemy({
        name: "Black Forest Ape Warrior",
        description: "Why is it only humans that can't be made into steaks?",
        xp_value: 24157817, 
        rank: 3207,
        image: "image/enemy/E3207.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4</b></span>",
        spec: [],
        stats: {health: 9000e4, attack: 5400e4, agility: 3600e4, attack_speed: 1.3, defense: 3000e4}, 
        loot_list: [
            {item_name: "史诗黄宝石", chance:0.035},
            {item_name: "史诗蓝宝石", chance:0.014},
            {item_name: "天空兽角", chance:0.04},
            //16D
        ],
    });
    enemy_templates["怨灵探险者"] = new Enemy({
        name: "Wraith Adventurer",
        description: "Even its clothes have faded. How many years has it been drifting in the Qingye River?",
        xp_value: 24157817, 
        rank: 3208,
        image: "image/enemy/E3208.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4</b></span>",
        spec: [47],
        stats: {health: 1e4, attack: 5000e4, agility: 4000e4, attack_speed: 1.6, defense: 3200e4}, 
        loot_list: [
            {item_name: "史诗黄宝石", chance:0.035},
            {item_name: "史诗蓝宝石", chance:0.014},
            {item_name: "黑白枝丫", chance:0.04},
            //16D
        ],
    });
    enemy_templates["兰陵城深骑士"] = new Enemy({
        name: "Lanling City Deep Knight",
        description: "Don't tell me \"Deep Knight\" just means the clothing is darker. Seems like B9-grade [Blue Gold Essence] plating... truly wealthy.",
        xp_value: 24157817, 
        rank: 3209,
        image: "image/enemy/E3209.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4</b></span>",
        spec: [39],
        spec_value:{39:0.8e8},
        stats: {health: 11000e4, attack: 4200e4, agility: 4200e4, attack_speed: 1.2, defense: 2800e4}, 
        loot_list: [
            {item_name: "史诗黄宝石", chance:0.035},
            {item_name: "史诗蓝宝石", chance:0.014},
            {item_name: "秘银锭", chance:0.3},
            //16D
        ],
    });
    enemy_templates["黑森蝎龙"] = new Enemy({
        name: "Black Forest Scorpion Dragon",
        description: "Do you remember the terror of being dominated by that burst-attack Scorpion Dragon deep in the secret realm? From here on, normal enemy HP is doubled!",
        xp_value: 24157817, 
        rank: 3210,
        image: "image/enemy/E3210.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4</b></span>",
        spec: [42],
        stats: {health: 15842e4, attack: 5400e4, agility: 4400e4, attack_speed: 1.2, defense: 2700e4}, 
        loot_list: [
            {item_name: "史诗黄宝石", chance:0.035},
            {item_name: "史诗蓝宝石", chance:0.014},
            {item_name: "黑白枝丫", chance:0.02},
            {item_name: "天空兽角", chance:0.03},
            //16D
        ],
    });

    enemy_templates["黑森猎兵"] = new Enemy({
        name: "Black Forest Hunter",
        description: "Hey, and here comes the burst-attack type~",
        xp_value: 24157817, 
        rank: 3211,
        image: "image/enemy/E3211.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4</b></span>",
        spec: [26],
        stats: {health: 6000e4, attack: 4500e4, agility: 4400e4, attack_speed: 1.4, defense: 3400e4}, 
        loot_list: [
            {item_name: "史诗黄宝石", chance:0.035},
            {item_name: "天空兽角", chance:0.04},
            //16D
        ],
    });
    enemy_templates["石风家族队长"] = new Enemy({
        name: "Shifeng Family Captain",
        description: "To this day we still don't know why the Shifeng Family would put Sky Tier Four and Earth Tier One in the same team. The nouveau riche family's lack of depth is plain to see.",
        xp_value: 39088169, 
        rank: 3212,
        image: "image/enemy/E3212.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4 +</b></span>",
        spec: [],
        stats: {health: 13000e4, attack: 5600e4, agility: 4600e4, attack_speed: 1.3, defense: 3800e4}, 
        loot_list: [
            {item_name: "史诗黄宝石", chance:0.014},
            {item_name: "史诗蓝宝石", chance:0.035},
            {item_name: "紫色刀币", chance:0.03},
            //28D
        ],
    });
    enemy_templates["凶悍树妖"] = new Enemy({
        name: "Ferocious Tree Fiend",
        description: "If there were one of these on the Fog Island, Babata would probably never find a successor.",
        xp_value: 39088169, 
        rank: 3213,
        image: "image/enemy/E3213.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4 +</b></span>",
        spec: [],
        stats: {health: 20000e4, attack: 11000e4, agility: 4800e4, attack_speed: 1.2, defense: 0}, 
        loot_list: [
            {item_name: "史诗黄宝石", chance:0.014},
            {item_name: "史诗蓝宝石", chance:0.035},
            {item_name: "黑森叶片", chance:0.06},
            //28D
        ],
    });
    enemy_templates["人立电法茸茸"] = new Enemy({
        name: "Upright Lightning Mage Fluffy",
        description: "Zzzzap—— Shiny Pikachu (crossed out), descends!",
        xp_value: 39088169, 
        rank: 3214,
        image: "image/enemy/E3214.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4 +</b></span>",
        spec: [0],
        stats: {health: 9600e4, attack: 2200e4, agility: 4800e4, attack_speed: 1.2, defense: 4400e4}, 
        loot_list: [
            {item_name: "史诗黄宝石", chance:0.014},
            {item_name: "史诗蓝宝石", chance:0.035},
            {item_name: "荧光精华", chance:0.2},
            {item_name: "天空兽角", chance:0.05},
            //28D
        ],
    });
    enemy_templates["嫉妒毒虫"] = new Enemy({
        name: "Envious Poison Bug",
        description: "Envy has made the Fluffy unrecognizable. Why do you get a sword hilt made from a ship's reactor?! Waaaaah!",
        xp_value: 39088169, 
        rank: 3215,
        image: "image/enemy/E3215.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4 +</b></span>",
        spec: [20,46],
        stats: {health: 3e8, attack: 6300e4, agility: 5000e4, attack_speed: 1.5, defense: 2800e4}, 
        loot_list: [
            {item_name: "史诗黄宝石", chance:0.014},
            {item_name: "史诗蓝宝石", chance:0.035},
            {item_name: "B4·能量核心", chance:0.05},
            {item_name: "黑白枝丫", chance:0.07},
            //28D
        ],
    });


    enemy_templates["冰原之痕"] = new Enemy({
        name: "Glacial Plain Trace",
        description: "A skeleton born from ice elements — its vitality is remarkably tenacious!",
        xp_value: 39088169, 
        rank: 3301,
        image: "image/enemy/E3301.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4 +</b></span>",
        spec: [],
        stats: {health: 11.552e8, attack: 7225e4, agility: 5400e4, attack_speed: 1.2, defense: 2100e4}, 
        loot_list: [
            {item_name: "史诗蓝宝石", chance:0.030},
            {item_name: "史诗红宝石", chance:0.006},
            {item_name: "多孔冰晶", chance:0.04},
            //28D
        ],
    });
    enemy_templates["出芽茸茸战士"] = new Enemy({
        name: "Budding Fluffy Warrior",
        description: "Didn't expect a sequel~ Neko has tapped less than 1% of the Fluffy's potential.",
        xp_value: 39088169, 
        rank: 3302,
        image: "image/enemy/E3302.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4 +</b></span>",
        spec: [4],
        stats: {health: 2.52e8, attack: 8200e4, agility: 5700e4, attack_speed: 1.4, defense: 4000e4}, 
        loot_list: [
            {item_name: "史诗蓝宝石", chance:0.030},
            {item_name: "史诗红宝石", chance:0.006},
            {item_name: "冰原超流体", chance:0.03},
            //28D
        ],
    });
    enemy_templates["冰原骑士"] = new Enemy({
        name: "Glacial Plain Knight",
        description: "Didn't you know? Scattered Blossom only weakens people when you yourself have enough HP.",
        xp_value: 39088169, 
        rank: 3303,
        image: "image/enemy/E3303.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4 +</b></span>",
        spec: [37],
        stats: {health: 4.232e8, attack: 7900e4, agility: 6000e4, attack_speed: 1.3, defense: 5200e4}, 
        loot_list: [
            {item_name: "史诗蓝宝石", chance:0.030},
            {item_name: "史诗红宝石", chance:0.006},
            {item_name: "光暗枝丫", chance:0.06},
            //28D
        ],
    });
    enemy_templates["冰原近卫"] = new Enemy({
        name: "Glacial Plain Royal Guard",
        description: "The Ice Spike Sword can cut people regardless of how much HP you have. Truly a powerful mastery...",
        xp_value: 39088169, 
        rank: 3304,
        image: "image/enemy/E3304.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4 +</b></span>",
        spec: [48],
        spec_value:{48:80e4},
        stats: {health: 2.16e8, attack: 8600e4, agility: 6300e4, attack_speed: 1.3, defense: 5700e4}, 
        loot_list: [
            {item_name: "史诗蓝宝石", chance:0.030},
            {item_name: "史诗红宝石", chance:0.006},
            {item_name: "B4·能量核心", chance:0.08},
            //28D
        ],
    });
    enemy_templates["天空级死士"] = new Enemy({
        name: "Sky Rank Death Warrior",
        description: "For a death warrior, it doesn't even have self-destruct — all damage-boosting skills... and Heavenly Sword was too hard so it never learned it!",
        xp_value: 39088169, 
        rank: 3305,
        image: "image/enemy/E3305.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4 +</b></span>",
        spec: [3,7],
        stats: {health: 3.362e8, attack: 8100e4, agility: 6600e4, attack_speed: 1.3, defense: 4200e4}, 
        loot_list: [
            {item_name: "史诗蓝宝石", chance:0.030},
            {item_name: "史诗红宝石", chance:0.006},
            {item_name: "B4·能量核心", chance:0.04},
            {item_name: "玄冰果实", chance:0.0005},
            //28D
        ],
    });
    enemy_templates["司雍传道士"] = new Enemy({
        name: "Siyong Missionary",
        description: "Looks exactly like the HP tank from the Boundary Lake, but it's actually a burst-attack type!",
        xp_value: 63245986, 
        rank: 3306,
        image: "image/enemy/E3306.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 5</b></span>",
        spec: [19],
        stats: {health: 6.48e8, attack: 10700e4, agility: 6200e4, attack_speed: 1.3, defense: 5200e4}, 
        loot_list: [
            {item_name: "史诗蓝宝石", chance:0.012},
            {item_name: "史诗红宝石", chance:0.030},
            {item_name: "多孔冰晶", chance:0.06},
            //50D
        ],
    });
    enemy_templates["冰原出芽茸茸"] = new Enemy({
        name: "Glacial Plain Budding Fluffy",
        description: "The missing cyan Budding Fluffy has finally been found! Although it turned itself this color through external means.",
        xp_value: 63245986, 
        rank: 3307,
        image: "image/enemy/E3307.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 5</b></span>",
        spec: [49],
        spec_value: {49:{rnd:200,hp:0.3e8}},
        stats: {health: 3.6e8, attack: 13000e4, agility: 7200e4, attack_speed: 0.9, defense: 5400e4}, 
        loot_list: [
            {item_name: "史诗蓝宝石", chance:0.012},
            {item_name: "史诗红宝石", chance:0.030},
            {item_name: "冰原超流体", chance:0.04},
            //50D
        ],
    });
    enemy_templates["出芽红茸战士"] = new Enemy({
        name: "Budding Red Fluffy Warrior",
        description: "This is the rainbow attack! Fluffy family, move out~",
        xp_value: 63245986, 
        rank: 3308,
        image: "image/enemy/E3308.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 5</b></span>",
        spec: [],
        stats: {health: 1.92e8, attack: 1.98e8, agility: 7800e4, attack_speed: 1.2, defense: 6800e4}, 
        loot_list: [
            {item_name: "史诗蓝宝石", chance:0.012},
            {item_name: "史诗红宝石", chance:0.030},
            {item_name: "冰原超流体", chance:0.05},
            //50D
        ],
    });
    enemy_templates["冰原之空骸"] = new Enemy({
        name: "Glacial Plain Sky Skeleton",
        description: "Looks powerful, and actually isn't weak at all. Taking a 40-hit combo from it would be quite a handful.",
        xp_value: 63245986, 
        rank: 3309,
        image: "image/enemy/E3309.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 5</b></span>",
        spec: [48],
        spec_value: {48:100e4},
        stats: {health: 14.45e8, attack: 9216e4, agility: 8100e4, attack_speed: 1.5, defense: 4900e4}, 
        loot_list: [
            {item_name: "史诗蓝宝石", chance:0.012},
            {item_name: "史诗红宝石", chance:0.030},
            {item_name: "多孔冰晶", chance:0.025},
            {item_name: "玄冰果实", chance:0.001},
            //50D
        ],
    });
    enemy_templates["掠冰之蝠"] = new Enemy({
        name: "Ice-Raiding Bat",
        description: "6-hit combo... at least easier to deal with than those that front-load massive damage right at the start, right?",
        xp_value: 63245986, 
        rank: 3310,
        image: "image/enemy/E3310.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 5</b></span>",
        spec: [33],
        spec_value: {33:6},
        stats: {health: 5.618e8, attack: 12900e4, agility: 8400e4, attack_speed: 1.1, defense: 6500e4}, 
        loot_list: [
            {item_name: "史诗蓝宝石", chance:0.012},
            {item_name: "史诗红宝石", chance:0.030},
            {item_name: "光暗枝丫", chance:0.1},
            //50D
        ],
    });
    enemy_templates["霜傀儡"] = new Enemy({
        name: "Frost Golem",
        description: "Would shoveling underneath it to make snowballs be somewhat profitable?",
        xp_value: 63245986, 
        rank: 3311,
        image: "image/enemy/E3311.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 5</b></span>",
        spec: [50],
        spec_value: {50:210e4},
        stats: {health: 3.52e8, attack: 18500e4, agility: 8800e4, attack_speed: 1.4, defense: 7500e4}, 
        loot_list: [
            {item_name: "史诗蓝宝石", chance:0.012},
            {item_name: "史诗红宝石", chance:0.030},
            {item_name: "B4·能量核心", chance:0.2},
            {item_name: "玄冰果实", chance:0.0008},
            //50D
        ],
    });
    enemy_templates["冰原荒兽"] = new Enemy({
        name: "Glacial Plain Wild Beast",
        description: "Why are there HP-draining masteries everywhere in this place?! So scary, so scary, so scary……",
        xp_value: 63245986, 
        rank: 3312,
        image: "image/enemy/E3312.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 5</b></span>",
        spec: [49],
        spec_value: {49:{rnd:100,hp:1.0e8}},
        stats: {health: 9e8, attack: 15000e4, agility: 9200e4, attack_speed: 1.2, defense: 7500e4}, 
        loot_list: [
            {item_name: "史诗蓝宝石", chance:0.012},
            {item_name: "史诗红宝石", chance:0.030},
            {item_name: "多孔冰晶", chance:0.07},
            //50D
        ],
    });
    enemy_templates["射击卫戍"] = new Enemy({
        name: "Shooting Garrison",
        description: "If only the laser could melt the ice and snow here……",
        xp_value: 63245986, 
        rank: 3313,
        image: "image/enemy/E3313.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 5</b></span>",
        spec: [43],
        spec_value: {43:1e8},
        stats: {health: 57.6e8, attack: 14400e4, agility: 9600e4, attack_speed: 1.2, defense: 7200e4}, 
        loot_list: [
            {item_name: "史诗蓝宝石", chance:0.012},
            {item_name: "史诗红宝石", chance:0.030},
            {item_name: "冰原超流体", chance:0.06},
            //50D
        ],
    });
    enemy_templates["冰山石灵"] = new Enemy({
        name: "Iceberg Stone Spirit",
        description: "Finally something with more normal stats. Armored is so much more approachable than those that rush up and freeze you right at the start……yes, this is the bonus stage!",
        xp_value: 102334155, 
        rank: 3314,
        image: "image/enemy/E3314.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 5 +</b></span>",
        spec: [1],
        stats: {health: 60, attack: 12250e4, agility: 10000e4, attack_speed: 1.4, defense: 8500e4}, 
        loot_list: [
            {item_name: "史诗红宝石", chance:0.036},
            {item_name: "蓝金锭", chance:1},
            {item_name: "秘银锭", chance:0.30},
            {item_name: "旋律合金锭", chance:0.06},
            //90D
        ],
    });
    enemy_templates["冰原老人"] = new Enemy({
        name: "Glacial Plain Elder",
        description: "Phew~ I'm going to stand in front of it and regen HP. Nobody stop me.",
        xp_value: 102334155, 
        rank: 3315,
        image: "image/enemy/E3315.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 5 +</b></span>",
        spec: [5],
        stats: {health: 15.644e8, attack: 22000e4, agility: 10400e4, attack_speed: 1.3, defense: 4400e4}, 
        loot_list: [
            {item_name: "史诗红宝石", chance:0.036},
            {item_name: "玄冰果实", chance:0.0032},
            //90D
        ],
    });
    enemy_templates["冰原骸骨骑士"] = new Enemy({
        name: "Glacial Plain Skeleton Knight",
        description: "Yes, every area has its own Ice Spike Sword~ This is our pure white Glacial Plain.",
        xp_value: 102334155, 
        rank: 3316,
        image: "image/enemy/E3316.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 5 +</b></span>",
        spec: [48],
        spec_value: {48:120e4},
        stats: {health: 13.6e8, attack: 17000e4, agility: 10800e4, attack_speed: 1.3, defense: 8500e4}, 
        loot_list: [
            {item_name: "史诗红宝石", chance:0.036},
            {item_name: "多孔冰晶", chance:0.13},
            //90D
        ],
    });
    
    //【LIFE CHANGE】
    // 20%↑
    //
    // 30%↓
    enemy_templates["探险者的怨恨"] = new Enemy({
        name: "探险者的怨恨", 
        description: "时封？血量太薄了……它真的可以撑到第二次攻击吗？", 
        xp_value: 102334155, 
        rank: 3401,
        image: "image/enemy/E3401.png",
        realm: "<span class=realm_sky><b>天空级五阶 +</b></span>",
        size: "small",
        spec: [12],
        spec_value:{},
        tags: [],
        stats: {health: 2.7e8, attack: 39690e4, agility: 1.2e8, attack_speed: 1.7, defense:0e4}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.020},
            {item_name: "史诗绿宝石", chance:0.002},
            {item_name: "B4·能量核心", chance:0.4},
            //90D
        ],
    });
    enemy_templates["出芽橙茸战士"] = new Enemy({
        name: "出芽橙茸战士", 
        description: "彩虹攻击:(2/7)!!单独出芽和单独拿着武器都没什么用，连在一起……看起来是本命灵宝！", 
        xp_value: 102334155, 
        rank: 3402,
        image: "image/enemy/E3402.png",
        realm: "<span class=realm_sky><b>天空级五阶 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 6.6e8, attack: 1.85e8, agility: 1.3e8, attack_speed: 1.3, defense:1.25e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.020},
            {item_name: "史诗绿宝石", chance:0.002},
            {item_name: "镶晶盾牌", chance:0.02},
            {item_name: "冰原超流体", chance:0.04},
            //90D
        ],
    });
    enemy_templates["敌意猎兵"] = new Enemy({
        name: "敌意猎兵", 
        description: "和刚刚那只除了血薄了很多以外没有什么区别。之前来群殴你的六只已经是精锐了啦……", 
        xp_value: 102334155, 
        rank: 3403,
        image: "image/enemy/E3403.png",
        realm: "<span class=realm_sky><b>天空级五阶 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 9.075e8, attack: 2.2e8, agility: 1.4e8, attack_speed: 1.3, defense:1.1e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.020},
            {item_name: "史诗绿宝石", chance:0.002},
            {item_name: "冰宫鳞片", chance:0.015},
            {item_name: "多孔冰晶", chance:0.045},
            //90D
        ],
    });
    enemy_templates["大眼霜冻鱼"] = new Enemy({
        name: "大眼霜冻鱼", 
        description: "很遗憾，因为温度太低，冰元素四溢，这里没有湖可以钓鱼……活着的鱼都爬出来了！", 
        xp_value: 102334155, 
        rank: 3404,
        image: "image/enemy/E3404.png",
        realm: "<span class=realm_sky><b>天空级五阶 +</b></span>",
        size: "small",
        spec: [50],
        spec_value:{50:361e4},
        tags: [],
        stats: {health: 33e8, attack: 1.84e8, agility: 1.6e8, attack_speed: 1.3, defense:1.0e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.020},
            {item_name: "史诗绿宝石", chance:0.002},
            {item_name: "冰宫鳞片", chance:0.03},
            //90D
        ],
    });
    enemy_templates["敌意女巫"] = new Enemy({
        name: "敌意女巫", 
        description: "就是它……不仅光环强还可以叠加！实在是好过分的说！", 
        xp_value: 165580141, 
        rank: 3405,
        image: "image/enemy/E3405.png",
        realm: "<span class=realm_sky><b>天空级六阶</b></span>",
        size: "small",
        spec: [0],
        spec_value:{},
        tags: [],
        stats: {health: 33e8, attack: 1.84e8, agility: 1.8e8, attack_speed: 1.3, defense:1.0e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.016},
            {item_name: "史诗绿宝石", chance:0.008},
            {item_name: "光环杖芯", chance:0.023},
            //160D
        ],
    });
    enemy_templates["出芽黄茸战士"] = new Enemy({
        name: "出芽黄茸战士", 
        description: "彩虹攻击(3/7)！特殊能力如何比拟久经锻炼的……茸身？", 
        xp_value: 165580141, 
        rank: 3406,
        image: "image/enemy/E3406.png",
        realm: "<span class=realm_sky><b>天空级六阶</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 2.1e8, attack: 3.2e8, agility: 2.0e8, attack_speed: 1.3, defense:1.6e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.016},
            {item_name: "史诗绿宝石", chance:0.008},
            {item_name: "镶晶盾牌", chance:0.04},
            {item_name: "冰原超流体", chance:0.06},
            //160D
        ],
    });
    enemy_templates["绝对低温能源"] = new Enemy({
        name: "绝对低温能源", 
        description: "不仅仅本身的温度接近0K，还含有致死量的冰元素。一个这货可以中和几十个【核爆能源】！", 
        xp_value: 165580141, 
        rank: 3407,
        image: "image/enemy/E3407.png",
        realm: "<span class=realm_sky><b>天空级六阶</b></span>",
        size: "small",
        spec: [50,39],
        spec_value:{50:486e4,39:8.0e8},
        tags: [],
        stats: {health: 0.0001e8, attack: 0.0001e8, agility: 2.1e8, attack_speed: 1.3, defense:0.0001e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.016},
            {item_name: "史诗绿宝石", chance:0.008},
            {item_name: "冰原超流体", chance:0.1},
            {item_name: "万载冰髓锭", chance:0.01},
            //160D
        ],
    });
    enemy_templates["敌意骑士"] = new Enemy({
        name: "敌意骑士", 
        description: "很久很久以前，【燕岗城】区域就有一只长得差不多的怪……还记得第一次commit的时候，中间忘了，总之せーの！っインターネット最高！", 
        xp_value: 165580141, 
        rank: 3408,
        image: "image/enemy/E3408.png",
        realm: "<span class=realm_sky><b>天空级六阶</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 7.5e8, attack: 2.704e8, agility: 2.2e8, attack_speed: 1.3, defense:1.6e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.016},
            {item_name: "史诗绿宝石", chance:0.008},
            {item_name: "镶晶盾牌", chance:0.06},
            //160D
        ],
    });
    enemy_templates["出芽绿茸战士"] = new Enemy({
        name: "出芽绿茸战士", 
        description: "彩虹攻击(4/7)！明明只比前面那只强了一点点吧……", 
        xp_value: 165580141, 
        rank: 3409,
        image: "image/enemy/E3409.png",
        realm: "<span class=realm_sky><b>天空级六阶</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 15e8, attack: 4e8, agility: 2.2e8, attack_speed: 1.3, defense:1.8e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.016},
            {item_name: "史诗绿宝石", chance:0.008},
            {item_name: "镶晶盾牌", chance:0.03},
            {item_name: "光环杖芯", chance:0.02},
            //160D
        ],
    });
    enemy_templates["冰血除草者"] = new Enemy({
        name: "冰血除草者", 
        description: "热血沸腾的组合技，1080亿(划掉)480亿的斩杀线！虽然因为RPG的机制，冰封和圣阵的组合技消失了就是了啦。", 
        xp_value: 165580141, 
        rank: 3410,
        image: "image/enemy/E3410.png",
        realm: "<span class=realm_sky><b>天空级六阶</b></span>",
        size: "small",
        spec: [5,42,49],
        spec_value:{49:{rnd:300,hp:1.6e8}},
        tags: [],
        stats: {health: 26.7e8, attack: 3.5e8, agility: 2.3e8, attack_speed: 1.0, defense:0.9e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.016},
            {item_name: "史诗绿宝石", chance:0.008},
            {item_name: "光环杖芯", chance:0.02},
            {item_name: "冰宫鳞片", chance:0.03},
            //160D
        ],
    });
    enemy_templates["夹击卫戍"] = new Enemy({
        name: "夹击卫戍", 
        description: "居然还是一个系列的。你那会用激光的兄弟距离这里有点远的……", 
        xp_value: 165580141, 
        rank: 3411,
        image: "image/enemy/E3411.png",
        realm: "<span class=realm_sky><b>天空级六阶</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 18e8, attack: 2.8e8, agility: 2.4e8, attack_speed: 1.4, defense:1.5e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.016},
            {item_name: "史诗绿宝石", chance:0.008},
            {item_name: "冰宫鳞片", chance:0.03},
            {item_name: "B4·能量核心", chance:0.40},
            //160D
        ],
    });
    enemy_templates["敌意傀儡"] = new Enemy({
        name: "敌意傀儡", 
        description: "说起来，极寒冰宫的敌意是不是有点太大了？好多【敌意】词头的家伙！", 
        xp_value: 165580141, 
        rank: 3412,
        image: "image/enemy/E3412.png",
        realm: "<span class=realm_sky><b>天空级六阶</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 2.6508e8, attack: 3.1e8, agility: 2.5e8, attack_speed: 1.4, defense:1.9e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.016},
            {item_name: "史诗绿宝石", chance:0.008},
            {item_name: "B4·能量核心", chance:0.40},
            {item_name: "镶晶盾牌", chance:0.04},
            //160D
        ],
    });
    enemy_templates["冰兽龙龙"] = new Enemy({
        name: "冰兽龙龙", 
        description: "一种体温极低，可以释放冰霜吐息的龙亚种。", 
        xp_value: 267914296, 
        rank: 3413,
        image: "image/enemy/E3413.png",
        realm: "<span class=realm_sky><b>天空级六阶 +</b></span>",
        size: "small",
        spec: [50],
        spec_value:{50:616e4},
        tags: [],
        stats: {health: 19.8e8, attack: 3.7e8, agility: 2.7e8, attack_speed: 1.3, defense:2.2e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.008},
            {item_name: "史诗绿宝石", chance:0.020},
            {item_name: "冰宫鳞片", chance:0.09},
            //280D
        ],
    });
    enemy_templates["雪茸茸战士"] = new Enemy({
        name: "雪茸茸战士", 
        description: "双刀流！左剑伤害高~右剑高伤害！", 
        xp_value: 165580141, 
        rank: 3414,
        image: "image/enemy/E3414.png",
        realm: "<span class=realm_sky><b>天空级六阶</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 12e8, attack: 4e8, agility: 2.8e8, attack_speed: 3.0, defense:0.0e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.016},
            {item_name: "史诗绿宝石", chance:0.008},
            {item_name: "镶晶盾牌", chance:0.03},
            {item_name: "多孔冰晶", chance:0.09},
            //160D
        ],
    });
    enemy_templates["大教内门弟子"] = new Enemy({
        name: "大教内门弟子", 
        description: "远道之后，是足以匹敌混沌10转……不好意思串台了，这个大教明显比炒鸡蛋的大教小好多的说……", 
        xp_value: 165580141, 
        rank: 3415,
        image: "image/enemy/E3415.png",
        realm: "<span class=realm_sky><b>天空级六阶</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 14.4e8, attack: 2.8e8, agility: 2.6e8, attack_speed: 1.3, defense:2.1e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.016},
            {item_name: "史诗绿宝石", chance:0.008},
            {item_name: "光环杖芯", chance:0.05},
            //160D
        ],
    });
    enemy_templates["敌意美杜莎"] = new Enemy({
        name: "敌意美杜莎", 
        description: "大地境修者只要被瞪一下就会变成石头。但是对于天空级中期以上战力，这样的技巧只会有微弱的效益。", 
        xp_value: 267914296, 
        rank: 3416,
        image: "image/enemy/E3416.png",
        realm: "<span class=realm_sky><b>天空级六阶 +</b></span>",
        size: "small",
        spec: [0,8],
        spec_value:{8:10},
        tags: [],
        stats: {health: 14.7e8, attack: 1.0e8, agility: 2.4e8, attack_speed: 1.3, defense:2.0e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.008},
            {item_name: "史诗绿宝石", chance:0.020},
            {item_name: "冰宫鳞片", chance:0.10},
            //280D
        ],
    });
    enemy_templates["敌意巫师"] = new Enemy({
        name: "敌意巫师", 
        description: "叠甲，过！这个巫师明明超强却过分谨慎——虽然没用就是了啦。", 
        xp_value: 267914296, 
        rank: 3417,
        image: "image/enemy/E3417.png",
        realm: "<span class=realm_sky><b>天空级六阶 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 27e8, attack: 3.3e8, agility: 2.7e8, attack_speed: 1.3, defense:2.3e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.008},
            {item_name: "史诗绿宝石", chance:0.020},
            {item_name: "光环杖芯", chance:0.08},
            //280D
        ],
    });
    enemy_templates["出芽青茸战士"] = new Enemy({
        name: "出芽青茸战士", 
        description: "比起双刀流选手，这位更加贴近所谓的防杀策略。2.8亿防御足以让它傲视群雄……除了那些冰封和冻伤的机制怪！", 
        xp_value: 267914296, 
        rank: 3418,
        image: "image/enemy/E3418.png",
        realm: "<span class=realm_sky><b>天空级六阶 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 7.5e8, attack: 4.2e8, agility: 3.2e8, attack_speed: 1.3, defense:2.8e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.008},
            {item_name: "史诗绿宝石", chance:0.020},
            {item_name: "冰原超流体", chance:0.12},
            {item_name: "镶晶盾牌", chance:0.08},
            //280D
        ],
    });enemy_templates["自爆步兵"] = new Enemy({
        name: "自爆步兵", 
        description: "全体都有~板载！这次可是携带了超强的绝对零度·疾冻弹药！", 
        xp_value: 267914296, 
        rank: 3419,
        image: "image/enemy/E3419.png",
        realm: "<span class=realm_sky><b>天空级六阶 +</b></span>",
        size: "small",
        spec: [36],
        spec_value:{},
        tags: [],
        stats: {health: 21.675e8, attack: 3.8e8, agility: 3.6e8, attack_speed: 1.3, defense:3.2e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.008},
            {item_name: "史诗绿宝石", chance:0.020},
            {item_name: "玄冰果实", chance:0.01},
            {item_name: "玄冰果实·觉醒", chance:0.001},
            //280D
        ],
    });
    enemy_templates["敌意老人"] = new Enemy({
        name: "敌意老人", 
        description: "【广告位招租】：这里急缺一个乳牵制笑话~", 
        xp_value: 267914296, 
        rank: 3420,
        image: "image/enemy/E3420.png",
        realm: "<span class=realm_sky><b>天空级六阶 +</b></span>",
        size: "small",
        spec: [5],
        spec_value:{},
        tags: [],
        stats: {health: 32.67e8, attack: 4.5e8, agility: 3.9e8, attack_speed: 1.4, defense:3.0e8}, //血量30%
        loot_list: [
            {item_name: "史诗红宝石", chance:0.008},
            {item_name: "史诗绿宝石", chance:0.020},
            {item_name: "B4·能量核心", chance:0.5},
            {item_name: "多孔冰晶", chance:0.15},
            //280D
        ],
    });

    
    //【LIFE CHANGE】
    // 30%↑
    //
    // 40%↓

    enemy_templates["大门派先锋"] = new Enemy({
        name: "大门派先锋", 
        description: "如果把先锋全部丢进这种低光速黑洞一样的地方，这个门派估计离死不远了……", 
        xp_value: 267914296, 
        rank: 3501,
        image: "image/enemy/E3501.png",
        realm: "<span class=realm_sky><b>天空级六阶 +</b></span>",
        size: "small",
        spec: [34],
        spec_value:{},
        tags: [],
        stats: {health: 17.6e8, attack: 4.8e8, agility: 4.4e8, attack_speed: 1.3, defense:3.2e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.025},
            {item_name: "水素晶体", chance:0.025},
            //280D
        ],
    });
    enemy_templates["水牢雪怪"] = new Enemy({
        name: "水牢雪怪", 
        description: "真的不会融化吗……或许它的体内自带一个极寒引擎的循环？", 
        xp_value: 267914296, 
        rank: 3502,
        image: "image/enemy/E3502.png",
        realm: "<span class=realm_sky><b>天空级六阶 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 51.2e8, attack: 5.2e8, agility: 4.5e8, attack_speed: 1.3, defense:3.0e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.025},
            {item_name: "多孔冰晶", chance:0.36},
            //280D
        ],
    });
    enemy_templates["水牢花妖"] = new Enemy({
        name: "水牢花妖", 
        description: "幸好是超凡的世界，即使没有氧气，根部也不会烂掉的！", 
        xp_value: 267914296, 
        rank: 3503,
        image: "image/enemy/E3503.png",
        realm: "<span class=realm_sky><b>天空级六阶 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 51.2e8, attack: 5.2e8, agility: 4.6e8, attack_speed: 1.3, defense:3.0e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.025},
            {item_name: "虹彩凝胶", chance:0.025},
            //280D
        ],
    });
    enemy_templates["成熟期蛟龙"] = new Enemy({
        name: "成熟期蛟龙", 
        description: "既不是地龙也不是飞龙，因为血脉不纯的原因，就到此为止了呢……", 
        xp_value: 267914296, 
        rank: 3504,
        image: "image/enemy/E3504.png",
        realm: "<span class=realm_sky><b>天空级六阶 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 30e8, attack: 5.5e8, agility: 4.8e8, attack_speed: 1.1, defense:3.5e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.025},
            {item_name: "冰宫鳞片", chance:0.09},
            //280D
        ],
    });
    enemy_templates["出芽蓝茸战士"] = new Enemy({
        name: "出芽蓝茸战士", 
        description: "彩虹攻击(6/7).怎么突然多了这么多能力啊！", 
        xp_value: 267914296, 
        rank: 3505,
        image: "image/enemy/E3505.png",
        realm: "<span class=realm_sky><b>天空级六阶 +</b></span>",
        size: "small",
        spec: [4],
        spec_value:{},
        tags: [],
        stats: {health: 58e8, attack: 5.3e8, agility: 5.0e8, attack_speed: 2.9, defense:2.6e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.025},
            {item_name: "虹彩凝胶", chance:0.03},
            //280D
        ],
    });
    enemy_templates["燕岗迷途强者"] = new Enemy({
        name: "燕岗迷途强者", 
        description: "迷い星のうた——不过就算一起迷路也迷太远了吧。这是钓到冰柱鱼王了吗……", 
        xp_value: 267914296, 
        rank: 3506,
        image: "image/enemy/E3506.png",
        realm: "<span class=realm_sky><b>天空级六阶 +</b></span>",
        size: "small",
        spec: [5],
        spec_value:{},
        tags: [],
        stats: {health: 28.9e8, attack: 6.225e8, agility: 5.2e8, attack_speed: 1.3, defense:3.125e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.025},
            {item_name: "紫色刀币", chance:0.3},
            //280D
        ],
    });
    enemy_templates["水牢嗜血哥布林"] = new Enemy({
        name: "水牢嗜血哥布林", 
        description: "七个字的标题耶。简直是除了百方[荒兽森林 ver.][BOSS]以外名字最长的家伙了。<br>(PS:半角算半个，所以舰船中枢B6[BOSS]也是七个字~", 
        xp_value: 267914296, 
        rank: 3507,
        image: "image/enemy/E3507.png",
        realm: "<span class=realm_sky><b>天空级六阶 +</b></span>",
        size: "small",
        spec: [49],
        spec_value:{49:{rnd:200,hp:3e8}},
        tags: [],
        stats: {health: 60e8, attack: 5.1e8, agility: 5.0e8, attack_speed: 1.3, defense:2.55e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.025},
            {item_name: "光环杖芯", chance:0.11},
            //280D
        ],
    });
    enemy_templates["识灵水藻"] = new Enemy({
        name: "识灵水藻", 
        description: "似乎是相当没有存在感的灵体。高伤成群的情况下灵体也没什么特别的不是吗？", 
        xp_value: 433494437, 
        rank: 3508,
        image: "image/enemy/E3508.png",
        realm: "<span class=realm_sky><b>天空级七阶</b></span>",
        size: "small",
        spec: [27,21],
        spec_value:{21:6.0e8},
        tags: [],
        stats: {health: 132e8, attack: 5.8e8, agility: 5.2e8, attack_speed: 1.3, defense:3.4e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.012},
            {item_name: "传说黄宝石", chance:0.006},
            {item_name: "B7·能量核心", chance:0.045},
            //500D
        ],
    });
    enemy_templates["徘徊的紫乌"] = new Enemy({
        name: "徘徊的紫乌", 
        description: "出芽紫茸？不要以为带了个帽子就没人认识你了啦。", 
        xp_value: 433494437, 
        rank: 3509,
        image: "image/enemy/E3509.png",
        realm: "<span class=realm_sky><b>天空级七阶</b></span>",
        size: "small",
        spec: [19],
        tags: [],
        stats: {health: 62.28e8, attack: 5.2e8, agility: 4.5e8, attack_speed: 1.4, defense:4.1e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.012},
            {item_name: "传说黄宝石", chance:0.006},
            {item_name: "水素晶体", chance:0.02},
            {item_name: "虹彩凝胶", chance:0.02},
            //500D
        ],
    });
    enemy_templates["夜巡傀儡"] = new Enemy({
        name: "夜巡傀儡", 
        description: "话说，水牢应该不分昼夜吧……如果可以看到天的话，没理由关的住人哇。", 
        xp_value: 433494437, 
        rank: 3510,
        image: "image/enemy/E3510.png",
        realm: "<span class=realm_sky><b>天空级七阶</b></span>",
        size: "small",
        spec: [18],
        spec_value:{18:100e12},
        tags: [],
        stats: {health: 64e8, attack: 6.2e8, agility: 5.4e8, attack_speed: 1.3, defense:4.2e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.012},
            {item_name: "传说黄宝石", chance:0.006},
            {item_name: "宇宙币", chance:0.0005},
            //500D
        ],
    });
    enemy_templates["水猫茸茸"] = new Enemy({
        name: "水猫茸茸", 
        description: "一种上限较高但较为温和的光环茸茸。或许是水溶茸茸长大后的样子呢？", 
        xp_value: 433494437, 
        rank: 3511,
        image: "image/enemy/E3511.png",
        realm: "<span class=realm_sky><b>天空级七阶</b></span>",
        size: "small",
        spec: [11],
        tags: [],
        stats: {health: 84.64e8, attack: 5.75e8, agility: 5.6e8, attack_speed: 1.3, defense:4.5e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.012},
            {item_name: "传说黄宝石", chance:0.006},
            {item_name: "B7·能量核心", chance:0.08},
            //500D
        ],
    });
    enemy_templates["徘徊的骸骨"] = new Enemy({
        name: "徘徊的骸骨", 
        description: "你也迷路了？看来冰柱鱼王肯定不止一条~不对，骷髅会钓鱼吗？", 
        xp_value: 433494437, 
        rank: 3512,
        image: "image/enemy/E3512.png",
        realm: "<span class=realm_sky><b>天空级七阶</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 160e8, attack: 6.3e8, agility: 6.0e8, attack_speed: 1.3, defense:3.7e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.012},
            {item_name: "传说黄宝石", chance:0.006},
            {item_name: "水素晶体", chance:0.05},
            //500D
        ],
    });
    enemy_templates["水牢骨角茸茸"] = new Enemy({
        name: "水牢骨角茸茸", 
        description: "好多各种各样的茸茸~并不奇怪，毕竟最容易构建的就是环形回路，产生的生命也就是茸茸了。", 
        xp_value: 433494437, 
        rank: 3513,
        image: "image/enemy/E3513.png",
        realm: "<span class=realm_sky><b>天空级七阶</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 140e8, attack: 6.4e8, agility: 6.4e8, attack_speed: 1.3, defense:4.9e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.012},
            {item_name: "传说黄宝石", chance:0.006},
            {item_name: "冰原超流体", chance:0.2},
            {item_name: "虹彩凝胶", chance:0.03},
            //500D
        ],
    });
    enemy_templates["水牢石灵"] = new Enemy({
        name: "水牢石灵", 
        description: "如果以后有高血量坚固怪会是个问题么？现在的倍率已经是40%了……", 
        xp_value: 433494437, 
        rank: 3514,
        image: "image/enemy/E3514.png",
        realm: "<span class=realm_sky><b>天空级七阶</b></span>",
        size: "small",
        spec: [1],
        tags: [],
        stats: {health: 39.6, attack: 10.0e8, agility: 6.8e8, attack_speed: 1.3, defense:8.0e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.006},
            {item_name: "传说黄宝石", chance:0.015},
            {item_name: "万载冰髓锭", chance:0.25},
            //500D
        ],
    });
    enemy_templates["仙旅城强战士"] = new Enemy({
        name: "仙旅城强战士", 
        description: "声律城倒下了，迎接我们的是……仙旅城？什么时候加入酰氯城w", 
        xp_value: 433494437, 
        rank: 3515,
        image: "image/enemy/E3515.png",
        realm: "<span class=realm_sky><b>天空级七阶</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 153.76e8, attack: 9.0e8, agility: 7.0e8, attack_speed: 1.3, defense:4.5e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.006},
            {item_name: "传说黄宝石", chance:0.015},
            {item_name: "光环杖芯", chance:0.15},
            //500D
        ],
    });
    enemy_templates["城主府队长"] = new Enemy({
        name: "城主府队长", 
        description: "虽然城主府标配着白色制服和骷髅头套，但在水牢呆了数百年，这套制服已经被水元素浸染成蓝色的样子了。", 
        xp_value: 433494437, 
        rank: 3516,
        image: "image/enemy/E3516.png",
        realm: "<span class=realm_sky><b>天空级七阶</b></span>",
        size: "small",
        spec: [7],
        tags: [],
        stats: {health: 179.56e8, attack: 9.9e8, agility: 7.2e8, attack_speed: 1.3, defense:4.4e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.006},
            {item_name: "传说黄宝石", chance:0.015},
            {item_name: "水素晶体", chance:0.06},
            //500D
        ],
    });
    enemy_templates["火箭卫戍"] = new Enemy({
        name: "火箭卫戍", 
        description: "在这个所有东西都是蓝的地方还能保持自己的红衣，已经是实力的证明了。", 
        xp_value: 433494437, 
        rank: 3517,
        image: "image/enemy/E3517.png",
        realm: "<span class=realm_sky><b>天空级七阶</b></span>",
        size: "small",
        spec: [35],
        spec_value: {35:10e8},
        tags: [],
        stats: {health: 144e8, attack: 12.9e8, agility: 7.6e8, attack_speed: 1.3, defense:6.9e8}, //血量40%
        loot_list: [
            {item_name: "史诗绿宝石", chance:0.006},
            {item_name: "传说黄宝石", chance:0.015},
            {item_name: "B7·能量核心", chance:0.09},
            //500D
        ],
    });
    enemy_templates["小门派长老"] = new Enemy({
        name: "小门派长老", 
        description: "长老走了这么久，门派还好吗……空有境界没有实力，宛如一颗肥美的经验球。", 
        xp_value: 701408733, 
        rank: 3518,
        image: "image/enemy/E3518.png",
        realm: "<span class=realm_sky><b>天空级七阶 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 144e8, attack: 7.5e8, agility: 7.2e8, attack_speed: 1.3, defense:5.5e8}, //血量40%
        loot_list: [
            {item_name: "传说黄宝石", chance:0.015},
            {item_name: "传说蓝宝石", chance:0.006},
            {item_name: "冰原超流体", chance:0.2},
            {item_name: "多孔冰晶", chance:0.2},
            //900D
        ],
    });
    enemy_templates["水牢幽暗人形"] = new Enemy({
        name: "水牢幽暗人形", 
        description: "在这里可能看不出来，但是它真的和环境融为一体了。喵可可看不到巨大的伤害数字……", 
        xp_value: 701408733, 
        rank: 3519,
        image: "image/enemy/E3519.png",
        realm: "<span class=realm_sky><b>天空级七阶 +</b></span>",
        size: "small",
        spec: [0],
        tags: [],
        stats: {health: 30e8, attack: 5.25e8, agility: 7.2e8, attack_speed: 1.3, defense:5.25e8}, //血量40%
        loot_list: [
            {item_name: "传说黄宝石", chance:0.015},
            {item_name: "传说蓝宝石", chance:0.006},
            {item_name: "水素晶体", chance:0.10},
            //900D
        ],
    });
    enemy_templates["出芽紫茸战士"] = new Enemy({
        name: "出芽紫茸战士", 
        description: "彩虹攻击(7/7).你是不是有点掉队了的说？", 
        xp_value: 701408733, 
        rank: 3520,
        image: "image/enemy/E3520.png",
        realm: "<span class=realm_sky><b>天空级七阶 +</b></span>",
        size: "small",
        spec: [16],
        tags: [],
        stats: {health: 39e8, attack: 9.9e8, agility: 7.6e8, attack_speed: 1.3, defense:6.3e8}, //血量40%
        loot_list: [
            {item_name: "传说黄宝石", chance:0.015},
            {item_name: "传说蓝宝石", chance:0.006},
            {item_name: "虹彩凝胶", chance:0.08},
            //900D
        ],
    });
    enemy_templates["星月幻术师"] = new Enemy({
        name: "星月幻术师", 
        description: "实力强劲的法师，兼具buff/回血/攻击三种形态。", 
        xp_value: 701408733, 
        rank: 3521,
        image: "image/enemy/E3521.png",
        realm: "<span class=realm_sky><b>天空级七阶 +</b></span>",
        size: "small",
        spec: [0,11,31],
        tags: [],
        stats: {health: 39e8, attack: 11.5e8, agility: 8.0e8, attack_speed: 1.3, defense:7.2e8}, //血量40%
        loot_list: [
            {item_name: "传说黄宝石", chance:0.015},
            {item_name: "传说蓝宝石", chance:0.006},
            {item_name: "虹彩凝胶", chance:0.04},
            {item_name: "光环杖芯", chance:0.15},
            //900D
        ],
    });
    enemy_templates["绿皮怪物"] = new Enemy({
        name: "绿皮怪物", 
        description: "喂喂，这个有点敷衍了……狂战士没有人权吗？", 
        xp_value: 701408733, 
        rank: 3522,
        image: "image/enemy/E3522.png",
        realm: "<span class=realm_sky><b>天空级七阶 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 127.2e8, attack: 13.2e8, agility: 8.4e8, attack_speed: 1.3, defense:5.5e8}, //血量40%
        loot_list: [
            {item_name: "传说黄宝石", chance:0.015},
            {item_name: "传说蓝宝石", chance:0.006},
            {item_name: "B7·能量核心", chance:0.12},
            //900D
        ],
    });
    enemy_templates["魔化枭蝎"] = new Enemy({
        name: "魔化枭蝎", 
        description: "这种魔力有点强的样子啊。属性超级强化，而技能全数保留。", 
        xp_value: 701408733, 
        rank: 3523,
        image: "image/enemy/E3523.png",
        realm: "<span class=realm_sky><b>天空级七阶 +</b></span>",
        size: "small",
        spec: [22,16],
        tags: [],
        stats: {health: 120e8, attack: 13.3e8, agility: 9.2e8, attack_speed: 1.3, defense:8.0e8}, //血量40%
        loot_list: [
            {item_name: "传说黄宝石", chance:0.015},
            {item_name: "传说蓝宝石", chance:0.006},
            {item_name: "虹彩凝胶", chance:0.10},
            //900D
        ],
    });
    enemy_templates["古龙幼崽"] = new Enemy({
        name: "古龙幼崽", 
        description: "喵可龙族排行榜:蛟龙<<地龙<飞龙<<古龙。", 
        xp_value: 701408733, 
        rank: 3524,
        image: "image/enemy/E3524.png",
        realm: "<span class=realm_sky><b>天空级七阶 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 57.6e8, attack: 9.9e8, agility: 8.8e8, attack_speed: 1.3, defense:7.1e8}, //血量40%
        loot_list: [
            {item_name: "传说黄宝石", chance:0.015},
            {item_name: "传说蓝宝石", chance:0.006},
            {item_name: "水素晶体", chance:0.12},
            //900D
        ],
    });
    enemy_templates["血杀殿余孽"] = new Enemy({
        name: "血杀殿余孽", 
        description: "这个组织还挺强的……不过血杀殿秘法和水牢规则倒也是一对好搭配。", 
        xp_value: 701408733, 
        rank: 3525,
        image: "image/enemy/E3525.png",
        realm: "<span class=realm_sky><b>天空级七阶 +</b></span>",
        size: "small",
        spec: [19],
        tags: [],
        stats: {health: 124e8, attack: 12.1e8, agility: 8.5e8, attack_speed: 1.3, defense:4.0e8}, //血量40%
        loot_list: [
            {item_name: "传说黄宝石", chance:0.015},
            {item_name: "传说蓝宝石", chance:0.006},
            {item_name: "宇宙币", chance:0.001},
            //900D
        ],
    });
    enemy_templates["城主府骨干"] = new Enemy({
        name: "城主府骨干", 
        description: "字面意义上的骨干。也不知道城主府的员工是不是签了群星那永身雇佣制合同之类的，都这样了还归属于城主府。", 
        xp_value: 1134903170, 
        rank: 3526,
        image: "image/enemy/E3526.png",
        realm: "<span class=realm_sky><b>天空级七阶 ++</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 133.2e8, attack: 14.6e8, agility: 10.5e8, attack_speed: 1.3, defense:9.6e8}, //血量40%
        loot_list: [
            {item_name: "传说黄宝石", chance:0.006},
            {item_name: "传说蓝宝石", chance:0.015},
            {item_name: "冰原超流体", chance:0.3},
            {item_name: "光环杖芯", chance:0.15},
            //900D
        ],
    });
    enemy_templates["奇异菇菇"] = new Enemy({
        name: "奇异菇菇", 
        description: "已经进入了幻境，但战斗还要继续！说起来，外面的装备居然可以带进来耶。", 
        xp_value: 701408733, 
        rank: 3601,
        image: "image/enemy/E3601.png",
        realm: "<span class=realm_sky><b>天空级七阶 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 150e8, attack: 15.4e8, agility: 12.0e8, attack_speed: 1.3, defense:8.9e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.010},
            {item_name: "传承水晶·绿", chance:0.015},
            //900D
        ],
    });
    enemy_templates["幻境掌灯人"] = new Enemy({
        name: "幻境掌灯人", 
        description: "喂喂，版本更新了！这里到处都是光，要你有什么用哇。", 
        xp_value: 701408733, 
        rank: 3602,
        image: "image/enemy/E3602.png",
        realm: "<span class=realm_sky><b>天空级七阶 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 72e8, attack: 16.1e8, agility: 13e8, attack_speed: 1.3, defense:13.5e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.010},
            {item_name: "传承水晶·蓝", chance:0.012},
            //900D
        ],
    });
    enemy_templates["蓝皮怪物"] = new Enemy({
        name: "蓝皮怪物", 
        description: "和绿皮怪物一桌!这一只和那个东西一样敷衍啊。", 
        xp_value: 701408733, 
        rank: 3603,
        image: "image/enemy/E3603.png",
        realm: "<span class=realm_sky><b>天空级七阶 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 90e8, attack: 17.2e8, agility: 14.0e8, attack_speed: 1.3, defense:10.5e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.010},
            {item_name: "传承水晶·橙", chance:0.022},
            //900D
        ],
    });
    enemy_templates["幻境通识者"] = new Enemy({
        name: "幻境通识者", 
        description: "胸口蝴蝶结，但看起来心事重重的样子。衣服不会是他抢来的吧……", 
        xp_value: 1134903170, 
        rank: 3604,
        image: "image/enemy/E3604.png",
        realm: "<span class=realm_sky><b>天空级八阶</b></span>",
        size: "small",
        spec: [18],
        spec_value:{18:400e12},
        tags: [],
        stats: {health: 440e8, attack: 17.7e8, agility: 16.0e8, attack_speed: 1.3, defense:12.5e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.010},
            {item_name: "传说红宝石", chance:0.004},
            {item_name: "传承水晶·白", chance:0.027},
            //1.6B
        ],
    });
    enemy_templates["火烈茸茸"] = new Enemy({
        name: "火烈茸茸", 
        description: "居然在高温下还可以下毒。只要防杀喵可就好了吧~(不过你能看到这个就说明它失败了！)", 
        xp_value: 1134903170, 
        rank: 3605,
        image: "image/enemy/E3605.png",
        realm: "<span class=realm_sky><b>天空级八阶</b></span>",
        size: "small",
        spec: [8],
        spec_value:{8:10},
        tags: [],
        stats: {health: 16e8, attack: 35e8, agility: 17.0e8, attack_speed: 1.3, defense:17.5e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.010},
            {item_name: "传说红宝石", chance:0.004},
            {item_name: "传承水晶·橙", chance:0.04},
            //1.6B
        ],
    });
    enemy_templates["幻境翠绿行者"] = new Enemy({
        name: "幻境翠绿行者", 
        description: "蓝帽行者总是被模仿，但400%血量下它也从未被超越。", 
        xp_value: 1134903170, 
        rank: 3606,
        image: "image/enemy/E3606.png",
        realm: "<span class=realm_sky><b>天空级八阶</b></span>",
        size: "small",
        spec: [3],
        tags: [],
        stats: {health: 16e8, attack: 22.5e8, agility: 18.0e8, attack_speed: 1.3, defense:14.0e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.010},
            {item_name: "传说红宝石", chance:0.004},
            {item_name: "传承水晶·绿", chance:0.026},
            //1.6B
        ],
    });
    enemy_templates["风尘的窃贼"] = new Enemy({
        name: "风尘的窃贼", 
        description: "追光……？既然可以破防火烈茸茸，你大概也接近20亿攻防了吧。", 
        xp_value: 1134903170, 
        rank: 3607,
        image: "image/enemy/E3607.png",
        realm: "<span class=realm_sky><b>天空级八阶</b></span>",
        size: "small",
        spec: [40],
        tags: [],
        stats: {health: 288e8, attack: 20e8, agility: 19.0e8, attack_speed: 1.3, defense:14.8e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.010},
            {item_name: "传说红宝石", chance:0.004},
            {item_name: "传承水晶·白", chance:0.033},
            //1.6B
        ],
    });
    enemy_templates["深邃级魔法师"] = new Enemy({
        name: "深邃级魔法师", 
        description: "丢掉了本职工作——魔攻。是法师失格！绝对算的吧！这就是deep♂dark♂fantasy的代价啊。", 
        xp_value: 1134903170, 
        rank: 3608,
        image: "image/enemy/E3608.png",
        realm: "<span class=realm_sky><b>天空级八阶</b></span>",
        size: "small",
        spec: [20,49],
        spec_value:{49:{rnd:200,hp:8e8}},
        tags: [],
        stats: {health: 288e8, attack: 22e8, agility: 20e8, attack_speed: 1.3, defense:11.0e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.010},
            {item_name: "传说红宝石", chance:0.004},
            {item_name: "传承水晶·粉", chance:0.013},
            //1.6B
        ],
    });
    enemy_templates["荒野守尸人"] = new Enemy({
        name: "荒野守尸人", 
        description: "骷髅守尸是准备组个mc小队吗？这样，带上苦力怕蜘蛛和末影人，组个乐队……", 
        xp_value: 1134903170, 
        rank: 3609,
        image: "image/enemy/E3609.png",
        realm: "<span class=realm_sky><b>天空级八阶</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 360e8, attack: 25.6e8, agility: 21.0e8, attack_speed: 1.3, defense:16.0e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.010},
            {item_name: "传说红宝石", chance:0.004},
            {item_name: "传承水晶·白", chance:0.037},
            //1.6B
        ],
    });
    enemy_templates["幻境火蝶"] = new Enemy({
        name: "幻境火蝶", 
        description: "你已经救出了公主！你可以选择就此封盘，认为你已经“通关”了，又或者你还愿意继续……串台了。公主不是红色翅膀……", 
        xp_value: 1134903170, 
        rank: 3610,
        image: "image/enemy/E3610.png",
        realm: "<span class=realm_sky><b>天空级八阶</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 109.6e8, attack: 27e8, agility: 22.0e8, attack_speed: 1.3, defense:16.0e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.010},
            {item_name: "传说红宝石", chance:0.004},
            {item_name: "传承水晶·橙", chance:0.045},
            //1.6B
        ],
    });
    enemy_templates["出芽粉茸战士"] = new Enemy({
        name: "出芽粉茸战士", 
        description: "彩虹攻击(8/7)。是不是最开始搞错了啦……", 
        xp_value: 1134903170, 
        rank: 3611,
        image: "image/enemy/E3611.png",
        realm: "<span class=realm_sky><b>天空级八阶</b></span>",
        size: "small",
        spec: [23],
        tags: [],
        stats: {health: 81e8, attack: 24.01e8, agility: 23.0e8, attack_speed: 1.3, defense:18.0e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.010},
            {item_name: "传说红宝石", chance:0.004},
            {item_name: "传承水晶·粉", chance:0.015},
            //1.6B
        ],
    });
    enemy_templates["凶恶的金乌"] = new Enemy({
        name: "凶恶的金乌", 
        description: "我，纱雪，在此发誓！我绝不会和上次一样把乌打成马了！", 
        xp_value: 1836311903, 
        rank: 3612,
        image: "image/enemy/E3612.png",
        realm: "<span class=realm_sky><b>天空级八阶 +</b></span>",
        size: "small",
        spec: [19],
        tags: [],
        stats: {health: 270.4e8, attack: 24e8, agility: 21.5e8, attack_speed: 1.3, defense:20.8e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.004},
            {item_name: "传说红宝石", chance:0.010},
            {item_name: "传承水晶·蓝", chance:0.02},
            {item_name: "传承水晶·绿", chance:0.02},
            //2.8B
        ],
    });
    enemy_templates["幻境血魔"] = new Enemy({
        name: "幻境血魔", 
        description: "血魔海一滴血液分化而成的生命。只有普通七阶后期的战力，但生命力雄厚。", 
        xp_value: 1836311903, 
        rank: 3613,
        image: "image/enemy/E3613.png",
        realm: "<span class=realm_sky><b>天空级八阶 +</b></span>",
        size: "small",
        spec: [37],
        tags: [],
        stats: {health: 440e8, attack: 18.8e8, agility: 25.0e8, attack_speed: 1.3, defense:13.5e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.004},
            {item_name: "传说红宝石", chance:0.010},
            {item_name: "传承水晶·橙", chance:0.07},
            //2.8B
        ],
    });
    enemy_templates["窥秘商人"] = new Enemy({
        name: "窥秘商人", 
        description: "看起来就很狡猾。影魇族人转生来了？", 
        xp_value: 1836311903, 
        rank: 3614,
        image: "image/enemy/E3614.png",
        realm: "<span class=realm_sky><b>天空级八阶 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 704e8, attack: 30e8, agility: 26.0e8, attack_speed: 1.3, defense:20e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.004},
            {item_name: "传说红宝石", chance:0.010},
            {item_name: "传承水晶·粉", chance:0.01},
            {item_name: "传承水晶·白", chance:0.03},
            //2.8B
        ],
    });
    enemy_templates["燕岗领独行侠"] = new Enemy({
        name: "燕岗领独行侠", 
        description: "走投无路的迷途强者，误入水牢，从厮杀中悟出领域三重……多棒的故事啊。可惜这个结界可不是那种真正的传承之地哦。", 
        xp_value: 1836311903, 
        rank: 3615,
        image: "image/enemy/E3615.png",
        realm: "<span class=realm_sky><b>天空级八阶 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 140e8, attack: 35e8, agility: 27.0e8, attack_speed: 1.3, defense:0e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.004},
            {item_name: "传说红宝石", chance:0.010},
            {item_name: "传承水晶·绿", chance:0.035},
            //2.8B
        ],
    });
    enemy_templates["幻境飞蛾"] = new Enemy({
        name: "幻境飞蛾", 
        description: "在这里是不是搞错了什么哇。上下都是八阶巅峰，而你只是八阶初期……", 
        xp_value: 1134903170, 
        rank: 3616,
        image: "image/enemy/E3616.png",
        realm: "<span class=realm_sky><b>天空级八阶</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 320e8, attack: 21e8, agility: 17.0e8, attack_speed: 1.3, defense:12e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.010},
            {item_name: "传说红宝石", chance:0.004},
            {item_name: "传承水晶·蓝", chance:0.022},
            //1.6B
        ],
    });
    enemy_templates["幻境石灵"] = new Enemy({
        name: "幻境石灵", 
        description: "如果生命倍率一直这样提高，这些石头怪迟早会变成问题的?内甲的A.mul会保护大家的！", 
        xp_value: 1836311903, 
        rank: 3617,
        image: "image/enemy/E3617.png",
        realm: "<span class=realm_sky><b>天空级八阶 +</b></span>",
        size: "small",
        spec: [1],
        tags: [],
        stats: {health: 96, attack: 28.8e8, agility: 28.0e8, attack_speed: 1.3, defense:24e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.004},
            {item_name: "传说红宝石", chance:0.010},
            {item_name: "传承水晶·蓝", chance:0.044},
            //2.8B
        ],
    });
    enemy_templates["磐石蜘蛛"] = new Enemy({
        name: "磐石蜘蛛", 
        description: "蜘蛛类绝对是最强的荒兽。每回合高百分比而且无上限的回血呢。", 
        xp_value: 1836311903, 
        rank: 3618,
        image: "image/enemy/E3618.png",
        realm: "<span class=realm_sky><b>天空级八阶 +</b></span>",
        size: "small",
        spec: [31],
        tags: [],
        stats: {health: 409.6e8, attack: 33e8, agility: 29.0e8, attack_speed: 1.3, defense:22e8}, //血量40%
        loot_list: [
            {item_name: "传说蓝宝石", chance:0.004},
            {item_name: "传说红宝石", chance:0.010},
            {item_name: "传承水晶·白", chance:0.08},
            //2.8B
        ],
    });

    
    //【LIFE CHANGE】
    // 40%↑
    //
    // 50%↓

    enemy_templates["心魔"] = new Enemy({
        name: "心魔", 
        description: "和那只BOSS级的有相同的弱点。可以干死四只就可以干死它！", 
        xp_value: 2971215073, 
        rank: 3701,
        image: "image/enemy/E3701.png",
        realm: "<span class=realm_sky><b>天空级巅峰</b></span>",
        size: "small",
        spec: [52,33,53],
        spec_value:{33:13},
        tags: [],
        stats: {health: 2222e8, attack: 56.78e8, agility: 30e8, attack_speed: 1.0, defense:0e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.008},
            {item_name: "传说绿宝石", chance:0.003},
            {item_name: "天空级魂魄", chance:0.023},
            //5B
        ],
    });
    enemy_templates["燕岗辉煌佣兵"] = new Enemy({
        name: "燕岗辉煌佣兵", 
        description: "我乃蓝玉职业者巅峰！何人能杀我，何人敢杀我？", 
        xp_value: 2971215073, 
        rank: 3702,
        image: "image/enemy/E3702.png",
        realm: "<span class=realm_sky><b>天空级八阶 ++</b></span>",
        size: "small",
        spec: [6],
        tags: [],
        stats: {health: 440e8, attack: 36e8, agility: 32e8, attack_speed: 1.5, defense:22e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.008},
            {item_name: "传说绿宝石", chance:0.003},
            {item_name: "传承水晶·白", chance:0.05},
            {item_name: "传承水晶·橙", chance:0.062},
            //5B
        ],
    });
    enemy_templates["地宫虫将"] = new Enemy({
        name: "地宫虫将", 
        description: "从卒到将的属性加了五个数量级……【地宫虫劫】是不是达到不朽神灵级了？", 
        xp_value: 2971215073, 
        rank: 3703,
        image: "image/enemy/E3703.png",
        realm: "<span class=realm_sky><b>天空级八阶 ++</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 1100e8, attack: 38e8, agility: 34e8, attack_speed: 1.4, defense:20e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.008},
            {item_name: "传说绿宝石", chance:0.003},
            {item_name: "传承水晶·粉", chance:0.02},
            {item_name: "天空级魂魄", chance:0.012},
            //5B
        ],
    });
    enemy_templates["地宫不眠者"] = new Enemy({
        name: "地宫不眠者", 
        description: "原来熬夜不睡觉可以进入别人的心魔幻境！奇怪的知识又增加了。", 
        xp_value: 2971215073, 
        rank: 3704,
        image: "image/enemy/E3704.png",
        realm: "<span class=realm_sky><b>天空级八阶 ++</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 250e8, attack: 55e8, agility: 36e8, attack_speed: 1.4, defense:27.5e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.008},
            {item_name: "传说绿宝石", chance:0.003},
            {item_name: "天空级魂魄", chance:0.025},
            //5B
        ],
    });
    enemy_templates["地下焚天火"] = new Enemy({
        name: "地下焚天火", 
        description: "打人非常痛！不过生命如风中残烛……台风中篝火？总之很容易灭就是了。", 
        xp_value: 2971215073, 
        rank: 3705,
        image: "image/enemy/E3705.png",
        realm: "<span class=realm_sky><b>天空级巅峰</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 75e8, attack: 90e8, agility: 38e8, attack_speed: 1.4, defense:35e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.008},
            {item_name: "传说绿宝石", chance:0.003},
            {item_name: "天空级魂魄", chance:0.026},
            //5B
        ],
    });
    
    enemy_templates["燕岗城卫队长"] = new Enemy({
        name: "燕岗城卫队长", 
        description: "之前就是你小子把坚固队员派到光环怪旁边的？", 
        xp_value: 2971215073, 
        rank: 3706,
        image: "image/enemy/E3706.png",
        realm: "<span class=realm_sky><b>天空级八阶 ++</b></span>",
        size: "small",
        spec: [1],
        tags: [],
        stats: {health: 160, attack: 44.44e8, agility: 40e8, attack_speed: 1.4, defense:0e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.008},
            {item_name: "传说绿宝石", chance:0.003},
            {item_name: "传承水晶·粉", chance:0.02},
            {item_name: "天空级魂魄", chance:0.012},
            //5B
        ],
    });

    enemy_templates["秘境荧光帕芙"] = new Enemy({
        name: "秘境荧光帕芙", 
        description: "最近，好多人都在抓的闪光品种，是这个吗？", 
        xp_value: 2971215073, 
        rank: 3707,
        image: "image/enemy/E3707.png",
        realm: "<span class=realm_sky><b>天空级巅峰</b></span>",
        size: "small",
        spec: [0],
        tags: [],
        stats: {health: 320e8, attack: 32e8, agility: 42e8, attack_speed: 1.4, defense:32e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.008},
            {item_name: "传说绿宝石", chance:0.003},
            {item_name: "传承水晶·白", chance:0.06},
            {item_name: "传承水晶·橙", chance:0.06},
            //5B
        ],
    });
    enemy_templates["秘境闪耀精灵"] = new Enemy({
        name: "秘境闪耀精灵", 
        description: "更亮了！惑幻……说起来，明明是幻境，它居然是第一只有这种属性的敌人吗？", 
        xp_value: 2971215073, 
        rank: 3708,
        image: "image/enemy/E3708.png",
        realm: "<span class=realm_sky><b>天空级巅峰</b></span>",
        size: "small",
        spec: [13,27],
        tags: [],
        stats: {health: 344.45e8, attack: 49e8, agility: 44e8, attack_speed: 1.4, defense:33e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.008},
            {item_name: "传说绿宝石", chance:0.003},
            {item_name: "传承水晶·粉", chance:0.05},
            //5B
        ],
    });
    enemy_templates["喵咕啦"] = new Enemy({
        name: "喵咕啦", 
        description: "这种生物是怎么拟态成姐姐的样子的……衣服可以模拟，那皮肤呢？", 
        xp_value: 2971215073, 
        rank: 3709,
        image: "image/enemy/E3709.png",
        realm: "<span class=realm_sky><b>天空级巅峰</b></span>",
        size: "small",
        spec: [21],
        spec_value:{21:60e8},
        tags: [],
        stats: {health: 555.5e8, attack: 1e4, agility: 46e8, attack_speed: 1.4, defense:37.5e8}, //血量50%(x)
        loot_list: [
            {item_name: "传说红宝石", chance:0.008},
            {item_name: "传说绿宝石", chance:0.003},
            {item_name: "紫晶碎片", chance:0.018},
            //5B
        ],
    });
    enemy_templates["残雪灵阵"] = new Enemy({
        name: "残雪灵阵", 
        description: "相传，在一个魔女之力满地飞的时间线，许多残雪灵阵被释放进了地宫。好在这里没有那种事情。", 
        xp_value: 2971215073, 
        rank: 3710,
        image: "image/enemy/E3710.png",
        realm: "<span class=realm_sky><b>天空级巅峰</b></span>",
        size: "small",
        spec: [11],
        tags: [],
        stats: {health: 1e4, attack: 1e4, agility: 48e8, attack_speed: 1.4, defense:42e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.008},
            {item_name: "传说绿宝石", chance:0.003},
            {item_name: "紫晶碎片", chance:0.020},
            //5B
        ],
    });
    enemy_templates["晓雪魅蝠"] = new Enemy({
        name: "晓雪魅蝠", 
        description: "名字前面加一个晓的确听起来厉害多了！越打血越多的可恶蝙蝠……", 
        xp_value: 2971215073, 
        rank: 3711,
        image: "image/enemy/E3711.png",
        realm: "<span class=realm_sky><b>天空级巅峰</b></span>",
        size: "small",
        spec: [31],
        tags: [],
        stats: {health: 451.25e8, attack: 52e8, agility: 50e8, attack_speed: 1.4, defense:36e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.008},
            {item_name: "传说绿宝石", chance:0.003},
            {item_name: "紫晶碎片", chance:0.022},
            //5B
        ],
    });
    enemy_templates["威武星骑士"] = new Enemy({
        name: "威武星骑士", 
        description: "幸好结界湖的蓝帽行者没有戴着更大的帽子出现在这里。否则它大概能有几兆血。", 
        xp_value: 4807526976, 
        rank: 3712,
        image: "image/enemy/E3712.png",
        realm: "<span class=realm_sky><b>天空级巅峰 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 1352e8, attack: 63e8, agility: 52e8, attack_speed: 1.4, defense:27e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.003},
            {item_name: "传说绿宝石", chance:0.008},
            {item_name: "紫晶碎片", chance:0.027},
            //9B
        ],
    });
    enemy_templates["圣荒城头目"] = new Enemy({
        name: "圣荒城头目", 
        description: "幻境也复刻了对应城市居民的弱点！无伤它的方法已经昭然若揭了。", 
        xp_value: 4807526976, 
        rank: 3713,
        image: "image/enemy/E3713.png",
        realm: "<span class=realm_sky><b>天空级巅峰 +</b></span>",
        size: "small",
        spec: [18],
        spec_value: {18:1e15},
        tags: [],
        stats: {health: 1104.5e8, attack: 63e8, agility: 48e8, attack_speed: 1.4, defense:37e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.003},
            {item_name: "传说绿宝石", chance:0.008},
            {item_name: "传承水晶·白", chance:0.04},
            {item_name: "传承水晶·橙", chance:0.04},
            {item_name: "传承水晶·粉", chance:0.04},
            //9B
        ],
    });
    enemy_templates["兰陵城头目"] = new Enemy({
        name: "兰陵城头目", 
        description: "这只也差不多！虽然冰宫幻境本身在燕岗领深处，但幻境中的灵却是恐惧显化而成。", 
        xp_value: 4807526976, 
        rank: 3714,
        image: "image/enemy/E3714.png",
        realm: "<span class=realm_sky><b>天空级巅峰 +</b></span>",
        size: "small",
        spec: [39],
        spec_value: {39:5000e8},
        tags: [],
        stats: {health: 924.5e8, attack: 55e8, agility: 50e8, attack_speed: 1.4, defense:44e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.003},
            {item_name: "传说绿宝石", chance:0.008},
            {item_name: "幻境符文", chance:0.021},
            //9B
        ],
    });
    enemy_templates["战场不朽骸骨"] = new Enemy({
        name: "战场不朽骸骨", 
        description: "就连头骨都已然发黑。光环……甚至还增强了一些？", 
        xp_value: 4807526976, 
        rank: 3715,
        image: "image/enemy/E3715.png",
        realm: "<span class=realm_sky><b>天空级巅峰 +</b></span>",
        size: "small",
        spec: [11],
        tags: [],
        stats: {health: 900e8, attack: 65e8, agility: 52e8, attack_speed: 1.4, defense:30e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.003},
            {item_name: "传说绿宝石", chance:0.008},
            {item_name: "幻境符文", chance:0.024},
            //9B
        ],
    });
    enemy_templates["血腥追风者"] = new Enemy({
        name: "血腥追风者", 
        description: "【废墟追风者】的概念扰动延续到幻境了！毕竟追光作为小怪技能也太超模了啦……", 
        xp_value: 4807526976, 
        rank: 3716,
        image: "image/enemy/E3716.png",
        realm: "<span class=realm_sky><b>天空级巅峰 +</b></span>",
        size: "small",
        spec: [36,16],
        tags: [],
        stats: {health: 1350e8, attack: 65e8, agility: 52e8, attack_speed: 1.4, defense:30e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.003},
            {item_name: "传说绿宝石", chance:0.008},
            {item_name: "幻境符文", chance:0.027},
            //9B
        ],
    });
    enemy_templates["黄桃重工B9"] = new Enemy({
        name: "黄桃重工B9", 
        description: "呵，长大了。饮盾倍率也高了十倍。不过——普攻倍率翻了可不止十倍啊！", 
        xp_value: 4807526976, 
        rank: 3717,
        image: "image/enemy/E3717.png",
        realm: "<span class=realm_sky><b>天空级巅峰 +</b></span>",
        size: "small",
        spec: [12,47],
        tags: [],
        stats: {health: 100e8, attack: 68e8, agility: 60e8, attack_speed: 1.5, defense:54e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.003},
            {item_name: "传说绿宝石", chance:0.008},
            {item_name: "引力反常", chance:0.022},
            //9B
        ],
    });
    enemy_templates["不可能三角B9"] = new Enemy({
        name: "不可能三角B9", 
        description: "有没有一种可能……我是说可能……它有一堆战前给自己上buff的属性，只是我们不知道？", 
        xp_value: 4807526976, 
        rank: 3718,
        image: "image/enemy/E3718.png",
        realm: "<span class=realm_sky><b>天空级巅峰 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 1512.5e8, attack: 77e8, agility: 64e8, attack_speed: 1.6, defense:48e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.003},
            {item_name: "传说绿宝石", chance:0.008},
            {item_name: "引力反常", chance:0.024},
            //9B
        ],
    });
    enemy_templates["极寒之锋B9"] = new Enemy({
        name: "极寒之锋B9", 
        description: "或许我永远不会忘记被鲜血之锋B1支配的恐惧的。另外，生命限制……牵制出3.0版了？！", 
        xp_value: 4807526976, 
        rank: 3719,
        image: "image/enemy/E3719.png",
        realm: "<span class=realm_sky><b>天空级巅峰 +</b></span>",
        size: "small",
        spec: [49,54],
        spec_value:{49:{rnd:648,hp:10e8}},
        tags: [],
        stats: {health: 6480e8, attack: 88e8, agility: 68e8, attack_speed: 1.4, defense:1e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.003},
            {item_name: "传说绿宝石", chance:0.008},
            {item_name: "传承水晶·蓝", chance:0.02},
            {item_name: "紫晶碎片", chance:0.03},
            //9B
        ],
    });
    enemy_templates["金色血眼B9"] = new Enemy({
        name: "金色血眼B9", 
        description: "简单的技能，极……和我的月轮说去吧！", 
        xp_value: 4807526976, 
        rank: 3720,
        image: "image/enemy/E3720.png",
        realm: "<span class=realm_sky><b>天空级巅峰 +</b></span>",
        size: "small",
        spec: [1],
        tags: [],
        stats: {health: 140, attack: 80e8, agility: 72e8, attack_speed: 1.5, defense:70e8}, //血量50%
        loot_list: [
            {item_name: "传说红宝石", chance:0.003},
            {item_name: "传说绿宝石", chance:0.008},
            {item_name: "引力反常", chance:0.026},
            //9B
        ],
    });
    enemy_templates["恐怖机人B9"] = new Enemy({
        name: "恐怖机人B9", 
        description: "道理我都懂，为什么你不是32*32的？异界之门原来是传送门啊！", 
        xp_value: 4807526976, 
        rank: 3721,
        image: "image/enemy/E3721.png",
        realm: "<span class=realm_sky><b>天空级巅峰 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 1200e8, attack: 81e8, agility: 76e8, attack_speed: 1.5, defense:60e8}, //血量50%*5(异界)
        loot_list: [
            {item_name: "传说红宝石", chance:0.003},
            {item_name: "传说绿宝石", chance:0.008},
            {item_name: "引力反常", chance:0.028},
            //9B
        ],
    });
    enemy_templates["冈崎喵妖"] = new Enemy({
        name: "冈崎喵妖", 
        description: "恐怖爆攻……你的迅捷哪去了！不会以为这么脆也打得到人吧？", 
        xp_value: 7778742049, 
        rank: 3722,
        image: "image/enemy/E3722.png",
        realm: "<span class=realm_sky><b>天空级巅峰 ++</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 90e8, attack: 240e8, agility: 88e8, attack_speed: 1.7, defense:80e8}, //血量50%
        loot_list: [
            {item_name: "传说绿宝石", chance:0.015},
            {item_name: "天空级魂魄", chance:0.075},
            //16B
        ],
    });
    enemy_templates["血洛大陆骨干"] = new Enemy({
        name: "血洛大陆骨干", 
        description: "骨干从骨头变成了帅气的机甲啊！难怪燕岗城主府一直以来都不算太强的样子", 
        xp_value: 7778742049, 
        rank: 3723,
        image: "image/enemy/E3723.png",
        realm: "<span class=realm_sky><b>天空级巅峰 ++</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 720e8, attack: 112e8, agility: 96e8, attack_speed: 1.5, defense:60e8}, //血量50%
        loot_list: [
            {item_name: "传说绿宝石", chance:0.015},
            {item_name: "幻境符文", chance:0.041},
            //16B
        ],
    });
    enemy_templates["扭曲毒虫"] = new Enemy({
        name: "扭曲毒虫", 
        description: "加强自己和削弱敌人的手段简直出神入化。什么时候纳可也可以学会这些呢？", 
        xp_value: 7778742049, 
        rank: 3724,
        image: "image/enemy/E3724.png",
        realm: "<span class=realm_sky><b>天空级巅峰 ++</b></span>",
        size: "small",
        spec: [8,19,46,47],
        spec_value:{8:10},
        tags: [],
        stats: {health: 1056e8, attack: 85e8, agility: 88e8, attack_speed: 1.4, defense:50e8}, //血量50%
        loot_list: [
            {item_name: "传说绿宝石", chance:0.015},
            {item_name: "引力反常", chance:0.035},
            //16B
        ],
    });
    enemy_templates["狠咕兽"] = new Enemy({
        name: "狠咕兽", 
        description: "版本更新了……现在纯度不高的堆数值没用了啦。和我的普攻倍率说去吧！", 
        xp_value: 7778742049, 
        rank: 3725,
        image: "image/enemy/E3725.png",
        realm: "<span class=realm_sky><b>天空级巅峰 ++</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 2777.5e8, attack: 110e8, agility: 100e8, attack_speed: 1.5, defense:55e8}, //血量50%
        loot_list: [
            {item_name: "传说绿宝石", chance:0.015},
            {item_name: "紫晶碎片", chance:0.048},
            //16B
        ],
    });
    enemy_templates["超量凶悍树妖"] = new Enemy({
        name: "超量凶悍树妖", 
        description: "一般来说，超出常规巅峰2倍的基础数值即可被称为【超量/破限】，领取【喽啰/人阶】等阶位……<br>但为了直观起见，喵可RPG全部使用加号！", 
        xp_value: 7778742049, 
        rank: 3726,
        image: "image/enemy/E3726.png",
        realm: "<span class=realm_sky><b>天空级巅峰 ++</b></span>",
        size: "small",
        spec: [31],
        tags: [],
        stats: {health: 1000e8, attack: 110e8, agility:104e8, attack_speed: 1.5, defense:50e8}, //血量50%
        loot_list: [
            {item_name: "传说绿宝石", chance:0.015},
            {item_name: "传承水晶·粉", chance:0.12},
            //16B
        ],
    });
    enemy_templates["暗杀飞蛾"] = new Enemy({
        name: "暗杀飞蛾", 
        description: "非常遗憾，暗杀什么的在这里不生效——你在战斗框里就是索敌对象！", 
        xp_value: 7778742049, 
        rank: 3727,
        image: "image/enemy/E3727.png",
        realm: "<span class=realm_sky><b>天空级巅峰 ++</b></span>",
        size: "small",
        spec: [26],
        tags: [],
        stats: {health: 216e8, attack: 108.9e8, agility:100e8, attack_speed: 1.5, defense:88.36e8}, //血量50%
        loot_list: [
            {item_name: "传说绿宝石", chance:0.015},
            {item_name: "幻境符文", chance:0.052},
            //16B
        ],
    });
    enemy_templates["古龙小兽"] = new Enemy({
        name: "古龙小兽", 
        description: "【古龙】可是这里最强的龙族！每一条都有成年<span class='realm_cloudy'>云霄级巅峰</span>的血脉。不过它大概长不大就是了。", 
        xp_value: 7778742049, 
        rank: 3728,
        image: "image/enemy/E3728.png",
        realm: "<span class=realm_sky><b>天空级巅峰 ++</b></span>",
        size: "small",
        spec: [26],
        tags: [],
        stats: {health: 2000e8, attack: 125e8, agility:108e8, attack_speed: 1.5, defense:72e8}, //血量50%
        loot_list: [
            {item_name: "传说绿宝石", chance:0.015},
            {item_name: "紫晶碎片", chance:0.052},
            //16B
        ],
    });
    enemy_templates["巨人强豪"] = new Enemy({
        name: "巨人强豪", 
        description: "还记得无限秘境的【巨人先锋】吗……如果秘境不封顶，891,880层的它将会拥有这一只的攻击强度。", 
        xp_value: 7778742049, 
        rank: 3729,
        image: "image/enemy/E3729.png",
        realm: "<span class=realm_sky><b>天空级巅峰 ++</b></span>",
        size: "small",
        spec: [16],
        tags: [],
        stats: {health: 750e8, attack: 132e8, agility:112e8, attack_speed: 1.5, defense:90e8}, //血量50%
        loot_list: [
            {item_name: "传说绿宝石", chance:0.015},
            {item_name: "天空级魂魄", chance:0.081},
            //16B
        ],
    });
    enemy_templates["血洛流浪剑客"] = new Enemy({
        name: "血洛流浪剑客", 
        description: "又一个流浪进来的！真想学天剑呐……普攻倍率是不缺，但攻击乘区可是缺的很。", 
        xp_value: 7778742049, 
        rank: 3730,
        image: "image/enemy/E3730.png",
        realm: "<span class=realm_sky><b>天空级巅峰 ++</b></span>",
        size: "small",
        spec: [10,20],
        tags: [],
        stats: {health: 1104.5e8, attack: 133e8, agility:116e8, attack_speed: 1.5, defense:78e8}, //血量50%
        loot_list: [
            {item_name: "传说绿宝石", chance:0.015},
            {item_name: "魂晶锭", chance:0.022},
            //16B
        ],
    });
    enemy_templates["大门派精英"] = new Enemy({
        name: "大门派精英", 
        description: "拥有着极为深厚的积累，如果想要突破的话它随时都可以突破。不过，毕竟成为【心之灵】的一员的未来还是太黑暗了……", 
        xp_value: 12586269025, 
        rank: 3731,
        image: "image/enemy/E3731.png",
        realm: "<span class=realm_sky><b>天空级巅峰 +++</b></span>",
        size: "small",
        spec: [33,34],
        spec_value:{33:5},
        tags: [],
        stats: {health: 1521e8, attack: 114e8, agility:120e8, attack_speed: 1.2, defense:94e8}, //血量100%
        loot_list: [
            {item_name: "传说绿宝石", chance:0.03},
            {item_name: "宇宙币", chance:0.028},
            //28B
        ],
    });




    
    /*
     红   绿 
B9  0.8% 0.3% 5B
B9+ 0.3% 0.8% 9B
B9++ ？？？
B7 4'3349'4437 /7'0140'8733 exp
B8 11'3490'3170/18'3631'1903exp
B9 29'7121'5073/48'0752'6976exp

B9++ 7,778,742,049exp 16B

火烈茸茸和幻境飞蛾换位


圣荒城头目开始9阶+
冈崎喵妖开始9阶++(考虑到C1=B9+4 B9+2是常规等级)
大门派精英独占9阶+++(经验和C1一致 掉落比C1少半档)



*/    
})();


//challenge enemies
(function(){
    enemy_templates["纳家待从[BOSS]"] = new Enemy({
        name: "Na Family Attendant [BOSS]",
        description: "A Na Family Attendant using its full power. Fighting on home turf means no holding back!",
        add_to_bestiary: true,
        xp_value: 13, 
        rank: 1199,
        image: "image/boss/B1101.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Pinnacle</b></span>",
        size: "small",
        spec: [5],
        tags: [],
        stats: {health: 3444, attack: 111, agility: 60, attack_speed: 1.1, defense: 44}, //可能改动
        loot_list: [
            {item_name: "初始红宝石", chance:1.0},
            {item_name: "初始红宝石", chance:1.0},
            {item_name: "初始蓝宝石", chance:1.0},
            {item_name: "初始蓝宝石", chance:1.0},//固定掉落
        ],
    });
    enemy_templates["百家小卒[BOSS]"] = new Enemy({
        name: "Hundred Clans Pawn [BOSS]",
        description: "A Hundred Clans Pawn going all-out to seize the secret technique.",
        add_to_bestiary: true,
        xp_value: 13, 
        rank: 1298,
        image: "image/boss/B1201.png",
        realm: "<span class=realm_basic><b>Myriad Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [2],
        tags: [],
        stats: {health: 6600, attack: 144, agility: 90, attack_speed: 1.1, defense: 60}, //与原作相同
        loot_list: [
            {item_name: "银钱", chance: 1},
            {item_name: "银钱", chance: 1},
            //奖励在秘法石碑后面
        ],
    });
    enemy_templates["腐蚀质石精[BOSS]"] = new Enemy({
        name: "Corrosive Stone Spirit [BOSS]",
        description: "A large rock by the city gate. It harbors a natural hatred for humans and will fight to the death.",
        add_to_bestiary: true,
        xp_value: 34, 
        rank: 1299,
        image: "image/boss/B1202.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Expert</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 17700, attack: 380, agility: 200, attack_speed: 1.2, defense: 160}, //可能改动
        loot_list: [
            {item_name: "初始绿宝石", chance:1.0},
            {item_name: "初始绿宝石", chance:1.0},
            {item_name: "毒液", chance: 1},
            {item_name: "毒液", chance: 1},
        ],
    });
    enemy_templates["百兰[BOSS]"] = new Enemy({
        name: "Bai Lan [BOSS]",
        description: "The man outside the city. He looks down on Neko, but his strength isn't much greater than Neko's.",
        add_to_bestiary: true,
        xp_value: 34, 
        rank: 1398,
        image: "image/boss/B1301.png",
        realm: "<span class=realm_basic><b>Tidal Rank: Expert</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 9000, attack: 540, agility: 200, attack_speed: 1.2, defense: 50}, //可能改动
        loot_list: [
            {item_name: "初始绿宝石", chance:1.0},
            {item_name: "初始绿宝石", chance:1.0},
        ],
    });
    enemy_templates["燕岗领佣兵[BOSS]"] = new Enemy({
        name: "Yangang Domain Mercenary [BOSS]",
        description: "A mercenary guarding the dungeon entrance, waiting for the right moment. Has already ambushed many cultivators and amassed considerable reserves.",
        add_to_bestiary: true,
        xp_value: 144, 
        rank: 1399,
        image: "image/boss/B1302.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 1</b></span>",
        size: "small",
        spec: [2],
        tags: [],
        stats: {health: 29900, attack: 1225, agility: 600, attack_speed: 1.2, defense: 400}, 
        loot_list: [
            //{item_name: "高级黄宝石", chance:1},
            //{item_name: "高级黄宝石", chance:1},
        ],
    });
    enemy_templates["地宫看门人[BOSS]"] = new Enemy({
        name: "Dungeon Gatekeeper [BOSS]",
        description: "Rumor has it, someone's out there stacking iron-quality skin layers...",
        add_to_bestiary: true,
        xp_value: 987, 
        rank: 1497,
        image: "image/boss/B1401.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 3</b></span>",
        size: "small",
        spec: [28],
        tags: [],
        stats: {health: 270000, attack: 7500, agility: 5000, attack_speed: 1.2, defense: 3750}, 
        loot_list: [
            {item_name: "高级红宝石", chance:1},
            {item_name: "高级红宝石", chance:1},
            {item_name: "黑色刀币", chance:1},
        ],
    });
    
    enemy_templates["行走树妖[BOSS]"] = new Enemy({
        name: "Walking Tree Fiend [BOSS]",
        description: "A remarkably agile tree fiend. To get close, you must be prepared to take a charged lash from each of its 20 willow branches first!",
        add_to_bestiary: true,
        xp_value: 377, 
        rank: 1498,
        image: "image/boss/B1402.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 2</b></span>",
        size: "small",
        spec: [16],
        tags: [],
        stats: {health: 135000, attack: 2900, agility: 2000, attack_speed: 1.2, defense: 1800}, 
        loot_list: [
            {item_name: "三月断宵", chance:1},
        ],
    });
    enemy_templates["深邃之影[BOSS]"] = new Enemy({
        name: "Shadow of the Deep [BOSS]",
        description: "A well-balanced elite wild beast, gatekeeper of the dungeon core.",
        add_to_bestiary: true,
        xp_value: 377, 
        rank: 1499,
        image: "image/boss/B1403.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 2</b></span>",
        size: "small",
        spec: [17],
        tags: [],
        stats: {health: 81000, attack: 4800, agility: 2000, attack_speed: 1.2, defense: 2000}, 
        loot_list: [
            {item_name: "高级红宝石", chance:1},
            {item_name: "高级蓝宝石", chance:1},
            {item_name: "高级蓝宝石", chance:1},
        ],
    });
    
    enemy_templates["地下岩火[BOSS]"] = new Enemy({
        name: "Underground Lava [BOSS]",
        description: "Why is this trashy boss so fragile! Looks like it can be killed in one hit.",
        xp_value: 610, 
        rank: 1597,
        image: "image/boss/B1501.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 2 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 10800, attack:16000, agility: 5400, attack_speed: 1.2, defense: 4000}, 
        loot_list: [
            {item_name: "极品黄宝石", chance:1.00},
            //应为28X
        ],
    });
    enemy_templates["喵咕哩[BOSS]"] = new Enemy({
        name: "Nyaguri [BOSS]",
        description: "~Full·HP·True·God·Descends~ Powerful, no further words needed!",
        xp_value: 1587, 
        rank: 1598,
        image: "image/boss/B1502.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 3 +</b></span>",
        size: "small",
        spec: [21],
        spec_value:{21:8000},
        tags: [],
        stats: {health: 365000, attack:10040, agility: 8000, attack_speed: 1.2, defense: 2333}, 
        loot_list: [
        ],
    });
    enemy_templates["地宫养殖者[BOSS]"] = new Enemy({
        name: "Dungeon Breeder [BOSS]",
        id: "地宫养殖者[BOSS]",
        description: "The final boss of Act 1. You might not be able to beat 2-5 normally, thankfully there is the laser gun...",
        xp_value: 1346269,
        rank: 1599,
        image: "image/boss/B1503.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1</b></span>",
        size: "small",
        spec: [28],
        spec_value:{},
        tags: [],
        stats: {health: 120000000, attack:4000000, agility: 800000, attack_speed: 1.0, defense: 600000}, 
        loot_list: [],
    });
    enemy_templates["百家近卫[BOSS]"] = new Enemy({
        name: "Baifang's Guard [BOSS]",
        description: "The guard accompanying Baifang. Why would the young master bring a guard weaker than himself...",
        xp_value: 7575, 
        rank: 2198,
        image: "image/boss/B2101.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 5</b></span>",
        size: "small",
        spec: [33],
        spec_value:{33:6},
        tags: [],
        stats: {health: 2000000, attack:44000, agility: 24000, attack_speed: 1.2, defense: 22000}, 
        loot_list: [{item_name:"极品蓝宝石",chance:1.00}],
    });
    enemy_templates["百方[荒兽森林 ver.][BOSS]"] = new Enemy({
        name: "Baifang [Wild Beast Forest ver.] [BOSS]",
        description: "Only two tiers below the spaceship version of Baifang, yet stats are 20+ times weaker. The gap in late Earth Rank is just too massive.",
        xp_value: 46368, 
        rank: 2199,
        image: "image/boss/B2102.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7</b></span>",
        size: "small",
        spec: [32,34],
        spec_value:{},
        tags: [],
        stats: {health: 38400000, attack:192000, agility: 96000, attack_speed: 1.2, defense: 63000}, 
        loot_list: [{item_name:"玻璃小炮",chance:1.00}],
    });
    enemy_templates["威武武士[BOSS]"] = new Enemy({
        name: "Mighty Warrior [BOSS]",
        description: "Well, this is what they call trespassing... How did the 2-4 warrior end up here!",
        xp_value: 46368, 
        rank: 2297,
        image: "image/boss/B2201.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 7500000, attack:370000, agility: 120000, attack_speed: 1.2, defense: 30000}, 
        loot_list: [{item_name:"极品绿宝石",chance:1.00},{item_name:"极品绿宝石",chance:1.00}],
    });
    enemy_templates["礁石灵[BOSS]"] = new Enemy({
        name: "Reef Spirit [BOSS]",
        description: "A hard rock blocking the path to Qingye Waterfall. Friendly reminder: normal attack multiplier is calculated after Fortify!",
        xp_value: 17711, 
        rank: 2298,
        image: "image/boss/B2202.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6</b></span>",
        size: "small",
        spec: [1],
        spec_value:{},
        tags: [],
        stats: {health: 200, attack:88000, agility: 54000, attack_speed: 1.0, defense: 55000}, 
        loot_list: [],
    });
    enemy_templates["大门派杂役[BOSS]"] = new Enemy({
        name: "Major Sect Servant [BOSS]",
        description: "Worthy of a major sect, even the servants are this strong... the small-faction explorers from before were nearly broke!",
        xp_value: 17711, 
        rank: 2299,
        image: "image/boss/B2203.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 6</b></span>",
        size: "small",
        spec: [32,6],
        spec_value:{},
        tags: [],
        stats: {health: 3900000, attack:125000, agility: 60000, attack_speed: 1.2, defense: 15000}, 
        loot_list: [{item_name:"极品红宝石",chance:3.00}],
    });
    enemy_templates["秘境心火精灵[BOSS]"] = new Enemy({
        name: "Secret Realm Heart-Flame Spirit [BOSS]",
        id: "秘境心火精灵[BOSS]",
        description: "Already strong enough, and it uses a halo too... thankfully the halo can be removed!",
        xp_value: 46368, 
        rank: 2399,
        image: "image/boss/B2301.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7</b></span>",
        size: "small",
        spec: [27,13],
        spec_value:{},
        tags: [],
        stats: {health: 3200000, attack:280000, agility: 150000, attack_speed: 1.2, defense: 120000}, 
        loot_list: [{item_name:"极品绿宝石",chance:4.00}],
    });
    
    enemy_templates["蓝帽行者[BOSS]"] = new Enemy({
        name: "Blue-Hat Wanderer [BOSS]",
        description: "Wait... how much HP?!",
        xp_value: 75025, 
        rank: 2499,
        image: "image/boss/B2403.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7 +</b></span>",
        size: "small",
        spec: [3,5],
        spec_value:{},
        tags: [],
        stats: {health: 150000000, attack:400000, agility: 250000, attack_speed: 1.2, defense: 40000}, 
        loot_list: [
        ],
    });
    enemy_templates["流云级魔法师[BOSS]"] = new Enemy({
        name: "Drifting Cloud Mage [BOSS]",
        description: "There is a damage-tanker up front, hehehehe~",
        xp_value: 75025, 
        rank: 2497,
        image: "image/boss/B2401.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7 +</b></span>",
        size: "small",
        spec: [0,6],
        spec_value:{},
        tags: [],
        stats: {health: 2560000, attack:80000, agility: 260000, attack_speed: 1.2, defense: 240000}, 
        loot_list: [
        ],
    });
    enemy_templates["威武异衣士[BOSS]"] = new Enemy({
        name: "Mighty Exotic Warrior [BOSS]",
        description: "Can deal decent damage and also has damage-tanking ability. Seems quite important under 4-hit attacks.",
        xp_value: 75025, 
        rank: 2498,
        image: "image/boss/B2402.png",
        realm: "<span class=realm_terra><b>Earth Rank: Stage 7 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 22000000, attack:560000, agility: 270000, attack_speed: 1.2, defense: 90000}, 
        loot_list: [
        ],
    });

    
    enemy_templates["废墟追光者[BOSS]"] = new Enemy({
        name: "Ruin Light-Chaser [BOSS]",
        description: "Fighting head-on will likely get you demolished by the light-chasing. But the light-chasing only has 3 damage hits~",
        xp_value: 317811, 
        rank: 2599,
        image: "image/boss/B2501.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle</b></span>",
        size: "small",
        spec: [23,40],
        spec_value:{},
        tags: [],
        stats: {health: 102000000, attack:1600000, agility: 800000, attack_speed: 1.0, defense: 520000}, 
        loot_list: [{item_name:"殿堂蓝宝石",chance:4.00}],
    });
    
    enemy_templates["初级卫兵A9[BOSS]"] = new Enemy({
        name: "Junior Guard A9 [BOSS]",
        description: "Sublimation is such a troublesome insight... Crescent Moon Blessing or Magic Attack Potion, which do you prefer~",
        xp_value: 514229, 
        rank: 2699,
        image: "image/boss/B2601.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [37],
        spec_value:{},
        tags: [],
        stats: {health: 144000000, attack:3200000, agility: 1600000, attack_speed: 1.4, defense: 1250000}, 
        loot_list: [{item_name:"殿堂红宝石",chance:4.00}],
    });
    
    enemy_templates["百方[BOSS]"] = new Enemy({
        name: "Baifang [BOSS]",
        description: "This is the real one! Though the young master progresses a bit slowly compared to Neko~",
        xp_value: 514229, 
        rank: 2797,
        image: "image/boss/B2102.png",
        realm: "<span class=realm_terra><b>Earth Rank: Pinnacle +</b></span>",
        size: "small",
        spec: [32,34],
        spec_value:{},
        tags: [],
        stats: {health: 77700000, attack:4560000, agility: 2000000, attack_speed: 1.2, defense: 700000}, 
        loot_list: [{item_name:"玻璃大炮",chance:1.00,quality:160}],
    });

    enemy_templates["空间三角B1[BOSS]"] = new Enemy({
        name: "Space Triangle B1 [BOSS]",
        description: "So huge! So hard to beat! But it's a bit slow.",
        xp_value: 2178309, 
        rank: 2798,
        image: "image/boss/B2702.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [6],
        spec_value:{},
        tags: [],
        stats: {health: 105000000, attack:6500000, agility: 4000000, attack_speed: 0.9, defense: 3500000}, 
        loot_list: [{item_name:"殿堂绿宝石",chance:2.00}],
    });
    
    enemy_templates["储存姬B1[BOSS]"] = new Enemy({
        name: "Storage Princess B1 [BOSS]",
        description: "Ha~ Self-destruct! Let's see who dares complain about HP-boosting gems now~",
        xp_value: 2178309, 
        rank: 2799,
        image: "image/boss/B2703.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [36],
        spec_value:{},
        tags: [],
        stats: {health: 361000000, attack:9990000, agility: 4800000, attack_speed: 1.2, defense: 3340000}, 
        loot_list: [{item_name:"殿堂绿宝石",chance:2.00},{item_name:"摩羽币",chance:33.00}],
    });

    enemy_templates["银色血眼B1[BOSS]"] = new Enemy({
        name: "Silver Blood-Eye B1 [BOSS]",
        description: "Guarding what could be called a [massive] treasure, as an important story milestone — it has been powered up!",
        xp_value: 2178309, 
        rank: 2897,
        image: "image/boss/B2801.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [1],
        spec_value:{},
        tags: [],
        stats: {health: 2800, attack: 1100e4, agility: 600e4, attack_speed: 1.2, defense: 600e4}, 
        loot_list: [
            {item_name: "高能凝胶", chance:999},
            {item_name: "A7·能量核心", chance:999},
            {item_name: "B1·能量核心", chance:333},
            {item_name: "进化结晶凝聚-一学就会", chance:1},
            //大概3-4B了？
        ],
    });
    
    enemy_templates["质子粉碎机B1[BOSS]"] = new Enemy({
        name: "Proton Smasher B1 [BOSS]",
        description: "Oh no — quark confinement has broken down —",
        xp_value: 2178309, 
        rank: 2898,
        image: "image/boss/B2802.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 1 +</b></span>",
        size: "small",
        spec: [7],
        spec_value:{},
        tags: [],
        stats: {health: 14400e4, attack: 960e4, agility: 680e4, attack_speed: 1.6, defense: 500e4}, 
        loot_list: [
        ],
    });
    
    enemy_templates["舰船中枢B6[BOSS]"] = new Enemy({
        name: "Ship Core B6 [BOSS]",
        id: "舰船中枢B6[BOSS]",
        description: "The main combat core of the B6 spaceship. Swift movement speed, formidable combat power. However, it is now time for the laser gun to shine.",
        xp_value: 165580141,
        rank: 2899,
        image: "image/boss/B2803.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 6</b></span>",
        size: "small",
        spec: [45],//10回合
        spec_value:{},
        tags: [],
        stats: {health: 4225e8, attack: 168100e4, agility: 1200e4, attack_speed: 1.0, defense: 0}, 
        loot_list: [
            {item_name: "B6·飞船核心", chance:1 ,ignore_luck:true},
        ],
    });
    enemy_templates["魅影幻姬[BOSS]"] = new Enemy({
        name: "Phantom Illusion Princess [BOSS]",
        description: "A wild beast skilled in illusions. Not particularly powerful itself, but can make people lose their way without them realizing. Also, the 10x fixed vouchers are mid Sky-rank kill rewards, while the 4x affected vouchers drop from two elite mercenaries.",
        xp_value: 24157817, 
        rank: 3199,
        image: "image/boss/B3101.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4</b></span>",
        size: "small",
        spec: [13,0],
        spec_value:{},
        tags: [],
        stats: {health: 4.9e8, attack: 7000e4, agility: 3200e4, attack_speed: 1.5, defense: 1800e4}, 
        loot_list: [
            {item_name: "荒兽凭证", chance:4},
            {item_name: "沼泽兽油", chance:0.2},
            //抢劫了两只精英佣兵
            {item_name: "史诗蓝宝石", chance:1},
            {item_name: "荒兽凭证", chance:10,ignore_luck:true},
            //本身的掉落
        ],
    });
    enemy_templates["蛮咕兽[BOSS]"] = new Enemy({
        name: "Brute Goo Beast [BOSS]",
        description: "A tough-skinned and thick-fleshed wild beast. What is that reckless fellow over there doing!",
        xp_value: 24157817, 
        rank: 3298,
        image: "image/boss/B3201.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4</b></span>",
        size: "small",
        spec: [13,0],
        spec_value:{},
        tags: [],
        stats: {health: 33.32e8, attack: 6000e4, agility: 4500e4, attack_speed: 1.2, defense:3000e4}, 
        loot_list: [
            {item_name: "史诗红宝石", chance:1},
        ],
    });
    enemy_templates["天空级凶兽[BOSS]"] = new Enemy({
        name: "Sky-Rank Wild Beast [BOSS]",
        description: "What a sloppy name... truly just another nameless face among wild beasts.",
        xp_value: 63245986, 
        rank: 3299,
        image: "image/boss/B3202.png",
        realm: "<span class=realm_sky><b>Sky Rank: Stage 4 ++</b></span>",
        size: "small",
        spec: [20],
        spec_value:{},
        tags: [],
        stats: {health: 23e8, attack: 7000e4, agility: 5500e4, attack_speed: 1.2, defense:3500e4}, //血量200%
        loot_list: [
            {item_name: "史诗红宝石", chance:1},
            {item_name: "天空兽角", chance:4},
        ],
    });
    enemy_templates["探险者的怨恨[BOSS]"] = new Enemy({
        name: "探险者的怨恨[BOSS]", 
        description: "虽然有时封和200%血量，但是0防在普攻倍率面前~不堪一击！。", 
        xp_value: 102334155, 
        rank: 3397,
        image: "image/boss/B3301.png",
        realm: "<span class=realm_sky><b>天空级五阶 +</b></span>",
        size: "small",
        spec: [12],
        spec_value:{},
        tags: [],
        stats: {health: 18e8, attack: 39690e4, agility: 9000e4, attack_speed: 1.5, defense:0e4}, //血量200%
        loot_list: [
            {item_name: "万载冰髓锭", chance:2},
            {item_name: "史诗绿宝石", chance:1},
        ],
    });
    enemy_templates["敌意猎兵[BOSS]"] = new Enemy({
        name: "敌意猎兵[BOSS]", 
        description: "其实本来也不算特别强……但是它们六只来群殴你耶。", 
        xp_value: 102334155, 
        rank: 3398,
        image: "image/boss/B3302.png",
        realm: "<span class=realm_sky><b>天空级五阶 +</b></span>",
        size: "small",
        spec: [],
        spec_value:{},
        tags: [],
        stats: {health: 60.5e8, attack: 2.2e8, agility: 1.2e8, attack_speed: 1.2, defense:1.1e8}, //血量200%
        loot_list: [
        ],
    });
    enemy_templates["敌意女巫[BOSS]"] = new Enemy({
        name: "敌意女巫[BOSS]", 
        description: "躲在一大群猎兵后面来偷袭你！好屑啊……", 
        xp_value: 165580141, 
        rank: 3399,
        image: "image/boss/B3303.png",
        realm: "<span class=realm_sky><b>天空级六阶</b></span>",
        size: "small",
        spec: [0],
        spec_value:{},
        tags: [],
        stats: {health: 134.48e8, attack: 2.16e8, agility: 1.4e8, attack_speed: 1.5, defense:1.08e8}, //血量200%
        loot_list: [
            {item_name: "史诗绿宝石", chance:2},
        ],
    });
    enemy_templates["敌意老人[BOSS]"] = new Enemy({
        name: "敌意老人[BOSS]", 
        description: "相当耐揍，但是也只剩下耐揍了。", 
        xp_value: 267914296, 
        rank: 3499,
        image: "image/boss/B3401.png",
        realm: "<span class=realm_sky><b>天空级六阶 +</b></span>",
        size: "small",
        spec: [5],
        spec_value:{},
        tags: [],
        stats: {health: 326.7e8, attack: 4.5e8, agility: 3.9e8, attack_speed: 1.4, defense:3.0e8}, //血量300%
        loot_list: [
            //280D
        ],
    });
    enemy_templates["竺虎[BOSS]"] = new Enemy({
        name: "竺虎[BOSS]", 
        description: "在同阶里称得上实力强悍，但想要逆伐喵可是不是搞错了什么？", 
        xp_value: 267914296, 
        rank: 3595,
        image: "image/boss/B3501.png",
        realm: "<span class=realm_sky><b>天空级五阶 +++</b></span>",
        size: "small",
        spec: [23],
        spec_value:{},
        tags: [],
        stats: {health: 810e8, attack: 8.5e8, agility: 4.5e8, attack_speed: 1.4, defense:2.4e8}, //血量400%
        loot_list: [
            {item_name: "传说黄宝石", chance:1},
        ],
    });
    enemy_templates["莫尔[BOSS]"] = new Enemy({
        name: "莫尔[BOSS]", 
        description: "水牢里的好人。真是让人感动啊……", 
        xp_value: 433494437, 
        rank: 3596,
        image: "image/boss/B3502.png",
        realm: "<span class=realm_sky><b>天空级六阶 ++</b></span>",
        size: "small",
        spec: [50],
        spec_value:{50:0.16e8},
        tags: [],
        stats: {health: 1299.6e8, attack: 7.7e8, agility: 6.0e8, attack_speed: 1.2, defense:3.3e8}, //血量400%
        loot_list: [
            {item_name: "传说黄宝石", chance:2},
        ],
    });
    enemy_templates["秋兴[BOSS]"] = new Enemy({
        name: "秋兴[BOSS]", 
        description: "强榜强者【落叶刀】。暂列第三——当你看到这个提示就不是了。", 
        xp_value: 701408733, 
        rank: 3597,
        image: "image/boss/B3503.png",
        realm: "<span class=realm_sky><b>天空级六阶 +++</b></span>",
        size: "small",
        spec: [46,32],
        tags: [],
        stats: {health: 1000e8, attack: 10.5e8, agility: 9.0e8, attack_speed: 1.4, defense:8.4e8}, //血量400%
        loot_list: [
        ],
    });
    enemy_templates["蓝柒[放水 ver.][BOSS]"] = new Enemy({
        name: "蓝柒[放水 ver.][BOSS]", 
        description: "强榜的发布者，拥有着碾压般的实力。虽然这里三重领域只用了一重……", 
        xp_value: 701408733, 
        rank: 3598,
        image: "image/boss/B3504.png",
        realm: "<span class=realm_sky><b>天空级六阶 +++</b></span>",//真正实力：天空级六阶 [IV].(3个加号以上换用罗马数字)
        size: "small",
        spec: [0],
        tags: [],
        stats: {health: 1210e8, attack: 12.25e8, agility: 10.8e8, attack_speed: 1.6, defense:6.76e8}, //血量400%
        loot_list: [
            {item_name: "传说红宝石", chance:2,ignore_luck:true},
        ],
    });
    enemy_templates["蓝柒[BOSS]"] = new Enemy({
        name: "蓝柒[BOSS]", 
        description: "强榜的发布者，拥有着碾压般的实力。领域齐出的她强的可怕，甚至超越了3+之境……", 
        xp_value: 1134903170, 
        rank: 3599,
        image: "image/boss/B3504.png",
        realm: "<span class=realm_sky><b>天空级六阶 [IV]</b></span>",
        size: "small",
        spec: [0,7,42],
        tags: [],
        stats: {health: 1742.4e8, attack: 17.64e8, agility: 14.4e8, attack_speed: 1.7, defense:10.24e8}, //血量400%
        loot_list: [
            {item_name: "传说红宝石", chance:4,ignore_luck:true},
        ],
    });
    enemy_templates["怪物手册[BOSS]"] = new Enemy({
        name: "怪物手册[BOSS]", 
        description: "为什么怪物手册会成精啊！另外，不觉得压制比牵制还要容易成为负累吗……", 
        xp_value: 2971215073, 
        rank: 3697,
        image: "image/boss/B3601.png",
        realm: "<span class=realm_sky><b>天空级八阶 ++</b></span>",
        size: "small",
        spec: [9,51],
        tags: [],
        stats: {health: 4936e8, attack: 36e8, agility: 21e8, attack_speed: 1.3, defense:21e8}, //血量400%
        loot_list: [
            {item_name: "传承水晶·橙", chance:2,ignore_luck:true},
            {item_name: "传承水晶·白", chance:2,ignore_luck:true},
            {item_name: "传承水晶·粉", chance:2,ignore_luck:true},
            {item_name: "传承水晶·绿", chance:2,ignore_luck:true},
            {item_name: "传承水晶·蓝", chance:2,ignore_luck:true},
        ],
    });
    enemy_templates["心魔木偶[SP]"] = new Enemy({
        name: "心魔木偶[SP]", 
        description: "被高维存在注入力量的木偶。测试完压制·伪它就该下班了！", 
        xp_value: 4807526976, 
        rank: 3698,
        image: "image/spec/fishmark.png",
        realm: "<span class=realm_basic><b>天空级巅峰 +</b></span>",
        size: "small",
        spec: [52],
        tags: [],
        stats: {health: 9999e12, attack: 113.56e8, agility: 44.4e8, attack_speed: 1.0, defense:1e4}, 
        loot_list: [
            {item_name: "宇宙币", chance:168,ignore_luck:true},
        ],
    });
    
    enemy_templates["心魔[BOSS]"] = new Enemy({
        name: "心魔[BOSS]", 
        description: "我保留了一些同调，这样你才知道你打的是心魔。不过，它还是会被牵制领悟度欺负就是了！", 
        xp_value: 2971215073, 
        rank: 3699,
        image: "image/boss/B3602.png",
        realm: "<span class=realm_sky><b>天空级巅峰</b></span>",
        size: "small",
        spec: [33,52,53],
        spec_value:{33:13},
        tags: [],
        stats: {health: 17776e8, attack: 1e4, agility: 44.4e8, attack_speed: 1.0, defense:1e4}, //血量400%
        loot_list: [
        ],
    });
    enemy_templates["喵咕啦[BOSS]"] = new Enemy({
        name: "喵咕啦[BOSS]", 
        description: "颜色和姐姐的衣服真的很像……现在不是想这种事情的时候！", 
        xp_value: 4807526976, 
        rank: 3791,
        image: "image/boss/B3701.png",
        realm: "<span class=realm_sky><b>天空级巅峰 +</b></span>",
        size: "small",
        spec: [21],
        spec_value:{21:60e8},
        tags: [],
        stats: {health: 5555e8, attack: 1e4, agility: 50e8, attack_speed: 1.5, defense:37.5e8}, //血量500%(x)原创属性！
        loot_list: [
        ],
    });
    enemy_templates["不可能三角B9[BOSS]"] = new Enemy({
        name: "不可能三角B9[BOSS]", 
        description: "单纯的数值怪。我猜可以打到这里应该不是很怕它了。", 
        xp_value: 4807526976, 
        rank: 3792,
        image: "image/boss/B3702.png",
        realm: "<span class=realm_sky><b>天空级巅峰 +</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 15125e8, attack: 77e8, agility: 60e8, attack_speed: 1.6, defense:48e8}, //血量500%
        loot_list: [
        ],
    });
    enemy_templates["末世天骄[BOSS]"] = new Enemy({
        name: "末世天骄[BOSS]", 
        description: "末世秘境天才的一缕残魂。在漫长的时光中流失了99.9999%的力量，只剩下<span class=realm_sky><b>天空级巅峰 ++</b></span>的能级……", 
        xp_value: 7778742049, 
        rank: 3793,
        image: "image/boss/B3703.png",
        realm: "<span class=realm_cloudy><del><b>云霄级巅峰 [XII]</b><del>云霄级一阶 --</span>",
        size: "small",
        spec: [51,15,34],
        tags: [],
        stats: {health: 29990e8, attack: 120e8, agility: 70e8, attack_speed: 1.2, defense:20e8}, //血量500%
        loot_list: [
            {item_name: "传承水晶·粉", chance:60,ignore_luck:true},
        ],
    });
    enemy_templates["狠咕兽[BOSS]"] = new Enemy({
        name: "狠咕兽[BOSS]", 
        description: "幸好不是大宝石版的特咕兽。又一只数值怪——平平常常，对吧？", 
        xp_value: 7778742049, 
        rank: 3794,
        image: "image/boss/B3704.png",
        realm: "<span class=realm_sky><b>天空级巅峰 ++</b></span>",
        size: "small",
        spec: [],
        tags: [],
        stats: {health: 27775e8, attack: 110e8, agility: 75e8, attack_speed: 1.5, defense:55e8}, //血量500%
        loot_list: [
        ],
    });
    enemy_templates["心魔之主[BOSS]"] = new Enemy({
        name: "心魔之主[BOSS]", 
        description: "常规的云霄级一阶对应天空级巅峰 +++。很明显，这只心魔绝不是正常突破的……因此境界不稳，甚至在跌落的边缘。", 
        xp_value: 7778742049, 
        rank: 3795,
        image: "image/boss/B3705.png",
        realm: "<span class=realm_cloudy><b>云霄级一阶 -</b></span>",
        size: "small",
        spec: [36,52],
        tags: [],
        stats: {health: 40500e8, attack: 180e8, agility: 120e8, attack_speed: 1.5, defense:60e8}, //血量500%
        loot_list: [
        ],
    });
/*

17776Z/113.56E/1W/44.4E/1.0

属性是99.99J/113.56E/1W/44.4E/1.0，
只有一个【压制·伪】属性。
 
*/







    enemy_templates["Village guard (heavy)"] = new Enemy({
        name: "Village guard (heavy)", 
        description: "", 
        add_to_bestiary: false,
        xp_value: 1,
        rank: 4,
        tags: ["living", "human"],
        size: "medium",
        stats: {health: 300, attack: 50, agility: 20, dexterity: 80, intuition: 20, attack_speed: 0.2, defense: 30},
    });
    enemy_templates["Village guard (quick)"] = new Enemy({
        name: "Village guard (quick)", 
        description: "", 
        add_to_bestiary: false,
        xp_value: 1,
        rank: 4,
        tags: ["living", "human"],
        size: "medium",
        stats: {health: 300, attack: 20, agility: 20, dexterity: 50, intuition: 20, attack_speed: 2, defense: 10},
    });
    enemy_templates["Suspicious wall"] = new Enemy({
        name: "Suspicious wall", 
        description: "", 
        add_to_bestiary: false,
        xp_value: 1,
        rank: 1,
        tags: ["unanimate"],
        size: "large",
        stats: {health: 10000, attack: 0, agility: 0, dexterity: 0, intuition: 0, attack_speed: 0.000001, defense: 100},
    });

    enemy_templates["Suspicious man"] = new Enemy({
        name: "Suspicious man", 
        description: "", 
        add_to_bestiary: false,
        xp_value: 1,
        rank: 5,
        tags: ["living", "human"],
        size: "medium",
        stats: {health: 400, attack: 60, agility: 60, dexterity: 60,intuition: 60, attack_speed: 2, defense: 30},
    });
})()

Object.keys(enemy_templates).forEach((enemy_key) => {
    if(!enemy_templates[enemy_key].id) {
        enemy_templates[enemy_key].id = enemy_key;
    }
});

export {Enemy, enemy_templates, enemy_killcount};