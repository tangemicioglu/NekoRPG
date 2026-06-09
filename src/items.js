"use strict";

/*
    item_templates contain some predefined equipment for easier access (instead of having to create them with proper components each time)

    equippable are unstackable, other items stack

    item quality translates into rarity, but also provides another multiplier on top of quality multiplier, starting at uncommon
            quality     rarity         color      additional_multiplier
            0-49%       trash          gray       x1
            50-99%      common         white      x1
            100-129%    uncommon       green      x1.1
            130-159%    rare           blue       x1.3
            160-199%    epic           purple     x1.6
            200-246%    legendary      orange     x2
            247-250%    mythical       ????       x2.5

            quality affects only attack/defense/max block, while additional multiplier affects all positive stats 
            (i.e flat bonuses over 0 and multiplicative bonuses over 1)

    basic idea for weapons:

        short blades (daggers/spears) are the fastest but also the weakest, +the most crit rate and crit damage
        blunt heads (blunt weapons) have highest damage, but also lower attack speed
        axe heads have a bit less damage, but a bit less attack speed penalty
        long blades (swords/spears?) have average damage and average attack speed

        long handles (spears) have higher attack multiplier and lower attack speed (so they counter the effects of the short blades)
        medium handles (axes/blunt weapons) have them average
        short handles have lowest attack multiplier
        
        so, as a result, attack damage goes blunt > axe > spear > sword > dagger
        and attack speed goes               dagger > sword > spear > axe > blunt
        which kinda makes spears very average, but they also get bonus crit so whatever
*/

import { character } from "./character.js";
import { round_item_price } from "./misc.js";

const rarity_multipliers = {
    trash: 1, //low quality alone makes these so bad that no additional nerf should be needed
    common: 1,
    uncommon: 1.1,//+10%
    rare: 1.25,//+15%
    epic: 1.45,//+20%
    legendary: 1.7,//+25%
    mythical: 2.0,//+30%
    transdental: 2.4,//+40%
    celestial: 3.0,//+60%
    antique: 3.6,//+60%
    flawless: 4.5,//+90%
};

const item_templates = {};

let loot_sold_count = {};

function setLootSoldCount(data) {
    loot_sold_count = data;
}

function recoverItemPrices(count=1) {
    Object.keys(loot_sold_count).forEach(item_name => {

        if(!item_templates[item_name].price_recovers) {
            return;
        }

        loot_sold_count[item_name].recovered += count;
        
        if(loot_sold_count[item_name].recovered > loot_sold_count[item_name].sold) {
            loot_sold_count[item_name].recovered = loot_sold_count[item_name].sold;
        }
    })
}

function getLootPriceModifier(value, how_many_sold) {
    //let modifier = 1;
    // if(how_many_sold >= 999) {
    //     modifier = 0.1;
    // } else if(how_many_sold) {
    //     modifier = modifier * 111/(111+how_many_sold);
    // }
    // 哪个天才想出来卖东西导致降价的？
    // 是什么把你变成这样的 史莱姆牧场吗
    return value;
}

/**
 * 
 * @param {Number} value
 * @param {Number} start_count 
 * @param {Number} how_many_to_sell 
 * @returns 
 */
function getLootPriceModifierMultiple(value, start_count, how_many_to_sell) {
    let sum = 0;
    for(let i = start_count; i < start_count+how_many_to_sell; i++) {
        /*
        rounding is necessary to make it be a proper fraction of the value
        otherwise, there might be cases where trading too much of an item results in small deviation from what it should be
        */
        sum += value;
    }
    return sum;
}

function getArmorSlot(internal) {
    let equip_slot;
    if(item_templates[internal].component_type === "helmet interior") {
        equip_slot = "head";
    } else if(item_templates[internal].component_type === "chestplate interior") {
        equip_slot = "torso";
    } else if(item_templates[internal].component_type === "leg armor interior") {
        equip_slot = "legs";
    } else if(item_templates[internal].component_type === "glove interior") {
        equip_slot = "arms";
    } else if(item_templates[internal].component_type === "shoes interior") {
        equip_slot = "feet";
    } else {
        console.error(`Component type "${item_templates[internal].component_type}" doesn't correspond to any armor slot!`);
        return null;
    }
    return equip_slot;
}

function getItemRarity(quality) {
    let rarity;
    if(quality < 50) rarity =  "trash";
    else if(quality < 100) rarity = "common";
    else if(quality < 130) rarity = "uncommon";
    else if(quality < 160) rarity = "rare";
    else if(quality < 200) rarity = "epic";
    else if(quality < 240) rarity = "legendary";
    else if(quality < 300) rarity = "mythical";
    else if(quality < 400) rarity = "transdental";
    else if(quality < 500) rarity = "celestial";
    else if(quality < 700) rarity = "antique";
    else if(quality < 1000) rarity = "flawless";
    
    return rarity;
}

function getEquipmentValue(components, quality) {
    let value = 0;
    Object.values(components).forEach(component => {
        value += item_templates[component].value;
    });
    return round_item_price(value * (quality/100 ) * rarity_multipliers[getItemRarity(quality)]);
}

class Item {
    constructor({name,
                description,
                value = 0, 
                gem_value = 0,
                E_value = 0,
                C_value = 0,
                spec = 0,
                tags = {},
                realmcap = -1,
                id = null,
                image = "",
                })
    {
        this.name = name; 
        this.description = description;
        this.saturates_market = false;
        this.id = id;
        this.spec = spec;
        this.image = image;
        this.realmcap = realmcap;
        /**
         * Use .getValue() instead of this
         */
        this.value = value;
        this.gem_value = gem_value;
        this.E_value = E_value;//experience
        this.C_value = C_value;//cap ingoring
        this.tags = tags;
        this.tags["item"] = true;
    }

    getInventoryKey() {
        if(!this.inventory_key) {
            this.inventory_key = this.createInventoryKey();
        }
        return this.inventory_key;
    }

    createInventoryKey() {
        const key = {};

        if(!this.components) {
            key.id = this.id;
        } else {
            key.components = {};
            Object.keys(this.components).forEach(component => {
                key.components[component] = this.components[component];
            });
        }
        if(this.quality) {
            key.quality = this.quality;
        }
        return JSON.stringify(key);
    }

    getValue() {
        return round_item_price(this.value);
    }

    getBaseValue() {
        return this.value;
    }

    getValueOfMultiple({additional_count_of_sold = 0, count}) {
        return round_item_price(this.value) * count;
    }

    getName() {
        return this.name;
    }
    
    getImage() {
        return this.image;
    }

    getDescription() {
        return this.description;
    }
}

class OtherItem extends Item {
    constructor(item_data) {
        super(item_data);
        this.item_type = "OTHER";
        this.stackable = true;
        this.saturates_market = item_data.saturates_market;
        this.price_recovers = item_data.price_recovers;
    }
}

class Material extends OtherItem {
    constructor(item_data) {
        super(item_data);
        this.item_type = "MATERIAL";
        this.saturates_market = true;
        this.price_recovers = true;
        this.material_type = item_data.material_type;
        this.tags["material"] = true;
    }
}


class Loot extends OtherItem {
    constructor(item_data) {
        super(item_data);
        this.item_type = "LOOT";
        this.saturates_market = true;
        this.price_recovers = true;
        this.material_type = item_data.material_type;
        this.tags["loot"] = true;
    }
}


class ItemComponent extends Item {
    constructor(item_data) {
        super(item_data);
        this.item_type = "COMPONENT";
        this.stackable = false;
        this.component_tier = item_data.component_tier || 0;
        this.stats = item_data.stats || {};
        this.tags["equipment component"] = true;
        this.quality = Math.round(item_data.quality) || 100;
    }
    getRarity(quality){
        if(!quality) {
            if(!this.rarity) {
                this.rarity = getItemRarity(this.quality);
            }
            return this.rarity;
        } else {
            return getItemRarity(quality);
        }

    }

    calculateRarity(quality) {
        let rarity;
        if(quality < 50) rarity =  "trash";
        else if(quality < 100) rarity = "common";
        else if(quality < 130) rarity = "uncommon";
        else if(quality < 160) rarity = "rare";
        else if(quality < 200) rarity = "epic";
        else if(quality < 246) rarity = "legendary";
        else if(quality < 300) rarity = "mythical";
        else if(quality < 400) rarity = "transdental";
        else if(quality < 500) rarity = "celestial";
        else if(quality < 700) rarity = "antique";
        else if(quality < 1000) rarity = "flawless";
        
        return rarity;
    }

    getStats() {
        return this.stats;
    }

    getValue(quality) {
        return round_item_price(this.value * (quality/100 || this.quality/100));
    } 
}

class WeaponComponent extends ItemComponent {
    constructor(item_data) {
        super(item_data);
        if(item_data.component_type !== "axe head" && item_data.component_type !== "hammer head"
        && item_data.component_type !== "short blade" && item_data.component_type !== "long blade"
        && item_data.component_type !== "short handle" && item_data.component_type !== "long handle"
        && item_data.component_type !== "medium handle" && item_data.component_type !== "triple blade"
        && item_data.component_type !== "wheel core" && item_data.component_type !== "wheel head") {
            throw new Error(`No such weapon component type as ${item_data.component_type}`);
        }
        this.component_type = item_data.component_type;
        //"short blade", "long blade", "axe blade", "hammer blade" for heads; "short handle", "medium handle", "long handle" for handles

        this.attack_value = item_data.attack_value || 0; //can skip this for weapon handles
        if(item_data.component_type === "short handle"){
            this.attack_multiplier = 1;
        } else if(item_data.component_type === "medium handle"){
            this.attack_multiplier = 1;
        } else if(item_data.component_type === "long handle"){
            this.attack_multiplier = 1.5;
        } else {
            this.attack_multiplier = 1;
        }

        this.name_prefix = item_data.name_prefix; //to create a name of an item, e.g. "Sharp iron" used to create spear results in "Sharp iron spear"

        this.tags["weapon component"] = true;
        this.tags["component"] = true;
    }
}

class ShieldComponent extends ItemComponent {
    constructor(item_data) {
        super(item_data);
        if(item_data.component_type !== "shield base" && item_data.component_type !== "shield handle") {
            throw new Error(`No such shield component type as ${item_data.component_type}`);
        }
        this.component_type = item_data.component_type;

        //properties below only matter for shield type component
        this.shield_strength = item_data.shield_strength; 
        this.shield_name = item_data.shield_name || item_data.name;

        this.tags["shield component"] = true;
        this.tags["component"] = true;
    }
}

class ArmorComponent extends ItemComponent {
    constructor(item_data) {
        super(item_data);
        if(item_data.component_type !== "helmet interior" && item_data.component_type !== "helmet exterior"
        && item_data.component_type !== "chestplate interior" && item_data.component_type !== "chestplate exterior"
        && item_data.component_type !== "leg armor interior" && item_data.component_type !== "leg armor exterior"
        && item_data.component_type !== "glove interior" && item_data.component_type !== "glove exterior"
        && item_data.component_type !== "shoes interior" && item_data.component_type !== "shoes exterior") {

            throw new Error(`No such armor component type as ${item_data.component_type}`);
        }
        this.component_type = item_data.component_type;
        this.defense_value = item_data.defense_value;

        this.stats = item_data.stats || {};

        this.equip_slot = item_data.equip_slot;

        //only used with external elements
        this.full_armor_name = item_data.full_armor_name;

        //only used with internal elements
        this.armor_name = item_data.armor_name;

        //only used with external elements; name_prefix/name_suffix are used only if full_armor_name is not provided
        this.name_prefix = item_data.name_prefix;
        this.name_suffix = item_data.name_suffix;

        this.tags["armor component"] = true;
        this.tags["component"] = true;
    }
}

class UsableItem extends Item {
    constructor(item_data) {
        super(item_data);
        this.item_type = "USABLE";
        this.stackable = true;
        this.effects = item_data.effects || {};
        this.tags["usable"] = true;
    }
}

class Equippable extends Item {
    constructor(item_data) {
        super(item_data);
        this.item_type = "EQUIPPABLE";
        this.stackable = false;
        this.components = {};
        this.bonus_skill_levels = item_data.bonus_skill_levels || {};

        this.quality = Math.round(item_data.quality) || 100;

        this.tags["equippable"] = true;
    }

    getValue(quality) {
        return round_item_price(this.value * (quality/100 || this.quality/100) * rarity_multipliers[this.getRarity(quality)]);
    } 

    getRarity(quality){
        if(!quality) {
            if(!this.rarity) {
                this.rarity = getItemRarity(this.quality);
            }
            return this.rarity;
        } else {
            return getItemRarity(quality);
        }

    }

    getStats(quality){
        if(!quality) {
            if(!this.stats) {
                this.stats = this.calculateStats(this.quality);
            }
            return this.stats;
        } else {
            return this.calculateStats(quality);
        }
    }

    calculateStats(quality){
        const stats = {};
        if(this.components) {

            //iterate over components
            const components = Object.values(this.components).map(comp => item_templates[comp]).filter(comp => comp);
            for(let i = 0; i < components.length; i++) {
                Object.keys(components[i].stats).forEach(stat => {
                    if(!stats[stat]) {
                        stats[stat] = {};
                    }

                    // if(stat === "defense" || stat === "attack_power") { //skip it, it's to be added to the basic defense/attack instead
                    //     return;
                    // }

                    if(components[i].stats[stat].multiplier) {
                        stats[stat].multiplier = (stats[stat].multiplier || 1) * components[i].stats[stat].multiplier;
                    }
                    if(components[i].stats[stat].flat) {
                        stats[stat].flat = (stats[stat].flat || 0) + components[i].stats[stat].flat;
                    }
                })
            }

            //iterate over stats and apply rarity bonus if possible
            Object.keys(stats).forEach(stat => {
                if(stats[stat].multiplier){
                    if(stats[stat].multiplier >= 1 && stat != "attack_mul") {
                        stats[stat].multiplier = Math.round(100 * (1 + (stats[stat].multiplier - 1) * rarity_multipliers[this.getRarity(quality)]))/100;
                    } else {
                        stats[stat].multiplier = Math.round(100 * stats[stat].multiplier)/100;
                    }
                }

                if(stats[stat].flat){
                    if(stats[stat].flat > 0) {
                        stats[stat].flat = Math.round(100 * stats[stat].flat * rarity_multipliers[this.getRarity(quality)])/100;
                    } else {
                        stats[stat].flat = Math.round(100 * stats[stat].flat)/100;
                    }
                }
            });
        }

        return stats;
    }
    
    getBonusSkillLevels() {
        return this.bonus_skill_levels;
    }
}

class Artifact extends Equippable {
    constructor(item_data) {
        super(item_data);
        this.components = undefined;
        this.equip_slot = "artifact";
        this.stats = item_data.stats;

        this.tags["artifact"] = true;
        if(!this.id) {
            this.id = this.getName();
        }
    }

    getValue() {
        return round_item_price(this.value);
    } 

    getStats(){
        return this.stats;
    }
}

class Props extends Equippable {
    constructor(item_data) {
        super(item_data);
        this.components = undefined;
        this.equip_slot = "props";
        this.stats = item_data.stats;

        this.tags["props"] = true;
        if(!this.id) {
            this.id = this.getName();
        }
    }

    getStats(){
        return this.stats;
    }
}
class Method extends Equippable {
    constructor(item_data) {
        super(item_data);
        this.components = undefined;
        this.equip_slot = "method";
        this.stats = item_data.stats;

        this.tags["method"] = true;
        if(!this.id) {
            this.id = this.getName();
        }
    }


    getStats(){
        return this.stats;
    }
}
class Special extends Equippable {
    constructor(item_data) {
        super(item_data);
        this.components = undefined;
        this.equip_slot = "special";
        this.stats = item_data.stats;

        this.tags["special"] = true;
        if(!this.id) {
            this.id = this.getName();
        }
    }

    getStats(){
        return this.stats;
    }
}
class Realm extends Equippable {
    constructor(item_data) {
        super(item_data);
        this.components = undefined;
        this.equip_slot = "realm";
        this.stats = item_data.stats;

        this.tags["realm"] = true;
        if(!this.id) {
            this.id = this.getName();
        }
    }
    getStats(){
        return this.stats;
    }
}

class Tool extends Equippable {
    constructor(item_data) {
        super(item_data);
        this.equip_slot = item_data.equip_slot; //tool type is same as equip slot (axe/pickaxe/herb sickle)
        this.components = undefined;
        this.tags["tool"] = true;
        this.tags[this.equip_slot] = true;
        if(!this.id) {
            this.id = this.getName();
        }
    }
    getStats() {
        return {};
    }

    getValue() {
        return this.value;
    } 
}

class Shield extends Equippable {
    constructor(item_data) {
        super(item_data);
        this.equip_slot = "off-hand";
        this.offhand_type = "shield"; //not like there's any other option

        if(!item_templates[item_data.components.shield_base]) {
            throw new Error(`No such shield base component as: ${item_data.components.shield_base}`);
        }
        this.components.shield_base = item_data.components.shield_base; //only the name

        if(item_data.components.handle && !item_templates[item_data.components.handle]) {
            throw new Error(`No such shield handle component as: ${item_data.components.handle}`);
        }
        this.components.handle = item_data.components.handle; //only the name
        this.tags["shield"] = true;
        if(!this.id) {
            this.id = this.getName();
        }
    }

    getShieldStrength(quality) {
        if(!quality) {
            if(!this.shield_strength) {
                this.shield_strength = this.calculateShieldStrength(this.quality);
            }
            return this.shield_strength;
        } else {
            return this.calculateShieldStrength(quality);
        }
    }

    calculateShieldStrength(quality) {
        return Math.round(10 * Math.ceil(item_templates[this.components.shield_base].shield_strength * (quality/100) * rarity_multipliers[this.getRarity(quality)]))/10;
    }

    getName() {
        if(!this.name) {
            this.name = item_templates[this.components.shield_base].shield_name;
        }
        return this.name;
    }

    getValue(quality) {
        if(!this.value) {
            //value of shield base + value of handle, both multiplied by quality and rarity
            this.value = (item_templates[this.components.shield_base].value + item_templates[this.components.handle].value)
                                  * (quality/100 || this.quality/100) * rarity_multipliers[this.getRarity(quality)];
        }
        return round_item_price(this.value);
    } 
}

class Armor extends Equippable {
    /*
        can be componentless, effectively being an equippable internal part

        naming convention:
        if full_armor_name in external
            then full_armor_name
        else use prefix and suffix on internal element
    */
   /**
    * Takes either {components} or {stats}, with {components} having higher priority. Lack of {components} assumes item is a wearable internal part (clothing)
    * @param {*} item_data 
    */
    constructor(item_data) {
        super(item_data);
        
        if(item_data.components) {
            if(!item_templates[item_data.components.internal]) {
                throw new Error(`No such internal armor element as: ${item_data.components.internal}`);
            }

            this.components.internal = item_data.components.internal; //only the name
            this.components.external = item_data.components.external; //only the name
            if(item_templates[this.components.internal].component_type === "helmet interior") {
                this.equip_slot = "head";
            } else if(item_templates[this.components.internal].component_type === "chestplate interior") {
                this.equip_slot = "torso";
            } else if(item_templates[this.components.internal].component_type === "leg armor interior") {
                this.equip_slot = "legs";
            } else if(item_templates[this.components.internal].component_type === "glove interior") {
                this.equip_slot = "arms";
            } else if(item_templates[this.components.internal].component_type === "shoes interior") {
                this.equip_slot = "feet";
            } else {
                throw new Error(`Component type "${item_templates[this.components.internal].component_type}" doesn't correspond to any armor slot!`);
            }
            if(item_data.external && !item_templates[item_data.external]) {
                throw new Error(`No such external armor element as: ${item_data.components.external}`);
            }
            
        } else { 
            this.tags["armor component"] = true;
            this.tags["clothing"] = true;
            this.stats = item_data.stats || {};
            delete this.components;
            
            if(!item_data.name) {
                throw new Error(`Component-less item needs to be provided a name!`);
            }
            this.name = item_data.name;
            if(!item_data.value) {
                throw new Error(`Component-less item "${this.getName()}" needs to be provided a monetary value!`);
            }

            this.component_type = item_data.component_type;
            this.value = item_data.value;
            this.component_tier = item_data.component_tier || 0;
            this.base_defense = item_data.base_defense;

            if(item_data.component_type === "helmet interior") {
                this.equip_slot = "head";
            } else if(item_data.component_type === "chestplate interior") {
                this.equip_slot = "torso";
            } else if(item_data.component_type === "leg armor interior") {
                this.equip_slot = "legs";
            } else if(item_data.component_type === "glove interior") {
                this.equip_slot = "arms";
            } else if(item_data.component_type === "shoes interior") {
                this.equip_slot = "feet";
            } else if(this.tags.method){
                this.equip_slot = "method";
            } else if(this.tags.realm){
                this.equip_slot = "realm";
            } else if(this.tags.special){
                this.equip_slot = "special";
            }
            else {
                this.equip_slot = "props";

                //throw new Error(`Component type "${item_data.component_type}" doesn't correspond to any armor slot!`);
            }
        }

        this.tags["armor"] = true;
        if(!this.id) {
            this.id = this.getName();
        }
    }

    getDefense(quality) {
        if(!quality) {
            if(!this.defense_value) {
                this.defense_value = this.calculateDefense(this.quality);
            }
            return this.defense_value;
        } else {
            return this.calculateDefense(quality);
        }
    }
    calculateDefense(quality) {
        if(this.components) {
            return Math.ceil(((item_templates[this.components.internal].defense_value || item_templates[this.components.internal].base_defense ||0) + 
                                        (item_templates[this.components.external]?.defense_value || 0 )) 
                                        * (quality/100 || this.quality/100) * rarity_multipliers[this.getRarity(quality || this.quality)]
            )
        } else {
            return Math.ceil((this.base_defense || 0)  * (quality/100 || this.quality/100) * rarity_multipliers[this.getRarity(quality || this.quality)]);
        }
    }

    getValue(quality) {
        
        if(this.components) {
            //value of internal + value of external (if present), both multiplied by quality and rarity
            return round_item_price((item_templates[this.components.internal].value + (item_templates[this.components.external]?.value || 0))
                            * (quality/100 || this.quality/100) * rarity_multipliers[this.getRarity(quality)]);
        } else {
            return round_item_price(item_templates[this.id].value * (quality/100 || this.quality/100) * rarity_multipliers[this.getRarity(quality)]);
        }
    } 

    getName() {
        /*
        no external => name after internal.armor_name
        external with full_armor_name => use full_armor_name
        otherwise => prefix + internal + suffix
        */

        if(!this.name) {
            if(!this.components.external) {
                this.name = item_templates[this.components.internal].armor_name;
            } else {
                if(item_templates[this.components.external].full_armor_name) {
                    this.name = item_templates[this.components.external].full_armor_name;
                } else {
                    this.name = (item_templates[this.components.external].name_prefix || '') + " " + item_templates[this.components.internal].armor_name.toLowerCase() + " " + (item_templates[this.components.external].name_suffix || '');
                }
            }
        }

        return this.name;
    }
}

class Weapon extends Equippable {
    constructor(item_data) {
        super(item_data);
        this.equip_slot = "weapon";

        if(!item_templates[item_data.components.head]) {
            throw new Error(`No such weapon head as: ${item_data.components.head}`);
        }
        this.components.head = item_data.components.head; //only the name

        if(!item_templates[item_data.components.handle]) {
            throw new Error(`No such weapon handle as: ${item_data.components.handle}`);
        }
        this.components.handle = item_data.components.handle; //only the name

        if(item_templates[this.components.handle].component_type === "long handle" 
        && (item_templates[this.components.head].component_type === "short blade" || item_templates[this.components.head].component_type === "long blade")) {
            //long handle + short/long blade = spear
            this.weapon_type = "spear";
        } else if(item_templates[this.components.handle].component_type === "medium handle" 
        && item_templates[this.components.head].component_type === "axe head") {
            //medium handle + axe head = axe
            this.weapon_type = "axe";
        } else if(item_templates[this.components.handle].component_type === "medium handle" 
        && item_templates[this.components.head].component_type === "hammer head") {
            //medium handle + hammer head = hammer
            this.weapon_type = "hammer";
        } else if(item_templates[this.components.handle].component_type === "short handle" 
        && item_templates[this.components.head].component_type === "short blade") {
            //short handle + short blade = dagger
            this.weapon_type = "dagger";
        } else if(item_templates[this.components.handle].component_type === "short handle" 
        && item_templates[this.components.head].component_type === "long blade") {
            //short handle + long blade = sword
            this.weapon_type = "sword";
        } else if(item_templates[this.components.handle].component_type === "short handle" 
        && item_templates[this.components.head].component_type === "triple blade") {
            //short handle + triple blade = trident
            this.weapon_type = "trident";
        }else if(item_templates[this.components.handle].component_type === "wheel core" 
        && item_templates[this.components.head].component_type === "wheel head") {
            //wheel core + wheel head = moon wheel
            this.weapon_type = "moonwheel";
        } else {
            this.weapon_type = "moonwheel";
            throw new Error(`Combination of elements of types ${item_templates[this.components.handle].component_type} and ${item_templates[this.components.head].component_type} does not exist!`);
        }

        this.tags["weapon"] = true;
        this.tags[this.weapon_type] = true;
        if(!this.id) {
            this.id = this.getName();
        }
    }

    getAttack(quality){
        if(!quality) {
            if(!this.attack_power) {
                this.attack_power = this.calculateAttackPower(this.quality);
            }
            return this.attack_power;
        } else {
            return this.calculateAttackPower(quality);
        }
    }

    calculateAttackPower(quality) {
        return Math.ceil(
            (item_templates[this.components.head].attack_value + item_templates[this.components.handle].attack_value)
            * item_templates[this.components.head].attack_multiplier * item_templates[this.components.handle].attack_multiplier
            * (item_templates[this.components.head].stats?.attack_power?.multiplier || 1) * (item_templates[this.components.handle].stats?.attack_power?.multiplier || 1)
            * (quality/100) * rarity_multipliers[this.getRarity(quality)]
        );
    }

    getValue(quality) {
        if(!this.value) {
            //value of handle + value of head, both multiplied by quality and rarity
            this.value = (item_templates[this.components.handle].value + item_templates[this.components.head].value) * (quality/100 || this.quality/100) * rarity_multipliers[this.getRarity(quality)]
        }
        return round_item_price(this.value);
    } 

    getName() {
        if(!this.name) {
            let WTM = {"sword":"sword","trident":"trident","moonwheel":"moonwheel","spear":"spear","axe":"axe","dagger":"dagger"}
            this.name = `${item_templates[this.components.head].name_prefix} ${this.weapon_type === "hammer" ? "war hammer" : WTM[this.weapon_type]}`;
        }
        return this.name;
    }
}

//////////////////////////////
//////////////////////////////
//////////////////////////////
class BookData{
    constructor({
        required_time = 1,
        required_skills = {literacy: 0},
        literacy_xp_rate = 1,
        finish_reward = {},
        rewards = {},
    }) {
        this.required_time = required_time;
        this.accumulated_time = 0;
        this.required_skills = required_skills;
        this.literacy_xp_rate = literacy_xp_rate;
        this.finish_reward = finish_reward;
        this.is_finished = false;
        this.rewards = rewards;
    }
}

const book_stats = {};

class Book extends Item {
    constructor(item_data) {
        super(item_data);
        this.stackable = true;
        this.item_type = "BOOK";
        this.name = item_data.name;

        this.tags["book"] = true;
    }

    /**
     * 
     * @returns {Number} total time needed to read the book
     */
    getReadingTime() {
        //maybe make it go faster with literacy skill level?
        let {required_time} = book_stats[this.name];
        return required_time;
    }

    /**
     * 
     * @returns {Number} remaining time needed to read the book (total time minus accumulated time)
     */
    getRemainingTime() {
        let remaining_time = Math.max(book_stats[this.name].required_time - book_stats[this.name].accumulated_time, 0);
        return remaining_time;
    }

    addProgress(time = 1) {
        book_stats[this.name].accumulated_time += time;
        if(book_stats[this.name].accumulated_time >= book_stats[this.name].required_time) {
            this.setAsFinished();
        }
    }

    setAsFinished() {
        book_stats[this.name].is_finished = true;
        book_stats[this.name].accumulated_time = book_stats[this.name].required_time;
        character.stats.add_book_bonus(book_stats[this.name].rewards);
    }
}

/**
 * @param {*} item_data 
 * @returns item of proper type, created with item_data
 */
function getItem(item_data) {
    switch(item_data.item_type) {
        case "EQUIPPABLE":
            switch(item_data.equip_slot) {
                case "weapon":
                    return new Weapon(item_data);
                case "off-hand":
                    return new Shield(item_data);
                case "artifact":
                    return new Artifact(item_data);
                case "axe":
                case "pickaxe":
                case "sickle":
                    return new Tool(item_data);
                default:
                    return new Armor(item_data);
            }
        case "USABLE":
            return new UsableItem(item_data);
        case "BOOK":
            return new Book(item_data);
        case "OTHER":
            return new OtherItem(item_data);
        case "COMPONENT":
            if(item_data.tags["weapon component"]) 
                return new WeaponComponent(item_data);
            else if(item_data.tags["armor component"]) 
                return new ArmorComponent(item_data);
            else if(item_data.tags["shield component"]) 
                return new ShieldComponent(item_data);
            else throw new Error(`Item ${item_data.name} has a wrong component type`);
        case "MATERIAL":
            return new Material(item_data);
        case "LOOT":
            return new Loot(item_data);
        default:
            return new OtherItem(item_data);
            //throw new Error(`Wrong item type: ${item_data.item_type} , item: ${item_data}`);
    }
}

//book stats
book_stats["ABC for kids"] = new BookData({
    required_time: 120,
    literacy_xp_rate: 1,
    rewards: {
        xp_multipliers: {
            all: 1.1,
        }
    },
});

book_stats["Old combat manual"] = new BookData({
    required_time: 320,
    literacy_xp_rate: 1,
    rewards: {
        xp_multipliers: {
            Combat: 1.2,
        }
    },
});

book_stats["Twist liek a snek"] = new BookData({
    required_time: 320,
    literacy_xp_rate: 1,
    rewards: {
        xp_multipliers: {
            Evasion: 1.2,
        }
    },
});

//books
item_templates["ABC for kids"] = new Book({
    name: "ABC for kids",
    description: "The simplest book on the market",
    value: 100,
});

item_templates["Old combat manual"] = new Book({
    name: "Old combat manual",
    description: "Old book about combat, worn and outdated, but might still contain something useful",
    value: 200,
});

item_templates["Twist liek a snek"] = new Book({
    name: "Twist liek a snek",
    description: "This book has a terrible grammar, seemingly written by some uneducated bandit, but despite that it quite well details how to properly evade attacks.",
    value: 200,
});


//miscellaneous and loot:
(function(){
    item_templates["Rat fang"] = new OtherItem({
        name: "Rat fang", 
        description: "Fang of a huge rat, not very sharp, but can still pierce a human skin if enough force is applied", 
        value: 8,
        saturates_market: true,
        price_recovers: true,
    });

    item_templates["Wolf fang"] = new OtherItem({
        name: "Wolf fang", 
        description: "Fang of a wild wolf. Somewhat sharp, still not very useful. Maybe if it had a bit better quality...", 
        value: 12,
        saturates_market: true,
        price_recovers: true,
    });

    item_templates["Rat meat chunks"] = new OtherItem({
        name: "Rat meat chunks", 
        description: "Eww", 
        value: 8,
        saturates_market: true,
        price_recovers: true,
    });

    item_templates["Glass phial"] = new OtherItem({
        name: "Glass phial", 
        description: "Small glass phial, a perfect container for a potion", 
        value: 10,
        saturates_market: false,
    });
})();

//lootable materials
(function(){
    item_templates["Rat tail"] = new Material({
        name: "Rat tail", 
        description: "Tail of a huge rat. Doesn't seem very useful, but maybe some meat could be recovered from it", 
        value: 4,
        price_recovers: true,
        material_type: "meat source",
    });
    item_templates["Rat pelt"] = new Material({
        name: "Rat pelt", 
        description: "Pelt of a huge rat. Fur has terrible quality, but maybe leather could be used for something if you gather more?", 
        value: 10,
        price_recovers: true,
        material_type: "pelt",
    });
    item_templates["High quality wolf fang"] = new Material({
        name: "High quality wolf fang", 
        description: "Fang of a wild wolf. Very sharp, undamaged and surprisingly clean.", 
        value: 15,
        price_recovers: true,
        material_type: "miscellaneous",
    });
    item_templates["Wolf pelt"] = new Material({
        name: "Wolf pelt", 
        description: "Pelt of a wild wolf. It's a bit damaged so it won't fetch a great price, but the leather itself could be useful.", 
        value: 20,
        price_recovers: true,
        material_type: "pelt",
    });

    item_templates["Boar hide"] = new Material({
        name: "Boar hide", 
        description: "Thick hide of a wild boar. Too stiff for clothing, but might be useful for an armor",
        value: 30,
        price_recovers: true,
        material_type: "pelt",
    });
    item_templates["Boar meat"] = new Material({
        name: "Boar meat",
        description: "Fatty meat of a wild boar, all it needs is to be cooked.",
        value: 20,
        price_recovers: true,
        material_type: "meat source",
    });
    item_templates["High quality boar tusk"] = new Material({
        name: "High quality boar tusk", 
        description: "Tusk of a wild boar. Sharp and long enough to easily kill an adult human", 
        value: 25,
        price_recovers: true,
        material_type: "miscellaneous",
    });

    item_templates["Weak monster bone"] = new Material({
        name: "Weak monster bone", 
        description: "Mutated and dark bone of a monster. While far on the weaker side, it's still very strong",
        value: 30,
        price_recovers: true,
        material_type: "bone",
    });

})();

//gatherable materials
(function(){
    item_templates["Low quality iron ore"] = new Material({
        name: "Low quality iron ore", 
        description: "Iron content is rather low and there are a lot of problematic components that can't be fully removed, which will affect created materials.", 
        value: 3,
        saturates_market: true,
        price_recovers: true,
        material_type: "raw metal",
    });
    item_templates["Iron ore"] = new Material({
        name: "Iron ore", 
        description: "It has a decent iron content and can be smelt into market-quality iron.", 
        value: 5,
        saturates_market: true,
        price_recovers: true,
        material_type: "raw metal",
    });
    item_templates["Piece of rough wood"] = new Material({
        name: "Piece of rough wood", 
        description: "Cheapest form of wood. There's a lot of bark and malformed pieces.", 
        value: 2,
        saturates_market: true,
        price_recovers: true,
        material_type: "raw wood",
    });
    item_templates["Piece of wood"] = new Material({
        name: "Piece of wood", 
        description: "Average quality wood. There's a lot of bark and malformed pieces.", 
        value: 4,
        saturates_market: true,
        price_recovers: true,
        material_type: "raw wood",
    });
    item_templates["Piece of ash wood"] = new Material({
        name: "Piece of ash wood", 
        description: "Strong yet elastic, it's best wood you can hope to find around. There's a lot of bark and malformed pieces.",
        value: 7,
        saturates_market: true,
        price_recovers: true,
        material_type: "raw wood",
    });

    item_templates["Belmart leaf"] = new Material({
        name: "Belmart leaf", 
        description: "Small, round, dark-green leaves with with very good disinfectant properties",
        value: 8,
        saturates_market: true,
        price_recovers: true,
        material_type: "disinfectant herb",
    });

    item_templates["Golmoon leaf"] = new Material({
        name: "Golmoon leaf", 
        description: "Big green-brown leaves that can be applied to wounds to speed up their healing",
        value: 8,
        saturates_market: true,
        price_recovers: true,
        material_type: "healing herb",
    });

    item_templates["Oneberry"] = new Material({
        name: "Oneberry", 
        description: "Small blue berries capable of stimulating body's natural healing",
        value: 8,
        saturates_market: true,
        price_recovers: true,
        material_type: "healing herb",
    });

    item_templates["Wool"] = new Material({
        name: "Wool", 
        description: "A handful of wool, raw and unprocessed",
        value: 8,
        saturates_market: true,
        price_recovers: true,
        material_type: "raw fabric",
    });
})();

//processed materials
(function(){
    item_templates["Low quality iron ingot"] = new Material({
        id: "Low quality iron ingot",
        name: "Low quality iron ingot", 
        description: "It has a lot of impurities, resulting in it being noticeably below the market standard", 
        value: 10,
        saturates_market: true,
        price_recovers: true,
        material_type: "metal",
    });
    item_templates["Iron ingot"] = new Material({
        id: "Iron ingot",
        name: "Iron ingot", 
        description: "It doesn't suffer from any excessive impurities and can be used without worries.", 
        value: 20,
        saturates_market: true,
        price_recovers: true,
        material_type: "metal",
    });
    item_templates["Piece of wolf rat leather"] = new Material({
        name: "Piece of wolf rat leather",
        description: "It's slightly damaged and seems useless for anything that requires precise work.",
        value: 10,
        saturates_market: true,
        price_recovers: true,
        material_type: "piece of leather",
    });
    item_templates["Piece of wolf leather"] = new Material({
        name: "Piece of wolf leather", 
        description: "Somewhat strong, should offer some protection when turned into armor",
        value: 20,
        saturates_market: true,
        price_recovers: true,
        material_type: "piece of leather",
    });
    item_templates["Piece of boar leather"] = new Material({
        name: "Piece of boar leather", 
        description: "Thick and resistant leather, too stiff for clothes but perfect for armor",
        value: 30,
        saturates_market: true,
        price_recovers: true,
        material_type: "piece of leather",
    });
    item_templates["Wool cloth"] = new Material({
        name: "Wool cloth", 
        description: "Thick and warm, might possibly absord some punches",
        value: 8,
        saturates_market: true,
        price_recovers: true,
        material_type: "fabric",
    });
    item_templates["Iron chainmail"] = new Material({
        name: "Iron chainmail", 
        description: "Dozens of tiny iron rings linked together. Nowhere near a wearable form, turning it into armor will still take a lot of effort and focus",
        value: 12,
        saturates_market: true,
        price_recovers: true,
        material_type: "chainmail",
    });
    item_templates["Scraps of wolf rat meat"] = new Material({
        name: "Scraps of wolf rat meat", 
        description: "Ignoring where they come from and all the attached diseases, they actually look edible. Just remember to cook it first.",
        value: 8,
        saturates_market: true,
        price_recovers: true,
        material_type: "meat",
    });
    item_templates["Processed rough wood"] = new Material({
        name: "Processed rough wood", 
        description: "Cheapest form of wood, ready to be used. Despite being rather weak, it still has a lot of uses.",
        value: 6,
        saturates_market: true,
        price_recovers: true,
        material_type: "wood",
    });

    item_templates["Processed wood"] = new Material({
        name: "Processed wood", 
        description: "Average quality wood, ready to be used.",
        value: 11,
        saturates_market: true,
        price_recovers: true,
        material_type: "wood",
    });

    item_templates["Processed ash wood"] = new Material({
        name: "Processed ash wood", 
        description: "High quality wood, just waiting to be turned into a piece of equipment.",
        value: 20,
        saturates_market: true,
        price_recovers: true,
        material_type: "wood",
    });

})();

//spare parts
(function(){
    item_templates["Basic spare parts"] = new OtherItem({
        name: "Basic spare parts", 
        description: "Some cheap and simple spare parts, like bindings and screws, necessary for crafting equipment",
        value: 30, 
        component_tier: 1,
    });
}());

//weapon components:
(function(){
    item_templates["Cheap short iron blade"] = new WeaponComponent({
        name: "Cheap short iron blade", description: "Crude blade made of iron. Perfect length for a dagger, but could be also used for a spear",
        component_type: "short blade",
        value: 90,
        component_tier: 1,
        name_prefix: "Cheap iron",
        attack_value: 5,
        stats: {
            crit_rate: {
                flat: 0.06,
            },
            attack_speed: {
                multiplier: 1.20,
            },
            agility: {
                flat: 1,
            }
        }
    });
    item_templates["Short iron blade"] = new WeaponComponent({
        name: "Short iron blade", description: "A good iron blade. Perfect length for a dagger, but could be also used for a spear",
        component_type: "short blade",
        value: 200,
        component_tier: 2,
        name_prefix: "Iron",
        attack_value: 8,
        stats: {
            crit_rate: {
                flat: 0.1,
            },
            attack_speed: {
                multiplier: 1.30,
            },
            agility: {
                flat: 2,
            }
        }
    });
    item_templates["Cheap long iron blade"] = new WeaponComponent({
        name: "Cheap long iron blade", description: "Crude blade made of iron, with a perfect length for a sword",
        component_type: "long blade",
        value: 120,
        name_prefix: "Cheap iron",
        component_tier: 1,
        attack_value: 8,
        stats: {
            attack_speed: {
                multiplier: 1.10,
            },
            crit_rate: {
                flat: 0.02,
            },
        }
    });
    item_templates["Long iron blade"] = new WeaponComponent({
        name: "Long iron blade", description: "Good blade made of iron, with a perfect length for a sword",
        component_type: "long blade",
        value: 260,
        name_prefix: "Iron",
        component_tier: 2,
        attack_value: 13,
        stats: {
            attack_speed: {
                multiplier: 1.15,
            },
            crit_rate: {
                flat: 0.04,
            },
        }
    });
    item_templates["Cheap iron axe head"] = new WeaponComponent({
        name: "Cheap iron axe head", description: "A heavy axe head made of low quality iron",
        component_type: "axe head",
        value: 120,
        name_prefix: "Cheap iron",
        component_tier: 1,
        attack_value: 10,
        stats: {
            attack_speed: {
                multiplier: 0.9,
            }
        }
    });
    item_templates["Iron axe head"] = new WeaponComponent({
        name: "Iron axe head", description: "A heavy axe head made of good iron",
        component_type: "axe head",
        value: 260,
        name_prefix: "Iron",
        component_tier: 2,
        attack_value: 16,
        stats: {
            attack_speed: {
                multiplier: 0.95,
            }
        }
    });
    item_templates["Cheap iron hammer head"] = new WeaponComponent({
        name: "Cheap iron hammer head", description: "A crude ball made of low quality iron, with a small hole for the handle",
        component_type: "hammer head",
        value: 120,
        name_prefix: "Cheap iron",
        component_tier: 1,
        attack_value: 12,
        stats: {
            attack_speed: {
                multiplier: 0.8,
            }
        }
    });

    item_templates["Iron hammer head"] = new WeaponComponent({
        name: "Iron hammer head", description: "A crude ball made of iron, with a small hole for the handle",
        component_type: "hammer head",
        value: 260,
        name_prefix: "Iron",
        component_tier: 2,
        attack_value: 19,
        stats: {
            attack_speed: {
                multiplier: 0.85,
            }
        }
    });

    item_templates["Simple short wooden hilt"] = new WeaponComponent({
        name: "Simple short wooden hilt", description: "A short handle for a sword or maybe a dagger",
        component_type: "short handle",
        value: 10,
        component_tier: 1,
    });

    item_templates["Short wooden hilt"] = new WeaponComponent({
        name: "Short wooden hilt", description: "A short handle for a sword or maybe a dagger",
        component_type: "short handle",
        value: 40,
        component_tier: 2,
        stats: {
            attack_speed: {
                multiplier: 1.05,
            }
        }
    });

    item_templates["Simple medium wooden handle"] = new WeaponComponent({
        name: "Simple medium wooden handle", description: "A medium handle for an axe or a hammer",
        component_type: "medium handle",
        value: 20,
        component_tier: 1,
        stats: {
            attack_speed: {
                multiplier: 0.95,
            }
        }
    });

    item_templates["Medium wooden handle"] = new WeaponComponent({
        name: "Medium wooden handle", description: "A medium handle for an axe or a hammer",
        component_type: "medium handle",
        value: 80,
        component_tier: 2,
    });

    item_templates["Simple long wooden shaft"] = new WeaponComponent({
        name: "Simple long wooden shaft", description: "A long shaft for a spear, somewhat uneven",
        component_type: "long handle",
        value: 30,
        component_tier: 1,
        attack_multiplier: 1.5,
        stats: {
            attack_speed: {
                multiplier: 0.9,
            },
        }
    });

    item_templates["Long wooden shaft"] = new WeaponComponent({
        name: "Long wooden shaft", 
        description: "A long shaft for a spear, somewhat uneven",
        component_type: "long handle",
        value: 120,
        component_tier: 2,
        attack_multiplier: 1.5,
        stats: {
            attack_speed: {
                multiplier: 0.95,
            },
        }
    });

    item_templates["Cheap short iron hilt"] = new WeaponComponent({
        name: "Cheap short iron hilt", description: "A short handle for a sword or maybe a dagger, heavy",
        component_type: "short handle",
        value: 70,
        component_tier: 1,
        stats: {
            attack_speed: {
                multiplier: 0.9,
            },
            attack_power: {
                multiplier: 1.05,
            }
        }
    });

    item_templates["Short iron hilt"] = new WeaponComponent({
        name: "Short iron hilt", description: "A short handle for a sword or maybe a dagger, heavy",
        component_type: "short handle",
        value: 100,
        component_tier: 2,
        stats: {
            attack_power: {
                multiplier: 1.05,
            }
        }
    });

    item_templates["Cheap medium iron handle"] = new WeaponComponent({
        name: "Cheap medium iron handle", description: "A medium handle for an axe or a hammer, very heavy",
        component_type: "medium handle",
        value: 80,
        component_tier: 1,
        stats: {
            attack_speed: {
                multiplier: 0.7,
            },
            attack_power: {
                multiplier: 1.2,
            }
        }
    });

    item_templates["Medium iron handle"] = new WeaponComponent({
        name: "Medium iron handle", description: "A medium handle for an axe or a hammer, very heavy",
        component_type: "medium handle",
        value: 120,
        component_tier: 2,
        stats: {
            attack_speed: {
                multiplier: 0.8,
            },
            attack_power: {
                multiplier: 1.2,
            }
        }
    });

    item_templates["Cheap long iron shaft"] = new WeaponComponent({
        name: "Cheap long iron shaft", description: "A long shaft for a spear, extremely heavy",
        component_type: "long handle",
        value: 110,
        component_tier: 1,
        stats: {
            attack_speed: {
                multiplier: 0.5,
            },
            attack_power: {
                multiplier: 1.6,
            }
        }
    });

    item_templates["Long iron shaft"] = new WeaponComponent({
        name: "Long iron shaft", 
        description: "A long shaft for a spear,  extremely heavy",
        component_type: "long handle",
        value: 160,
        component_tier: 2,
        stats: {
            attack_speed: {
                multiplier: 0.6,
            },
            attack_power: {
                multiplier: 1.6,
            }
        }
    });

})();

//weapons:
(function(){
    item_templates["Cheap iron spear"] = new Weapon({
        components: {
            head: "Cheap short iron blade",
            handle: "Simple long wooden shaft"
        }
    });
    item_templates["Iron spear"] = new Weapon({
        components: {
            head: "Short iron blade",
            handle: "Simple long wooden shaft"
        }
    });

    item_templates["Cheap iron dagger"] = new Weapon({
        components: {
            head: "Cheap short iron blade",
            handle: "Simple short wooden hilt",
        }
    });
    item_templates["Iron dagger"] = new Weapon({
        components: {
            head: "Short iron blade",
            handle: "Simple short wooden hilt",
        }
    });

    item_templates["Cheap iron sword"] = new Weapon({
        components: {
            head: "Cheap long iron blade",
            handle: "Simple short wooden hilt",
        }
    });
    item_templates["Iron sword"] = new Weapon({
        components: {
            head: "Long iron blade",
            handle: "Simple short wooden hilt",
        }
    });

    item_templates["Cheap iron axe"] = new Weapon({
        components: {
            head: "Cheap iron axe head",
            handle: "Simple medium wooden handle",
        }
    });
    item_templates["Iron axe"] = new Weapon({
        components: {
            head: "Iron axe head",
            handle: "Simple medium wooden handle",
        }
    });

    item_templates["Cheap iron battle hammer"] = new Weapon({
        components: {
            head: "Cheap iron hammer head",
            handle: "Simple medium wooden handle",
        }
    });
    item_templates["Iron battle hammer"] = new Weapon({
        components: {
            head: "Iron hammer head",
            handle: "Simple medium wooden handle",
        }
    });
})();

//armor components:
(function(){
    item_templates["Wolf leather helmet armor"] = new ArmorComponent({
        name: "Wolf leather helmet armor", 
        description: "Strenghtened wolf leather, ready to be used as a part of a helmet",
        component_type: "helmet exterior",
        value: 300,
        component_tier: 2,
        full_armor_name: "Wolf leather helmet",
        defense_value: 2,
        stats: {
            agility: {
                multiplier: 0.95,
            }
        }
    });

    item_templates["Boar leather helmet armor"] = new ArmorComponent({
        name: "Boar leather helmet armor", 
        description: "Strong boar leather, ready to be used as a part of a helmet",
        component_type: "helmet exterior",
        value: 500,
        component_tier: 3,
        full_armor_name: "Boar leather helmet",
        defense_value: 3,
        stats: {
            agility: {
                multiplier: 0.95,
            }
        }
    });

    item_templates["Wolf leather chestplate armor"] = new ArmorComponent({
        id: "Wolf leather chestplate armor",
        name: "Wolf leather cuirass",
        description: "Simple cuirass made of solid wolf leather, all it needs now is something softer to wear under it.",
        component_type: "chestplate exterior",
        value: 600,
        component_tier: 2,
        full_armor_name: "Wolf leather armor",
        defense_value: 4,
        stats: {
            agility: {
                multiplier: 0.95,
            }
        }
    });
    item_templates["Boar leather chestplate armor"] = new ArmorComponent({
        id: "Boar leather chestplate armor",
        name: "Boar leather cuirass",
        description: "String cuirass made of boar leather.",
        component_type: "chestplate exterior",
        value: 1000,
        component_tier: 3,
        full_armor_name: "Boar leather armor",
        defense_value: 6,
        stats: {
            agility: {
                multiplier: 0.95,
            }
        }
    });
    item_templates["Wolf leather greaves"] = new ArmorComponent({
        name: "Wolf leather greaves",
        description: "Greaves made of wolf leather. Just attach them onto some pants and you are ready to go.",
        component_type: "leg armor exterior",
        value: 300,
        component_tier: 2,
        full_armor_name: "Wolf leather armored pants",
        defense_value: 2,
        stats: {
            agility: {
                multiplier: 0.95,
            }
        }
    });

    item_templates["Boar leather greaves"] = new ArmorComponent({
        name: "Boar leather greaves",
        description: "Greaves made of thick boar leather. Just attach them onto some pants and you are ready to go.",
        component_type: "leg armor exterior",
        value: 500,
        component_tier: 3,
        full_armor_name: "Boar leather armored pants",
        defense_value: 3,
        stats: {
            agility: {
                multiplier: 0.95,
            }
        }
    });
    item_templates["Wolf leather glove armor"] = new ArmorComponent({
        name: "Wolf leather glove armor",
        description: "Pieces of wolf leather shaped for gloves.",
        component_type: "glove exterior",
        value: 300,
        component_tier: 2,
        full_armor_name: "Wolf leather gloves",
        defense_value: 2,
    });

    item_templates["Boar leather glove armor"] = new ArmorComponent({
        name: "Boar leather glove armor",
        description: "Pieces of boar leather shaped for gloves.",
        component_type: "glove exterior",
        value: 500,
        component_tier: 3,
        full_armor_name: "Boar leather gloves",
        defense_value: 3,
    });

    item_templates["Wolf leather shoe armor"] = new ArmorComponent({
        name: "Wolf leather shoe armor",
        description: "Pieces of wolf leather shaped for shoes.",
        component_type: "shoes exterior",
        value: 300,
        component_tier: 2,
        full_armor_name: "Wolf leather shoes",
        defense_value: 2,
    });

    item_templates["Boar leather shoe armor"] = new ArmorComponent({
        name: "Boar leather shoe armor",
        description: "Pieces of boar leather shaped for shoes.",
        component_type: "shoes exterior",
        value: 500,
        component_tier: 3,
        full_armor_name: "Boar leather shoes",
        defense_value: 3,
    });

    item_templates["Iron chainmail helmet armor"] = new ArmorComponent({
        name: "Iron chainmail helmet armor",
        description: "Best way to keep your head in one piece",
        component_type: "helmet exterior",
        value: 400,
        component_tier: 2,
        full_armor_name: "Iron chainmail helmet",
        defense_value: 4,
        stats: {
            attack_speed: {
                multiplier: 0.98,
            },
            agility: {
                multiplier: 0.9,
            }
        }
    });
    item_templates["Iron chainmail vest"] = new ArmorComponent({
        name: "Iron chainmail vest",
        description: "Basic iron chainmail. Nowhere near as strong as a plate armor",
        component_type: "chestplate exterior",
        value: 800,
        component_tier: 2,
        full_armor_name: "Iron chainmail armor",
        defense_value: 8,
        stats: {
            attack_speed: {
                multiplier: 0.98,
            },
            agility: {
                multiplier: 0.9,
            }
        }
    });
    item_templates["Iron chainmail greaves"] = new ArmorComponent({
        name: "Iron chainmail greaves",
        description: "Greaves made of iron chainmail. Just attach them onto some pants and you are ready to go.",
        component_type: "leg armor exterior",
        value: 400,
        component_tier: 2,
        full_armor_name: "Iron chainmail pants",
        defense_value: 4,
        stats: {
            attack_speed: {
                multiplier: 0.98,
            },
            agility: {
                multiplier: 0.9,
            }
        }
    });
    item_templates["Iron chainmail glove"] = new ArmorComponent({
        name: "Iron chainmail glove",
        description: "Iron chainmail in a form ready to be applied onto a glove.",
        component_type: "glove exterior",
        value: 400,
        component_tier: 2,
        full_armor_name: "Iron chainmail gloves",
        defense_value: 4,
        stats: {
            attack_speed: {
                multiplier: 0.98,
            },
            agility: {
                multiplier: 0.9,
            }
        }
    });

    item_templates["Iron chainmail shoes"] = new ArmorComponent({
        name: "Iron chainmail shoes",
        description: "Iron chainmail in a form ready to be applied onto a pair of shoes.",
        component_type: "shoes exterior",
        value: 400,
        component_tier: 2,
        full_armor_name: "Iron chainmail boots",
        defense_value: 4,
        stats: {
            agility: {
                multiplier: 0.9,
            }
        }
    });
})();

//clothing (functions both as weak armor and as an armor component):
(function(){
    item_templates["Cheap leather vest"] = new Armor({
        name: "Cheap leather vest", 
        description: "Vest providing very low protection. Better not to know what's it made from", 
        value: 100,
        component_type: "chestplate interior",
        base_defense: 2,
        component_tier: 1,
        stats: {
            attack_speed: {
                multiplier: 0.99,
            },
        }
    });
    item_templates["Leather vest"] = new Armor({
        name: "Leather vest", 
        description: "Comfortable leather vest, offering a low protection.", 
        value: 300,
        component_type: "chestplate interior",
        base_defense: 2,
        component_tier: 2,
    });

    item_templates["Cheap leather pants"] = new Armor({
        name: "Cheap leather pants", 
        description: "Leather pants made from cheapest resources available.", 
        value: 100,
        component_type: "leg armor interior",
        base_defense: 1,
        component_tier: 1,
        stats: {
            attack_speed: {
                multiplier: 0.99,
            },
        }
    });
    item_templates["Leather pants"] = new Armor({
        name: "Leather pants", 
        description: "Solid leather pants.", 
        value: 300,
        component_type: "leg armor interior",
        base_defense: 2,
        component_tier: 2,
    });

    item_templates["Cheap leather hat"] = new Armor({
        name: "Cheap leather hat", 
        description: "A cheap leather hat to protect your head.", 
        value: 100,
        component_type: "helmet interior",
        base_defense: 1,
        component_tier: 1,
        stats: {
            attack_speed: {
                multiplier: 0.99,
            },
        }
    });

    item_templates["Leather hat"] = new Armor({
        name: "Leather hat", 
        description: "A nice leather hat to protect your head.", 
        value: 300,
        component_type: "helmet interior",
        base_defense: 2,
        component_tier: 2,
    });

    item_templates["Leather gloves"] = new Armor({
        name: "Leather gloves", 
        description: "Strong leather gloves, perfect for handling rough and sharp objects.", 
        value: 300,
        component_type: "glove interior",
        base_defense: 1,
        component_tier: 2,
    });

    item_templates["Cheap leather shoes"] = new Armor({
        name: "Cheap leather shoes",
        description: "Shoes made of thin and cheap leather. Even then, they are in every single aspect better than not having any.", 
        value: 100,
        component_type: "shoes interior",
        base_defense: 0,
        component_tier: 1,
        stats: {
            agility: {
                multiplier: 1.05,
            },
        }
    });
    item_templates["Leather shoes"] = new Armor({
        name: "Leather shoes", 
        description: "Solid shoes made of leather, a must have for any traveler", 
        value: 300,
        component_type: "shoes interior",
        base_defense: 1,
        component_tier: 2,
        stats: {
            attack_speed: {
                multiplier: 1.02,
            },
            agility: {
                multiplier: 1.1,
            },
        }
    });

    item_templates["Wool shirt"] = new Armor({
        name: "Wool shirt",
        description: "It's thick enough to weaken a blow, but you shouldn't hope for much. On the plus side, it's light and doesn't block your moves.", 
        value: 300,
        component_type: "chestplate interior",
        base_defense: 1,
        component_tier: 2,
        stats: {
            attack_speed: {
                multiplier: 1.01,
            },
            agility: {
                multiplier: 1.02,
            },
        }
    });

    item_templates["Wool pants"] = new Armor({
        name: "Wool pants", 
        description: "Nice woollen pants. Slightly itchy.",
        value: 100,
        component_type: "leg armor interior",
        base_defense: 1,
        component_tier: 2,
    });

    item_templates["Wool hat"] = new Armor({
        name: "Wool hat", 
        description: "Simple woollen hat to protect your head.",
        value: 300,
        component_type: "helmet interior",
        base_defense: 1,
        component_tier: 2,
        stats: {
            attack_speed: {
                multiplier: 1.01,
            },
            agility: {
                multiplier: 1.01,
            },
        }
    });

    item_templates["Wool gloves"] = new Armor({
        name: "Wool gloves",
        description: "Warm and comfy, but they don't provide much protection.",
        value: 300,
        component_type: "glove interior",
        base_defense: 1,
        component_tier: 2,
    });
})();

//armors:
(function(){
    //predefined full (int+ext) armors go here
    item_templates["Wolf leather armor"] = new Armor({
        components: {
            internal: "Leather vest",
            external: "Wolf leather chestplate armor",
        }
    });
    item_templates["Wolf leather helmet"] = new Armor({
        components: {
            internal: "Leather hat",
            external: "Wolf leather helmet armor",
        }
    });
    item_templates["Wolf leather armored pants"] = new Armor({
        components: {
            internal: "Leather pants",
            external: "Wolf leather greaves",
        }
    });

    item_templates["Iron chainmail armor"] = new Armor({
        components: {
            internal: "Leather vest",
            external: "Iron chainmail vest",
        }
    });
    item_templates["Iron chainmail helmet"] = new Armor({
        components: {
            internal: "Leather hat",
            external: "Iron chainmail helmet armor",
        }
    });
    item_templates["Iron chainmail pants"] = new Armor({
        components: {
            internal: "Leather pants",
            external: "Iron chainmail greaves",
        }
    });
})();

//shield components:
(function(){
    item_templates["Cheap wooden shield base"] = new ShieldComponent({
        name: "Cheap wooden shield base", description: "Cheap shield component made of wood, basically just a few planks barely holding together", 
        value: 20, 
        shield_strength: 1, 
        shield_name: "Cheap wooden shield",
        component_tier: 1,
        component_type: "shield base",
    });

    item_templates["Crude wooden shield base"] = new ShieldComponent({
        name: "Crude wooden shield base", description: "A shield base of rather bad quality, but at least it won't fall apart by itself", 
        value: 40,
        shield_strength: 3,
        shield_name: "Crude wooden shield",
        component_tier: 1,
        component_type: "shield base",
    });
    item_templates["Wooden shield base"] = new ShieldComponent({
        name: "Wooden shield base", description: "Proper wooden shield base, although it could use some additional reinforcement", 
        value: 100,
        shield_strength: 5,
        shield_name: "Wooden shield",
        component_tier: 2,
        component_type: "shield base",
    });
    item_templates["Crude iron shield base"] = new ShieldComponent({
        name: "Crude iron shield base", description: "Heavy shield base made of low quality iron.", 
        value: 160,
        shield_strength: 7,
        shield_name: "Crude iron shield",
        component_tier: 2,
        component_type: "shield base",
        stats: {
            attack_speed: {
                multiplier: 0.9,
            }
        }
    });
    item_templates["Iron shield base"] = new ShieldComponent({
        name: "Iron shield base", 
        description: "Solid and strong shield base, although it's quite heavy", 
        value: 260,
        shield_strength: 10,
        shield_name: "Iron shield",
        component_tier: 3,
        component_type: "shield base",
        stats: {
            attack_speed: {
                multiplier: 0.95,
            }
        }
    });
    item_templates["Basic shield handle"] = new ShieldComponent({
        id: "Basic shield handle",
        name: "Crude wooden shield handle", 
        description: "A simple handle for holding the shield", 
        value: 10,
        component_tier: 1,
        component_type: "shield handle",
    });

    item_templates["Wooden shield handle"] = new ShieldComponent({
        name: "Wooden shield handle", 
        description: "A decent wooden handle for holding the shield", 
        value: 40,
        component_tier: 2,
        component_type: "shield handle",
        stats: {
            block_strength: {
                multiplier: 1.1,
            }
        }
    });

})();

//shields:
(function(){
    item_templates["Cheap wooden shield"] = new Shield({
        components: {
            shield_base: "Cheap wooden shield base",
            handle: "Basic shield handle",
        }
    });

    item_templates["Crude wooden shield"] = new Shield({
        components: {
            shield_base: "Crude wooden shield base",
            handle: "Basic shield handle",
        }
    });

    item_templates["Wooden shield"] = new Shield({
        components: {
            shield_base: "Wooden shield base",
            handle: "Wooden shield handle",
        }
    });

    item_templates["Crude iron shield"] = new Shield({
        components: {
            shield_base: "Crude iron shield base",
            handle: "Basic shield handle",
        }
    });

    item_templates["Iron shield"] = new Shield({
        components: {
            shield_base: "Iron shield base",
            handle: "Wooden shield handle",
        }
    });
})();

//trinkets:
(function(){
    item_templates["Wolf trophy"] = new Artifact({
        name: "Wolf trophy",
        value: 50,
        stats: {
            attack_speed: {
                multiplier: 1.05,
            },
            crit_rate: {
                flat: 0.01,
            },
        }
    });

    item_templates["Boar trophy"] = new Artifact({
        name: "Boar trophy",
        value: 80,
        stats: {
            attack_power: {
                multiplier: 1.1,
            },
            crit_multiplier: {
                flat: 0.2,
            },
        }
    });
})();

//tools:
(function(){
    item_templates["Old pickaxe"] = new Tool({
        name: "Old pickaxe",
        description: "An old pickaxe that has seen better times, but is still usable",
        value: 10,
        equip_slot: "pickaxe",
    });

    item_templates["Old axe"] = new Tool({
        name: "Old axe",
        description: "An old axe that has seen better times, but is still usable",
        value: 10,
        equip_slot: "axe",
    });

    item_templates["Old sickle"] = new Tool({
        name: "Old sickle",
        description: "And old herb sickle that has seen better time, but is still usable",
        value: 10,
        equip_slot: "sickle",
    });

    
    item_templates["精钢镐"] = new Tool({
        name: "Steel Pickaxe",
        description: "An ordinary steel pickaxe, capable of mining copper ore.",
        value: 1000,
        equip_slot: "pickaxe",
        bonus_skill_levels: {
            "Mining": 1,
        }
    });
    item_templates["紫铜镐"] = new Tool({
        name: "Copper Pickaxe",
        description: "A copper pickaxe with greatly enhanced mining capability.",
        value: 66666,
        equip_slot: "pickaxe",
        bonus_skill_levels: {
            "Mining": 4,
        }
    });
    item_templates["晶化钻头"] = new Tool({
        name: "晶化钻头",
        description: "一把晶化合金钻头，即使是坚硬的冰块也可以迅速被刨开！",
        value: 36e12,
        equip_slot: "pickaxe",
        bonus_skill_levels: {
            "Mining": 15,
        }
    });
    item_templates["死神之镰"] = new Tool({
        name: "死神之镰",
        description: "虽然名字很唬人，但这些附着的灵魂唯一作用就是更快的收割绝音蕨。<br>[收割]技能视为高4级！",
        value: 12e15,
        equip_slot: "sickle",
    });
    item_templates["暗影斧"] = new Tool({
        name: "Shadow Axe",
        description: "A remarkably sharp axe. Even so, felling century-old willow trees still takes considerable time.",
        value: 3.6e6,
        equip_slot: "axe",
        bonus_skill_levels: {
            "Woodcutting": 6,
        }
    });
    item_templates["充能斧"] = new Tool({
        name: "Charged Axe",
        description: "An even sharper axe. Felling century-old willow trees is now as easy as eating a meal!",
        value: 2.0e7,
        equip_slot: "axe",
        bonus_skill_levels: {
            "Woodcutting": 10,
        }
    });

})();

(function(){
    item_templates["宝石吊坠"] = new Props({
        name: "Gem Pendant",
        id: "宝石吊坠",
        description: "Contains pure life energy, enhancing the rate of absorption of free energy from the air.",
        value: 545455,
        stats: {
            health_regeneration_flat: {
                flat: 225,
            },
        }
    });
    item_templates["生命之眼"] = new Props({
        name: "Eye of Life",
        id: "生命之眼",
        description: "Ever seeking the vibrant wellspring of life.",
        value: 4444444,
        stats: {
            max_health: {
                flat: 450000,
            },
        }
    });
    item_templates["人造茸茸"] = new Props({
        name: "Artificial Fluffling",
        id: "人造茸茸",
        description: "A puppet fluffling revived using still-active gel, with a core and soul implanted. It can sense danger ahead, but carrying it will inevitably get in the way.",
        value: 7777777,
        stats: {
            attack_power: {
                flat: -1000,
            },
            defense: {
                flat: -1000,
            },
            agility: {
                flat: 6000,
            }
        }
    });
    item_templates["巨剑徽章"] = new Props({
        name: "Giant Sword Badge",
        id: "巨剑徽章",
        description: "Few people realize that the blade-coins of the Xuelo Continent contain extraordinary power. However, the backlash force within them should not be underestimated.",
        value: 23456789,
        stats: {
            attack_power: {
                flat: 6000,
            },
            health_regeneration_percent: {
                flat: -1,
            }
        }
    });
    item_templates["玻璃小炮"] = new Props({
        name: "Glass Mini Cannon",
        id: "玻璃小炮",
        description: "The Glass Cannon before it has reached its fully evolved state. But the cannon may be gone — the glass remains...",
        value: 67108864,
        stats: {
            attack_power: {
                flat: 5000,
            },
            defense: {
                flat: -5000,
            }
        }
    });
    item_templates["水火徽章"] = new Props({
        name: "Water-Fire Badge",
        id: "水火徽章",
        description: "A badge that forms an energy cycle using the essence of two elemental beast types. Greatly increases regeneration speed and also boosts health slightly.",
        value: 720000000,
        stats: {
            health_regeneration_flat: {
                flat: 28888,
            },
            max_health: {
                flat: 500000,
            },
        }
    });
    item_templates["三相徽章"] = new Props({
        name: "Tri-Aspect Badge",
        id: "三相徽章",
        description: "A badge that forms an energy cycle using the essence of three elemental beast types. Just a little wind-attribute energy short of perfection...",
        value: 9.9e9,
        stats: {
            health_regeneration_flat: {
                flat: 288888,
            },
            max_health: {
                flat: 5000000,
            },
        }
    });

    
    item_templates["摩羽巨币"] = new Props({
        name: "Mota Giant Coin",
        id: "摩羽巨币",
        description: "Unfortunately, the Mota Star doesn't have traditions like Shenghuang City. This money can only serve as a giant shield.",
        value: 0.999e12,
        stats: {
            attack_speed: {
                multiplier: 0.7,
            },
            defense: {
                flat:3333333,
            },
            agility: {
                multiplier: 0.7,
            }
        }
    });

    item_templates["玻璃大炮"] = new Props({
        name: "Glass Cannon",
        id: "玻璃大炮",
        description: "You can even craft one yourself! Though it's been strengthened, it's still quite fragile...",
        value: 300e9,
        stats: {
            attack_power: {
                flat: 300000,
            },
            defense: {
                flat: -5000,
            }
        }
    });

    item_templates["长明灯"] = new Props({
        name: "Eternal Lantern",
        id: "长明灯",
        description: "A sky lantern lit by a mixture of fluorescent essence and swamp beast oil. It can dispel the miasma of the swamps and briefly stun wild beasts that have never seen light.",
        value: 9.9e12,
        stats: {
            agility: {
                flat: 7500000,
            }
        }
    });
    item_templates["荒兽傀儡"] = new Props({
        name: "Wild Beast Puppet",
        id: "荒兽傀儡",
        description: "A forbidden creation recorded in the spaceship's core. However, its actual use is only to run ahead and generate aggro... drawing more enemies.<br><span class='realm_cloudy'><b>Ascendant Tier 1+</b></span> ineffective!",
        value: 29.9e12,
        stats: {
            agility: {
                multiplier: 0.5,
            },
            luck: {
                multiplier: 1.2,
            }
        }
    });
    item_templates["光环法杖"] = new Props({
        name: "光环法杖",
        id: "光环法杖",
        description: "对敌人释放额外的25%光环！<br>(掉落+25%,经验+39.7%) <br>PS:对<span class='realm_cloudy'>云霄级</span>以上目标或<b>[BOSS]</b>目标无效。", 
        value: 864e12,
        stats: {
        }
    });
    item_templates["冰刺装甲"] = new Props({
        name: "Ice Spike Armor",
        id: "冰刺装甲",
        description: "Sure, enemies can spot you from two miles away — but the ice spikes covering your body make for an all-in-one offensive and defensive treasure! (Agility? What agility?)",
        value: 120e12,
        stats: {
            attack_power: {
                flat: +1500e4,
            },
            defense: {
                flat: +1500e4,
            },
            agility: {
                flat: -2400e4,
            }
        }
    });
    item_templates["虹彩灯球"] = new Props({
        name: "虹彩灯球",
        id: "虹彩灯球",
        description: "大量虹彩杖芯拼合而成的迪斯科灯球，因为水素合金的硬度而难以击碎。可以让敌人愣神，无法组织防御！", 
        value: 2880e12,
        stats: {
            attack_power: {
                flat: +7500e4,
            },
            agility: {
                flat: +4500e4,
            },
        }
    });
    item_templates["传承水晶·彩"] = new Props({
        name: "传承水晶·彩",
        id: "传承水晶·彩",
        description: "幻境中的敌人都源自这些水晶，在它们附近时敌人精神最为松懈，等效于提供属性！", 
        value: 24.16e15,
        stats: {
            attack_power: {
                flat: +3e8,
            },
            defense: {
                flat: +3e8,
            },
            agility: {
                flat: +5e8,
            },
        }
    });
    item_templates["幻符灵阵"] = new Props({
        name: "幻符灵阵",
        id: "幻符灵阵",
        description: "收拢月轮水晶，凝聚力量，蓄力一击。攻击的广度收窄许多，但深度却足以穿透最坚硬的天空级金属。<br><span class='realm_cloudy'><b>云霄级四阶</b></span>失效!", 
        value: 24.16e15,
        stats: {
            attack_power: {
                multiplier: 1.25,
            },
            attack_mul: {
                multiplier: 0.4,
            },
        }
    });


})();


(function(){
    item_templates["三月断宵"] = new Method({
        name: "Three-Month Severed Night",
        id: "三月断宵",
        description: "A cultivation method suitable for sky-realm cultivators. Greatly increases the efficiency of skill proficiency accumulation, while also slightly increasing the rate of free energy absorption.",
        value: 909090,
        stats: {
            health_regeneration_flat: {
                flat: 100,
            },
        }
    });
    item_templates["星解之术"] = new Method({
        name: "Star-Dissolution Technique",
        id: "星解之术",
        description: "Unleashes the genetic primal force within the body to dissolve the brilliant stars of the cosmos. Increases overall XP gain rate, with particular promotion of domain comprehension.",
        value: 9090909090909,
        stats: {
            health_regeneration_flat: {
                flat: 2000000,
            },
        }
    });
    item_templates["映星紫华"] = new Method({
        name: "映星紫华",
        id: "映星紫华",
        description: "神秘令人难以捉摸的进阶术式，于内敛的紫色光华之中，蕴含着令人心惊胆颤的力量。", 
        value: 909090909090909090,//16位数(90.91U)
        stats: {
            health_regeneration_flat: {
                flat: 5e8,
            },
            crit_multiplier: {
                flat: 0.12,
            },
        }
    });
})();


(function(){
    item_templates["微火"] = new Realm({
        name: "Micro Flame",
        id: "微火",
        description: "The insight to ignite flames using simple mental focus.",
        value: 90909090,//100Z
        stats: {
            attack_power: {
                flat: 1000,
            },
            defense: {
                flat: 1000,
            },
            attack_mul: {
                multiplier: 1.5,
            },
        }
    });
    item_templates["燃灼术"] = new Realm({
        name: "Flame-Searing Art",
        id: "燃灼术",
        description: "The mental flame burns intensely, as if it would set the very space alight.",
        value: 61538461e3,//100D
        stats: {
            attack_power: {
                multiplier: 1.05,
            },
            defense: {
                multiplier: 1.05,
            },
            max_health: {
                multiplier: 1.2,
            },
            attack_mul: {
                multiplier: 1.5,
            },
        }
    });
    
    item_templates["火灵幻海[领域一重]"] = new Realm({
        name: "Fire Spirit Illusion Sea [Domain Stage 1]",
        id: "火灵幻海[领域一重]",
        description: "Entirely red flame creatures drift through the air, the fire-element fluctuations they radiate converging into a sea.",
        value: 4310344e6,//10B
        stats: {
            attack_power: {
                multiplier: 1.08,
            },
            defense: {
                multiplier: 1.08,
            },
            max_health: {
                multiplier: 1.3,
            },
            attack_mul: {
                multiplier: 2.0,
            },
        }
    });

    item_templates["焰海霜天[领域二重]"] = new Realm({
        name: "Flame-Sea Frost Sky [Domain Stage 2]",
        id: "焰海霜天[领域二重]",
        description: "A wondrous domain formed by the harmonization of two conflicting elements. Beneath the heaven of ice and fire, cold and heat inflict dual torment — living beings, keep away.",
        value: 285714e9,//1U
        stats: {
            attack_power: {
                multiplier: 1.12,
            },
            defense: {
                multiplier: 1.12,
            },
            max_health: {
                multiplier: 1.3,
            },
            attack_mul: {
                multiplier: 2.25,
            },
        }
    });
    item_templates["焰海霜天[领域三重]"] = new Realm({
        name: "Flame-Sea Frost Sky [Domain Stage 3]",
        id: "焰海霜天[领域三重]",
        description: "A wondrous domain formed by the harmonization of two conflicting elements. Beneath the heaven of ice and fire, cold and heat inflict dual torment — living beings, keep away.",
        value: 2857142e9,//10U
        stats: {
            attack_power: {
                multiplier: 1.20,
            },
            defense: {
                multiplier: 1.20,
            },
            max_health: {
                multiplier: 1.35,
            },
            attack_mul: {
                multiplier: 2.50,
            },
        }
    });
    item_templates["出云落月[领域四重]"] = new Realm({
        name: "出云落月[领域四重]",
        id: "出云落月[领域四重]",
        description: "水火元素纵横交错而成的领域。水帘之间，一袭布裙如同仙子临凡，出云之姿风华绝代；火焰灼烧，暗藏杀机凌厉，剑锋所向，斩断天际，月落星沉！。", 
        value: 28571427e9,//100U
        stats: {
            attack_power: {
                multiplier: 1.30,
            },
            defense: {
                multiplier: 1.30,
            },
            max_health: {
                multiplier: 1.50,
            },
            attack_mul: {
                multiplier: 3.00,
            },
        }
    });
})();

        /*
百分比：
燃灼5%/20%
火灵幻海8%/30%
焰海霜天12%/30%
领域三重20%/35%
 */
(function(){
    item_templates["纳娜米"] = new Special({
        name: "Nanami",
        id: "纳娜米",
        description: "Don't sell big sis! You demon!<br>(Tips: Without big sis, the dungeon won't be weakened to 1/100 stats)",
        value: 861082713,
        stats: {
            attack_power: {
                multiplier: 1.3,
            },
            defense: {
                multiplier: 1.3,
            },
            agility: {
                multiplier: 1.3,
            },
            max_health: {
                multiplier: 1.3,
            }
        }
    });
    
    item_templates["纳娜米(飞船)"] = new Special({
        name: "Nanami (Spaceship)",
        id: "纳娜米(飞船)",
        description: "Don't sell big sis! You demon!<br>(Tips: Without big sis, Spaceship Hub B6 won't explode on turn ten)",
        value: 77777777e6,
        stats: {
            attack_power: {
                multiplier: 1.1,
            },
            defense: {
                multiplier: 1.1,
            },
            agility: {
                multiplier: 1.1,
            },
            max_health: {
                multiplier: 1.1,
            }
        }
    });
    item_templates["纳娜米(冰原)"] = new Special({
        name: "Nanami (Ice Plains)",
        id: "纳娜米(冰原)",
        description: "This one... doesn't have a laser gun, so selling her is fine. But this is a precious one-time item! How could you bear to sell it!",
        value: 64e12,
        stats: {
            attack_power: {
                multiplier: 1.05,
            },
            defense: {
                multiplier: 1.05,
            },
            agility: {
                multiplier: 1.05,
            },
            max_health: {
                multiplier: 1.05,
            }
        }
    });
    
    item_templates["结界湖之心"] = new Special({
        name: "Boundary Lake Heart",
        id: "结界湖之心",
        description: "Proof of a warrior who dared to challenge multiple ice-spike fish. Still only in its initial form — perhaps one day it can surpass big sis?",
        value: 2.4e9,
        stats: {
            attack_power: {
                multiplier: 1.01,
            },
            defense: {
                multiplier: 1.01,
            },
            agility: {
                multiplier: 1.01,
            },
            max_health: {
                multiplier: 1.01,
            }
        }
    });
    
    item_templates["飞船之心"] = new Special({
        name: "Spaceship Heart",
        id: "飞船之心",
        description: "The first upgrade of the Boundary Lake Heart. Don't worry that big sis in Act 3 will be useless... she's been strengthened.",
        value: 4.8e12,
        stats: {
            attack_power: {
                multiplier: 1.03,
            },
            defense: {
                multiplier: 1.03,
            },
            agility: {
                multiplier: 1.03,
            },
            max_health: {
                multiplier: 1.03,
            }
        }
    });
    item_templates["冰原之心"] = new Special({
        name: "冰原之心",
        id: "冰原之心",
        description: "结界湖之心的又一次升级。极寒相变引擎玩的开心吗~", 
        value: 160e12,
        stats: {
            attack_power: {
                multiplier: 1.06,
            },
            defense: {
                multiplier: 1.06,
            },
            agility: {
                multiplier: 1.06,
            },
            max_health: {
                multiplier: 1.06,
            }
        }
    });
    item_templates["幻境之心"] = new Special({
        name: "幻境之心",
        id: "幻境之心",
        description: "这甚至还不是最终形态。对了，这个超长的材料清单有没有出bug啊？", 
        value: 218.7e15,
        stats: {
            attack_power: {
                multiplier: 1.10,
            },
            defense: {
                multiplier: 1.10,
            },
            agility: {
                multiplier: 1.10,
            },
            max_health: {
                multiplier: 1.10,
            }
        }
    });

})();
//usables:
(function(){

    item_templates["Weak healing powder"] = new UsableItem({
        name: "Weak healing powder", 
        description: "Not very potent, but can still make body heal noticeably faster for quite a while", 
        value: 40,
        effects: [{effect: "Weak healing powder", duration: 120}],
    });

    item_templates["Oneberry juice"] = new UsableItem({
        name: "Oneberry juice", 
        description: "Tastes kinda nice and provides a quick burst of healing", 
        value: 80,
        effects: [{effect: "Weak healing potion", duration: 10}],
    });
})();



//NekoRPG items below
//武器部件
(function(){
    item_templates["铁剑刃"] = new WeaponComponent({
        name: "Iron sword blade", description: "A sword blade forged from iron ingots, the core component of an iron sword.",
        component_type: "long blade",
        value: 125,
        component_tier: 0,
        name_prefix: "Iron",
        attack_value: 16,
        stats: {
            crit_rate: {
                flat: 0.05,
            },
            attack_speed: {
                multiplier: 1.02,
            }
        }
    });
    
    item_templates["精钢剑刃"] = new WeaponComponent({
        name: "Steel sword blade", description: "A sword blade forged from steel ingots, far sharper than an iron blade.",
        component_type: "long blade",
        value: 900,
        component_tier: 1,
        name_prefix: "Steel",
        attack_value: 48,
        stats: {
            crit_rate: {
                flat: 0.06,
            },
            attack_speed: {
                multiplier: 1.04,
            }
        }
    });
    
    item_templates["紫铜剑刃"] = new WeaponComponent({
        name: "Copper sword blade", description: "A sword blade forged from copper ingots, combining sharpness with agility.",
        component_type: "long blade",
        value: 40000,
        component_tier: 2,
        name_prefix: "Copper",
        attack_value: 200,
        stats: {
            crit_rate: {
                flat: 0.07,
            },
            attack_speed: {
                multiplier: 1.06,
            }
        }
    });
    item_templates["宝石剑刃"] = new WeaponComponent({
        name: "Gem sword blade", description: "A forged gem-infused sword blade. Imbued with magic power, critical hit rate increased.",
        component_type: "long blade",
        value: 500e3,
        component_tier: 3,
        name_prefix: "Gem",
        attack_value: 640,
        stats: {
            crit_rate: {
                flat: 0.08,
            },
            attack_speed: {
                multiplier: 1.08,
            }
        }
    });
    item_templates["地宫剑刃"] = new WeaponComponent({
        name: "Dungeon sword blade", description: "A sword blade made of dungeon metal. The market is saturated so it can't be sold, but it's still great for personal use.",
        component_type: "long blade",
        value: 120e3,
        component_tier: 3,
        name_prefix: "Dungeon",
        attack_value: 640,
        stats: {
            crit_rate: {
                flat: 0.08,
            },
            attack_speed: {
                multiplier: 1.08,
            },
            agility: {
                flat:80,
            }
        }
    });
    item_templates["暗影剑刃"] = new WeaponComponent({
        name: "Shadow sword blade", description: "A sword blade made of shadow steel ingots. Powerful and forceful, though a bit heavy.",
        component_type: "long blade",
        value: 2.8e6,
        component_tier: 4,
        name_prefix: "Shadow",
        attack_value: 1440,
        stats: {
            crit_rate: {
                flat: 0.09,
            },
            attack_speed: {
                multiplier: 1.10,
            },
            agility: {
                flat:-320,
            }
        }
    });
    item_templates["充能剑刃"] = new WeaponComponent({
        name: "Charged sword blade", description: "A sword blade made of charged alloy ingots. No negative stats — only pure sharpness.",
        component_type: "long blade",
        value: 1.5e7,
        component_tier: 5,
        name_prefix: "Charged",
        attack_value: 4320,
        stats: {
            crit_rate: {
                flat: 0.10,
            },
            attack_speed: {
                multiplier: 1.11,
            },
        }
    });
    item_templates["充能戟头"] = new WeaponComponent({
        name: "Charged trident head", description: "A trident head made of charged alloy ingots. It can pierce three holes at once, but is somewhat difficult to pull out...",
        component_type: "triple blade",
        value: 4.5e7,
        component_tier: 5,
        name_prefix: "Charged",
        attack_value: 6000,
        stats: {
            crit_rate: {
                flat: 0.10,
            },
            attack_mul: {
                multiplier: 3.00,
            },
            attack_speed: {
                multiplier: 0.50,
            },
        }
    });
    
    item_templates["脉冲剑刃"] = new WeaponComponent({
        name: "Pulse sword blade", description: "A sword blade made of pulse alloy ingots. Later sword blade tiers primarily increase critical hit rate and attack speed.",
        component_type: "long blade",
        value: 60e6,
        component_tier: 6,
        name_prefix: "Pulse",
        attack_value: 17280,
        stats: {
            crit_rate: {
                flat: 0.12,
            },
            attack_speed: {
                multiplier: 1.12,
            },
        }
    });
    item_templates["脉冲戟头"] = new WeaponComponent({
        name: "Pulse trident head", description: "A trident head made of pulse alloy ingots. Normal attack multiplier slightly better than the charged trident head?",
        component_type: "triple blade",
        value: 180e6,
        component_tier: 6,
        name_prefix: "Pulse",
        attack_value: 24000,
        stats: {
            crit_rate: {
                flat: 0.10,
            },
            attack_mul: {
                multiplier: 3.10,
            },
            attack_speed: {
                multiplier: 0.50,
            },
        }
    });
    
    item_templates["蓝金剑刃"] = new WeaponComponent({
        name: "Blue-Gold sword blade", description: "A sword blade made of blue-gold ingots. Attack speed and critical rate improved another notch.",
        component_type: "long blade",
        value: 480e6,
        component_tier: 7,
        name_prefix: "Blue-Gold",
        attack_value: 43200,
        stats: {
            crit_rate: {
                flat: 0.14,
            },
            attack_speed: {
                multiplier: 1.13,
            },
        }
    });
    item_templates["蓝金戟头"] = new WeaponComponent({
        name: "Blue-Gold trident head", description: "A trident head made of blue-gold ingots. Normal attack multiplier improved another notch.",
        component_type: "triple blade",
        value: 1440e6,
        component_tier: 7,
        name_prefix: "Blue-Gold",
        attack_value: 60000,
        stats: {
            crit_rate: {
                flat: 0.10,
            },
            attack_mul: {
                multiplier: 3.20,
            },
            attack_speed: {
                multiplier: 0.50,
            },
        }
    });
    
    item_templates["海绿剑刃"] = new WeaponComponent({
        name: "Sea Green sword blade", description: "A sword blade made of sea green ingots.",
        component_type: "long blade",
        value: 1200e6,
        component_tier: 8,
        name_prefix: "Sea Green",
        attack_value: 129600,
        stats: {
            crit_rate: {
                flat: 0.15,
            },
            attack_speed: {
                multiplier: 1.14,
            },
        }
    });
    item_templates["海绿戟头"] = new WeaponComponent({
        name: "Sea Green trident head", description: "A trident head made of sea green ingots.",
        component_type: "triple blade",
        value: 3600e6,
        component_tier: 8,
        name_prefix: "Sea Green",
        attack_value: 180000,
        stats: {
            crit_rate: {
                flat: 0.10,
            },
            attack_mul: {
                multiplier: 3.30,
            },
            attack_speed: {
                multiplier: 0.50,
            },
        }
    });
    
    item_templates["红钢剑刃"] = new WeaponComponent({
        name: "Red Steel sword blade", description: "A sword blade made of red steel ingots.",
        component_type: "long blade",
        value: 3200e6,
        component_tier: 9,
        name_prefix: "Red Steel",
        attack_value: 388800,
        stats: {
            crit_rate: {
                flat: 0.15,
            },
            attack_speed: {
                multiplier: 1.15,
            },
        }
    });
    item_templates["红钢戟头"] = new WeaponComponent({
        name: "Red Steel trident head", description: "A trident head made of red steel ingots.",
        component_type: "triple blade",
        value: 9600e6,
        component_tier: 9,
        name_prefix: "Red Steel",
        attack_value: 540000,
        stats: {
            crit_rate: {
                flat: 0.10,
            },
            attack_mul: {
                multiplier: 3.40,
            },
            attack_speed: {
                multiplier: 0.50,
            },
        }
    });
    item_templates["秘银剑刃"] = new WeaponComponent({
        name: "Mithril sword blade", description: "A sword blade made of mithril ingots.",
        component_type: "long blade",
        value: 40e9,
        component_tier: 10,
        name_prefix: "Mithril",
        attack_value: 1440000,
        stats: {
            crit_rate: {
                flat: 0.15,
            },
            attack_speed: {
                multiplier: 1.16,
            },
        }
    });
    item_templates["秘银戟头"] = new WeaponComponent({
        name: "Mithril trident head", description: "A trident head made of mithril ingots.",
        component_type: "triple blade",
        value: 120e9,
        component_tier: 10,
        name_prefix: "Mithril",
        attack_value: 1800000,
        stats: {
            crit_rate: {
                flat: 0.10,
            },
            attack_mul: {
                multiplier: 3.60,
            },
            attack_speed: {
                multiplier: 0.50,
            },
        }
    });
    item_templates["旋律剑刃"] = new WeaponComponent({
        name: "Melody sword blade", description: "A sword blade made of melody alloy ingots. The potential of cold weapons has been fully unlocked — their bonus stats will not continue to improve.",
        component_type: "long blade",
        value: 600e9,
        component_tier: 11,
        name_prefix: "Melody",
        attack_value: 2880000,
        stats: {
            crit_rate: {flat: 0.15,},
            attack_speed: {multiplier: 1.16,},
        }
    });
    item_templates["旋律戟头"] = new WeaponComponent({
        name: "Melody trident head", description: "A trident head made of melody alloy ingots. The potential of cold weapons has been fully unlocked — their bonus stats will not continue to improve.",
        component_type: "triple blade",
        value: 1800e9,
        component_tier: 11,
        name_prefix: "Melody",
        attack_value: 3600000,
        stats: {
            crit_rate: {flat: 0.10,},
            attack_mul: {multiplier: 3.60,},
            attack_speed: {multiplier: 0.50,},
        }
    });
    
    item_templates["冰髓剑刃"] = new WeaponComponent({
        name: "Ice Marrow sword blade", description: "A sword blade made of ten-thousand-year ice marrow. This is a genuinely 【cold】 weapon.",
        component_type: "long blade",
        value: 1800e9,
        component_tier: 12,
        name_prefix: "Ice Marrow",
        attack_value: 6480000,
        stats: {
            crit_rate: {flat: 0.15,},
            attack_speed: {multiplier: 1.16,},
        }
    });
    item_templates["冰髓戟头"] = new WeaponComponent({
        name: "Ice Marrow Trident Head", description: "A trident head made of ten-thousand-year ice marrow. This is a genuinely 【cold】 weapon.",
        component_type: "triple blade",
        value: 5400e9,
        component_tier: 12,
        name_prefix: "Ice Marrow",
        attack_value: 8100000,
        stats: {
            crit_rate: {flat: 0.10,},
            attack_mul: {multiplier: 3.60,},
            attack_speed: {multiplier: 0.50,},
        }
    });
    item_templates["晶化剑刃"] = new WeaponComponent({
        name: "晶化剑刃", description: "晶化合金制造的剑刃。是时候该去做月轮了不是吗？",
        component_type: "long blade",
        value: 6e12,
        component_tier: 13,
        name_prefix: "晶化",
        attack_value: 12960000,
        stats: {
            crit_rate: {flat: 0.15,},
            attack_speed: {multiplier: 1.16,},
        }
    });
    item_templates["晶化戟头"] = new WeaponComponent({
        name: "晶化戟头", description: "晶化合金制造的戟头。部件经验和使用的材料量挂钩，我是说，做月轮不亏……",
        component_type: "triple blade",
        value: 18e12,
        component_tier: 13,
        name_prefix: "晶化",
        attack_value: 16200000,
        stats: {
            crit_rate: {flat: 0.10,},
            attack_mul: {multiplier: 3.60,},
            attack_speed: {multiplier: 0.50,},
        }
    });
    item_templates["骨剑柄"] = new WeaponComponent({
        name: "Bone sword hilt", description: "A sword hilt made from white bone. Brittle, so it affects the wielder when used.",
        component_type: "short handle",
        value: 15,
        component_tier: 0,
        stats: {
            attack_speed: {
                multiplier: 0.95,
            },
            attack_power: {
                multiplier: 0.8,
            }
        }
    });
    item_templates["铜骨剑柄"] = new WeaponComponent({
        name: "Copper Bone sword hilt", description: "A sword hilt made from copper bone. Sturdy and practical!",
        component_type: "short handle",
        value: 50,
        component_tier: 1,
        stats: {
            attack_speed: {
                multiplier: 1.00,
            },
        }
    });
    item_templates["改良剑柄"] = new WeaponComponent({
        name: "Improved sword hilt", description: "A sword hilt composed of multiple materials. Provides compound stat bonuses!",
        component_type: "short handle",
        value: 25000,
        component_tier: 2,
        stats: {
            agility: {
                flat: 40.00,
            },
            crit_multiplier: {
                flat: 0.1,
            },
        }
    });
    item_templates["柳木剑柄"] = new WeaponComponent({
        name: "Willow sword hilt", description: "A sword hilt made of activated willow wood. Genetic primal energy conduction has never been smoother!",
        component_type: "short handle",
        value: 5.0e6,
        component_tier: 4,
        stats: {
            attack_mul: {
                flat: 0.1,
            },
            crit_multiplier: {
                flat: 0.2,
            },
            agility: {
                flat: 2000.00,
            },
        }
    });
    item_templates["水晶剑柄"] = new WeaponComponent({
        name: "Crystal sword hilt", description: "A sword hilt made of wrapped crystal. The transparent appearance helps analyze primal energy flow and optimize force delivery!",
        component_type: "short handle",
        value: 475e6,
        component_tier: 6,
        stats: {
            attack_mul: {
                flat: 0.2,
            },
            crit_multiplier: {
                flat: 0.3,
            },
            health_regeneration_flat: {
                flat: 4000.00,
            },
        }
    });
    
    item_templates["凝胶剑柄"] = new WeaponComponent({
        name: "Gel sword hilt", description: "A sword hilt made of waxy solid gel, lightweight with excellent energy conduction and grip.",
        component_type: "short handle",
        value: 1.2e9,
        component_tier: 9,
        stats: {
            attack_mul: {
                flat: 0.3,
            },
            crit_multiplier: {
                flat: 0.4,
            },
            agility: {
                flat: 120000,
            },
        }
    });
    item_templates["光暗剑柄"] = new WeaponComponent({
        name: "Light-Dark sword hilt", description: "This is the final sword hilt. Looks decent, but it may not actually beat 300% gel..",
        component_type: "short handle",
        value: 400e9,
        component_tier: 11,
        stats: {
            attack_mul: {
                flat: 0.4,
            },
            crit_multiplier: {
                flat: 0.6,
            },
            agility: {
                flat: 1440000,
            },
        }
    });

    
    item_templates["凝胶轮芯"] = new WeaponComponent({
        name: "Gel wheel core", description: "The basic version of the 【Moonwheel】 core. Barely functional at best...",
        component_type: "wheel core",
        value: 7.2e9,
        component_tier: 9,
        stats: {
            crit_multiplier: {
                flat: 0.2,
            },
        }
    });
    item_templates["秘银轮锋"] = new WeaponComponent({
        name: "Mithril wheel blade", description: "A 【Moonwheel】 coating made of mithril ingots. Clearly insufficient as a third-tier mental weapon material, but still sturdy enough for the first two stages.",
        component_type: "wheel head",
        value: 360e9,
        component_tier: 10,
        name_prefix: "Mithril",
        attack_value: 1800000,
        stats: {
            crit_rate: {
                flat: 0.1,
            },
            attack_speed: {
                multiplier: 1.1,
            },
        }
    });
    item_templates["光暗轮芯"] = new WeaponComponent({
        name: "Light-Dark wheel core", description: "An entry-level 【Moonwheel】 core component. Compared to forcibly controlled gel, light-dark branches are truly orthodox mental energy-sensing materials.",
        component_type: "wheel core",
        value: 2400e9,
        component_tier: 11,
        stats: {
            crit_multiplier: {
                flat: 0.4,
            },
            attack_power: {
                multiplier: 1.02,
            },
        }
    });
    item_templates["旋律轮锋"] = new WeaponComponent({
        name: "Melody wheel blade", description: "A 【Moonwheel】 coating made of melody alloy ingots. At B6 grade, it qualifies as a second-tier mental weapon and won't impede speed increases.",
        component_type: "wheel head",
        value: 5400e9,
        component_tier: 11,
        name_prefix: "Melody",
        attack_value: 3600000,
        stats: {
            crit_rate: {
                flat: 0.18,
            },
            attack_speed: {
                multiplier: 1.15,
            },
        }
    });
    item_templates["冰髓轮锋"] = new WeaponComponent({
        name: "Ice Marrow wheel blade", description: "A 【Moonwheel】 coating made of ten-thousand-year ice marrow. A flash of cold light — I mean a genuine 【cold light】!",
        component_type: "wheel head",
        value: 16200e9,
        component_tier: 12,
        name_prefix: "Ice Marrow",
        attack_value: 9000000,
        stats: {
            crit_rate: {
                flat: 0.20,
            },
            attack_speed: {
                multiplier: 1.16,
            },
        }
    });
    item_templates["晶化轮锋"] = new WeaponComponent({
        name: "晶化轮锋", description: "晶化合金制造的【月轮】镀层。融合之后冰元素可以更好地散发出来，增强威力。",
        component_type: "wheel head",
        value: 36e12,
        component_tier: 13,
        name_prefix: "晶化",
        attack_value: 2400e4,
        stats: {
            crit_rate: {
                flat: 0.22,
            },
            attack_speed: {
                multiplier: 1.17,
            },
        }
    });
    item_templates["水素轮锋"] = new WeaponComponent({
        name: "水素轮锋", description: "水素合金制造的【月轮】镀层。虽然水素合金几近透明，但越是如此越能让轮芯显得光彩夺目。",
        component_type: "wheel head",
        value: 248.4e12,
        component_tier: 14,
        name_prefix: "水素",
        attack_value: 7200e4,
        stats: {
            crit_rate: {
                flat: 0.24,
            },
            attack_speed: {
                multiplier: 1.18,
            },
        }
    });
    
    item_templates["虹彩轮芯"] = new WeaponComponent({
        name: "虹彩轮芯", description: "初阶的【月轮】核心部件。借助它，月轮终于开始向流光溢彩的方向靠拢。",
        component_type: "wheel core",
        value: 100.8e12,
        component_tier: 14,
        stats: {
            crit_multiplier: {
                flat: 0.6,
            },
            attack_power: {
                multiplier: 1.03,
            },
        }
    });
    item_templates["破空轮芯"] = new WeaponComponent({
        name: "破空轮芯", description: "中阶的【月轮】核心部件。反重力场可以迷惑视线——也就是敌人甚至看不见它就被攻击了。",
        component_type: "wheel core",
        value: 4608e12,
        component_tier: 16,
        stats: {
            crit_multiplier: {
                flat: 0.8,
            },
            attack_power: {
                multiplier: 1.04,
            },
        }
    });
    item_templates["宝石轮锋"] = new WeaponComponent({
        name: "宝石轮锋", description: "宝石母制造的【月轮】镀层。嗯……A1的宝石锭造不了轮锋。没有歧义！",
        component_type: "wheel head",
        value: 1436.4e12,
        component_tier: 15,
        name_prefix: "宝石",
        attack_value: 16800e4,
        stats: {
            crit_rate: {
                flat: 0.26,
            },
            attack_speed: {
                multiplier: 1.19,
            },
        }
    });
    item_templates["魂晶轮锋"] = new WeaponComponent({
        name: "魂晶轮锋", description: "魂晶制造的【月轮】镀层。这是最后一处18个锭的消耗了……再往后会是完整版36锭的月轮！",
        component_type: "wheel head",
        value: 7290e12,
        component_tier: 16,
        name_prefix: "魂晶",
        attack_value: 47040e4,
        stats: {
            crit_rate: {
                flat: 0.28,
            },
            attack_speed: {
                multiplier: 1.20,
            },
        }
    });

})();
//武器
(function(){
    item_templates["铁剑"] = new Weapon({
        components: {
            head: "铁剑刃",
            handle: "骨剑柄",
        }
    });
    item_templates["铁剑·改"] = new Weapon({
        components: {
            head: "铁剑刃",
            handle: "铜骨剑柄",
        }
    });
    item_templates["精钢剑"] = new Weapon({
        components: {
            head: "精钢剑刃",
            handle: "铜骨剑柄",
        }
    });
    
    item_templates["充能剑"] = new Weapon({
        components: {
            head: "充能剑刃",
            handle: "柳木剑柄",
        }
    });
    item_templates["充能戟"] = new Weapon({
        components: {
            head: "充能戟头",
            handle: "柳木剑柄",
        }
    });

    
    item_templates["海绿剑"] = new Weapon({
        components: {
            head: "海绿剑刃",
            handle: "水晶剑柄",
        }
    });
    item_templates["海绿戟"] = new Weapon({
        components: {
            head: "海绿戟头",
            handle: "水晶剑柄",
        }
    });

    
    item_templates["红钢剑"] = new Weapon({
        components: {
            head: "红钢剑刃",
            handle: "凝胶剑柄",
        }
    });
    item_templates["红钢戟"] = new Weapon({
        components: {
            head: "红钢戟头",
            handle: "凝胶剑柄",
        }
    });
    item_templates["秘银月轮"] = new Weapon({
        components: {
            head: "秘银轮锋",
            handle: "凝胶轮芯",
        }
    });
    item_templates["旋律剑"] = new Weapon({
        components: {
            head: "旋律剑刃",
            handle: "光暗剑柄",
        }
    });
    item_templates["旋律戟"] = new Weapon({
        components: {
            head: "旋律戟头",
            handle: "光暗剑柄",
        }
    });
    item_templates["晶化剑"] = new Weapon({
        components: {
            head: "晶化剑刃",
            handle: "光暗剑柄",
        }
    });
    item_templates["晶化戟"] = new Weapon({
        components: {
            head: "晶化戟头",
            handle: "光暗剑柄",
        }
    });
    item_templates["晶化月轮"] = new Weapon({
        components: {
            head: "晶化轮锋",
            handle: "光暗轮芯",
        }
    });
    item_templates["水素月轮"] = new Weapon({
        components: {
            head: "水素轮锋",
            handle: "虹彩轮芯",
        }
    });
    item_templates["宝石月轮"] = new Weapon({
        components: {
            head: "宝石轮锋",
            handle: "虹彩轮芯",
        }
    });
})();
//盔甲部件
(function(){
    item_templates["粘合帽子"] = new Armor({
        name: "Adhesive Hat",
        description: "Head inner armor bonded together from gel and moth wings.",
        value: 45,
        component_type: "helmet interior",
        base_defense: 2,
        component_tier: 0,
    });
    item_templates["粘合背心"] = new Armor({
        name: "Adhesive Vest",
        description: "Torso inner armor bonded together from gel and moth wings.",
        value: 60,
        component_type: "chestplate interior",
        base_defense: 4,
        component_tier: 0,
    });
    item_templates["粘合裤子"] = new Armor({
        name: "Adhesive Pants",
        description: "Leg inner armor bonded together from gel and moth wings.",
        value: 60,
        component_type: "leg armor interior",
        base_defense: 3,
        component_tier: 0,
    });
    item_templates["粘合袜子"] = new Armor({
        name: "Adhesive Socks",
        description: "Feet inner armor bonded together from gel and moth wings.",
        value: 30,
        component_type: "shoes interior",
        base_defense: 2,
        component_tier: 0,
    });
    item_templates["异兽帽子"] = new Armor({
        name: "Exotic Beast Hat",
        description: "Head inner armor made from exotic beast hide.",
        value: 1800,
        component_type: "helmet interior",
        base_defense: 10,
        component_tier: 1,
    });
    item_templates["异兽背心"] = new Armor({
        name: "Exotic Beast Vest",
        description: "Torso inner armor made from exotic beast hide.",
        value: 2400,
        component_type: "chestplate interior",
        base_defense: 16,
        component_tier: 1,
    });
    item_templates["异兽裤子"] = new Armor({
        name: "Exotic Beast Pants",
        description: "Leg inner armor made from exotic beast hide.",
        value: 2400,
        component_type: "leg armor interior",
        base_defense: 14,
        component_tier: 1,
    });
    item_templates["异兽袜子"] = new Armor({
        name: "Exotic Beast Socks",
        description: "Feet inner armor made from exotic beast hide.",
        value: 1200,
        component_type: "shoes interior",
        base_defense: 8,
        component_tier: 1,
    });item_templates["活性帽子"] = new Armor({
        name: "Vitalized Hat",
        description: "Head inner armor shaped from vitalized materials.",
        value: 3.3e6,
        component_type: "helmet interior",
        base_defense: 360,
        component_tier: 4,
        stats: {
            health_regeneration_flat: {
                flat: 30.00,
            },
        },
    });
    item_templates["活性背心"] = new Armor({
        name: "Vitalized Vest",
        description: "Torso inner armor shaped from vitalized materials.",
        value: 4.4e6,
        component_type: "chestplate interior",
        base_defense: 480,
        component_tier: 4,
        stats: {
            health_regeneration_flat: {
                flat: 40.00,
            },
        },
    });
    item_templates["活性裤子"] = new Armor({
        name: "Vitalized Pants",
        description: "Leg inner armor shaped from vitalized materials.",
        value: 4.4e6,
        component_type: "leg armor interior",
        base_defense: 480,
        component_tier: 4,
        stats: {
            health_regeneration_flat: {
                flat: 40.00,
            },
        },
    });
    item_templates["活性袜子"] = new Armor({
        name: "Vitalized Socks",
        description: "Feet inner armor shaped from vitalized materials.",
        value: 2.2e6,
        component_type: "shoes interior",
        base_defense: 240,
        component_tier: 4,
        stats: {
            health_regeneration_flat: {
                flat: 20.00,
            },
        },
    });
    item_templates["苇编帽子"] = new Armor({
        name: "Reed-Woven Hat",
        description: "Inner armor woven from azure reeds, weakening a portion of enemy attacks by conducting energy.",
        value: 105e6,
        component_type: "helmet interior",
        base_defense: 2400,
        component_tier: 6,
        stats: {
            health_regeneration_flat: {
                flat: 3000,
            },
        },
    });
    item_templates["苇编背心"] = new Armor({
        name: "Reed-Woven Vest",
        description: "Inner armor woven from azure reeds, weakening a portion of enemy attacks by conducting energy.",
        value: 140e6,
        component_type: "chestplate interior",
        base_defense: 3200,
        component_tier: 6,
        stats: {
            health_regeneration_flat: {
                flat: 4000,
            },
        },
    });
    item_templates["苇编裤子"] = new Armor({
        name: "Reed-Woven Pants",
        description: "Inner armor woven from azure reeds, weakening a portion of enemy attacks by conducting energy.",
        value: 140e6,
        component_type: "leg armor interior",
        base_defense: 3200,
        component_tier: 6,
        stats: {
            health_regeneration_flat: {
                flat: 4000,
            },
        },
    });
    item_templates["苇编袜子"] = new Armor({
        name: "Reed-Woven Socks",
        description: "Inner armor woven from azure reeds, weakening a portion of enemy attacks by conducting energy.",
        value: 70e6,
        component_type: "shoes interior",
        base_defense: 1600,
        component_tier: 6,
        stats: {
            health_regeneration_flat: {
                flat: 2000,
            },
        },
    });
    
    item_templates["高能帽子"] = new Armor({
        name: "High-Energy Hat",
        description: "Inner armor made from high-energy fabric; the internal energy can partially replenish stamina.",
        value: 360e6,
        component_type: "helmet interior",
        base_defense: 24000,
        component_tier: 8,
        stats: {
            attack_power: {
                flat: 30000,
            },
        },
    });
    item_templates["高能背心"] = new Armor({
        name: "High-Energy Vest",
        description: "Inner armor made from high-energy fabric; the internal energy can partially replenish stamina.",
        value: 480e6,
        component_type: "chestplate interior",
        base_defense: 32000,
        component_tier: 8,
        stats: {
            attack_power: {
                flat: 40000,
            },
        },
    });
    item_templates["高能裤子"] = new Armor({
        name: "High-Energy Pants",
        description: "Inner armor made from high-energy fabric; the internal energy can partially replenish stamina.",
        value: 480e6,
        component_type: "leg armor interior",
        base_defense: 32000,
        component_tier: 8,
        stats: {
            attack_power: {
                flat: 40000,
            },
        },
    });
    item_templates["高能袜子"] = new Armor({
        name: "High-Energy Socks",
        description: "Inner armor made from high-energy fabric; the internal energy can partially replenish stamina.",
        value: 240e6,
        component_type: "shoes interior",
        base_defense: 16000,
        component_tier: 8,
        stats: {
            attack_power: {
                flat: 20000,
            },
        },
    });
    item_templates["黑森帽子"] = new Armor({
        name: "Black Forest Hat",
        description: "Inner armor made from black forest fabric. Body armor won't become obsolete as quickly as weapons for now.",
        value: 480e9,
        component_type: "helmet interior",
        base_defense: 810000,
        component_tier: 11,
        stats: {attack_power: {
                flat: 240000,
            },},});
    item_templates["黑森背心"] = new Armor({
        name: "Black Forest Vest",
        description: "Inner armor made from black forest fabric. Body armor won't become obsolete as quickly as weapons for now.",
        value: 640e9,
        component_type: "chestplate interior",
        base_defense: 1080000,
        component_tier: 11,
        stats: { attack_power: {
                flat: 320000,
            },},});
    item_templates["黑森裤子"] = new Armor({
        name: "Black Forest Pants",
        description: "Inner armor made from black forest fabric. Body armor won't become obsolete as quickly as weapons for now.",
        value: 640e9,
        component_type: "leg armor interior",
        base_defense: 1080000,
        component_tier: 11,
        stats: {
            attack_power: {
                flat: 320000,
            },},});
    item_templates["黑森袜子"] = new Armor({
        name: "Black Forest Socks",
        description: "Inner armor made from black forest fabric. Body armor won't become obsolete as quickly as weapons for now.",
        value: 320e9,
        component_type: "shoes interior",
        base_defense: 540000,
        component_tier: 11,
        stats: {
            attack_power: {
                flat: 160000,
            },},});
    item_templates["极寒帽子"] = new Armor({
        name: "极寒帽子", 
        description: "极寒织料制成的内甲。附加词条也是防御：极寒织料的特性即是如此。", 
        value: 10800e9,
        component_type: "helmet interior",
        base_defense: 216e4,
        component_tier: 13,
        stats: {defense: {
                flat: 108e4,
            },},});
    item_templates["极寒背心"] = new Armor({
        name: "极寒背心", 
        description: "极寒织料制成的内甲，附加词条也是防御：极寒织料的特性即是如此。", 
        value: 14400e9,
        component_type: "chestplate interior",
        base_defense: 288e4,
        component_tier: 13,
        stats: { 
            defense: {
                flat: 144e4,
            },},});
    item_templates["极寒裤子"] = new Armor({
        name: "极寒裤子", 
        description: "极寒织料制成的内甲，附加词条也是防御：极寒织料的特性即是如此。", 
        value: 14400e9,
        component_type: "leg armor interior",
        base_defense: 288e4,
        component_tier: 13,
        stats: {
            defense: {
                flat: 144e4,
            },},});
    item_templates["极寒袜子"] = new Armor({
        name: "极寒袜子", 
        description: "极寒织料制成的内甲，附加词条也是防御：极寒织料的特性即是如此。", 
        value: 7200e9,
        component_type: "shoes interior",
        base_defense: 144e4,
        component_tier: 13,
        stats: {
            defense: {
                flat: 72e4,
            },},});
    
    item_templates["幻符帽子"] = new Armor({
        name: "幻符帽子", 
        description: "幻符织料制成的内甲。本来应该是隐身的，可惜外甲还是可以被看见……", 
        value: 1920e12,
        component_type: "helmet interior",
        base_defense: 0.96e8,
        component_tier: 16,
        stats: {agility:{
                flat: 0.36e8,
            },},});
    item_templates["幻符背心"] = new Armor({
        name: "幻符背心", 
        description: "幻符织料制成的内甲。本来应该是隐身的，可惜外甲还是可以被看见……", 
        value: 3072e12,
        component_type: "chestplate interior",
        base_defense: 1.536e8,
        component_tier: 16,
        stats: { 
            agility: {
                flat: 0.576e8,
            },},});
    item_templates["幻符裤子"] = new Armor({
        name: "幻符裤子", 
        description: "幻符织料制成的内甲。本来应该是隐身的，可惜外甲还是可以被看见……", 
        value: 2784e12,
        component_type: "leg armor interior",
        base_defense: 1.344e8,
        component_tier: 16,
        stats: {
            agility: {
                flat: 0.504e8,
            },},});
    item_templates["幻符袜子"] = new Armor({
        name: "幻符袜子", 
        description: "幻符织料制成的内甲。本来应该是隐身的，可惜外甲还是可以被看见……",  
        value: 1536e12,
        component_type: "shoes interior",
        base_defense: 0.768e8,
        component_tier: 16,
        stats: {
            defense: {
                flat: 0.288e8,
            },},});
    item_templates["铁制头盔"] = new ArmorComponent({
        name: "Iron helmet shell",
        description: "A standard iron helmet shell. Slightly reduces attack speed as it obstructs vision.",
        component_type: "helmet exterior",
        value: 187,
        component_tier: 0,
        full_armor_name: "Iron Helmet",
        defense_value: 3,
    });
    item_templates["铁制胸甲"] = new ArmorComponent({
        name: "Iron chestplate shell",
        description: "A standard iron chestplate shell.",
        component_type: "chestplate exterior",
        value: 250,
        component_tier: 0,
        full_armor_name: "Iron Chestplate",
        defense_value: 5,
    });
    item_templates["铁制腿甲"] = new ArmorComponent({
        name: "Iron leg armor shell",
        description: "A standard iron leg armor shell.",
        component_type: "leg armor exterior",
        value: 250,
        component_tier: 0,
        full_armor_name: "Iron Leg Armor",
        defense_value: 4,
    });
    item_templates["铁制战靴"] = new ArmorComponent({
        name: "Iron battle boots shell",
        description: "A standard iron battle boots shell. Slightly affects movement.",
        component_type: "shoes exterior",
        value: 125,
        component_tier: 0,
        full_armor_name: "Iron Battle Boots",
        defense_value: 2,
    });
    item_templates["紫铜头盔"] = new ArmorComponent({
        name: "Copper helmet",
        description: "A1-grade armor, lightweight yet hard.",
        component_type: "helmet exterior",
        value: 60000,
        component_tier: 2,
        full_armor_name: "Copper Helmet",
        defense_value: 45,
        stats: {
            agility: {
                flat: 45.00,
            },
        }
    });
    item_templates["紫铜胸甲"] = new ArmorComponent({
        name: "Copper chestplate",
        description: "A1-grade armor, lightweight yet hard.",
        component_type: "chestplate exterior",
        value: 80000,
        component_tier: 2,
        full_armor_name: "Copper Chestplate",
        defense_value: 60,
        stats: {
            agility: {
                flat: 60.00,
            },
        }
    });
    item_templates["紫铜腿甲"] = new ArmorComponent({
        name: "Copper leg armor",
        description: "A1-grade armor, lightweight yet hard.",
        component_type: "leg armor exterior",
        value: 80000,
        component_tier: 2,
        full_armor_name: "Copper Leg Armor",
        defense_value: 60,
        stats: {
            agility: {
                flat: 60.00,
            },
        }
    });
    item_templates["紫铜战靴"] = new ArmorComponent({
        name: "Copper battle boots",
        description: "A1-grade armor, lightweight yet hard.",
        component_type: "shoes exterior",
        value: 40000,
        component_tier: 2,
        full_armor_name: "Copper Battle Boots",
        defense_value: 30,
        stats: {
            agility: {
                flat: 30.00,
            },
        }
    });
    item_templates["地宫头盔"] = new ArmorComponent({
        name: "Dungeon helmet",
        description: "Mildly toxic, but that's irrelevant in a sea of wild beasts.",
        component_type: "helmet exterior",
        value: 270e3,
        component_tier: 3,
        full_armor_name: "Dungeon Helmet",
        defense_value: 180,
        stats: {
            health_regeneration_flat: {
                flat: -60.00,
            },
        }
    });
    item_templates["地宫胸甲"] = new ArmorComponent({
        name: "Dungeon chestplate",
        description: "Mildly toxic, but that's irrelevant in a sea of wild beasts.",
        component_type: "chestplate exterior",
        value: 360e3,
        component_tier: 3,
        full_armor_name: "Dungeon Chestplate",
        defense_value: 240,
        stats: {
            health_regeneration_flat: {
                flat: -80.00,
            },
        }
    });
    item_templates["地宫腿甲"] = new ArmorComponent({
        name: "Dungeon leg armor",
        description: "Mildly toxic, but that's irrelevant in a sea of wild beasts.",
        component_type: "leg armor exterior",
        value: 360e3,
        component_tier: 3,
        full_armor_name: "Dungeon Leg Armor",
        defense_value: 240,
        stats: {
            health_regeneration_flat: {
                flat: -80.00,
            },
        }
    });
    item_templates["地宫战靴"] = new ArmorComponent({
        name: "Dungeon battle boots",
        description: "Mildly toxic, but that's irrelevant in a sea of wild beasts.",
        component_type: "shoes exterior",
        value: 180e3,
        component_tier: 3,
        full_armor_name: "Dungeon Battle Boots",
        defense_value: 120,
        stats: {
            health_regeneration_flat: {
                flat: -40.00,
            },
        }
    });
    item_templates["充能头盔"] = new ArmorComponent({
        name: "Charged helmet",
        description: "A6-grade armor, fits the body perfectly just like the vitalized inner armor.",
        component_type: "helmet exterior",
        value: 2.1e7,
        component_tier: 5,
        full_armor_name: "Charged Helmet",
        defense_value: 900,
        stats: {
            attack_power: {
                flat: 225.00,
            },
        }
    });
    item_templates["充能胸甲"] = new ArmorComponent({
        name: "Charged chestplate",
        description: "A6-grade armor, fits the body perfectly just like the vitalized inner armor.",
        component_type: "chestplate exterior",
        value: 2.8e7,
        component_tier: 5,
        full_armor_name: "Charged Chestplate",
        defense_value: 1200,
        stats: {
            attack_power: {
                flat: 300.00,
            },
        }
    });
    item_templates["充能腿甲"] = new ArmorComponent({
        name: "Charged leg armor",
        description: "A6-grade armor, fits the body perfectly just like the vitalized inner armor.",
        component_type: "leg armor exterior",
        value: 2.8e7,
        component_tier: 5,
        full_armor_name: "Charged Leg Armor",
        defense_value: 1200,
        stats: {
            attack_power: {
                flat: 300.00,
            },
        }
    });
    item_templates["充能战靴"] = new ArmorComponent({
        name: "Charged battle boots",
        description: "A6-grade armor, fits the body perfectly just like the vitalized inner armor.",
        component_type: "shoes exterior",
        value: 1.4e7,
        component_tier: 5,
        full_armor_name: "Charged Battle Boots",
        defense_value: 600,
        stats: {
            attack_power: {
                flat: 150.00,
            },
        }
    });
    
    item_templates["脉冲头盔"] = new ArmorComponent({
        name: "Pulse helmet",
        description: "A8-grade armor, can buffer energy impacts.",
        component_type: "helmet exterior",
        value: 2.4e8,
        component_tier: 6,
        full_armor_name: "Pulse Helmet",
        defense_value: 3600,
        stats: {
            attack_mul: {
                flat: 0.01,
            },
        }
    });
    item_templates["脉冲胸甲"] = new ArmorComponent({
        name: "Pulse chestplate",
        description: "A8-grade armor, can buffer energy impacts.",
        component_type: "chestplate exterior",
        value: 3.2e8,
        component_tier: 6,
        full_armor_name: "Pulse Chestplate",
        defense_value: 4800,
        stats: {
            attack_mul: {
                flat: 0.01,
            },
        }
    });
    item_templates["脉冲腿甲"] = new ArmorComponent({
        name: "Pulse leg armor",
        description: "A8-grade armor, can buffer energy impacts.",
        component_type: "leg armor exterior",
        value: 3.2e8,
        component_tier: 6,
        full_armor_name: "Pulse Leg Armor",
        defense_value: 4800,
        stats: {
            attack_mul: {
                flat: 0.01,
            },
        }
    });
    item_templates["脉冲战靴"] = new ArmorComponent({
        name: "Pulse battle boots",
        description: "A8-grade armor, can buffer energy impacts.",
        component_type: "shoes exterior",
        value: 1.6e8,
        component_tier: 6,
        full_armor_name: "Pulse Battle Boots",
        defense_value: 2400,
        stats: {
            attack_mul: {
                flat: 0.01,
            },
        }
    });

    
    item_templates["海绿头盔"] = new ArmorComponent({
        name: "Sea Green helmet",
        description: "B1-grade armor, can buffer energy impacts.",
        component_type: "helmet exterior",
        value: 2.0e9,
        component_tier: 8,
        full_armor_name: "Sea Green Helmet",
        defense_value: 36000,
        stats: {
            attack_mul: {
                flat: 0.02,
            },
        }
    });
    item_templates["海绿胸甲"] = new ArmorComponent({
        name: "Sea Green chestplate",
        description: "B1-grade armor, can buffer energy impacts.",
        component_type: "chestplate exterior",
        value: 2.7e9,
        component_tier: 8,
        full_armor_name: "Sea Green Chestplate",
        defense_value: 48000,
        stats: {
            attack_mul: {
                flat: 0.02,
            },
        }
    });
    item_templates["海绿腿甲"] = new ArmorComponent({
        name: "Sea Green leg armor",
        description: "B1-grade armor, can buffer energy impacts.",
        component_type: "leg armor exterior",
        value: 2.7e9,
        component_tier: 8,
        full_armor_name: "Sea Green Leg Armor",
        defense_value: 48000,
        stats: {
            attack_mul: {
                flat: 0.02,
            },
        }
    });
    item_templates["海绿战靴"] = new ArmorComponent({
        name: "Sea Green battle boots",
        description: "B1-grade armor, can buffer energy impacts.",
        component_type: "shoes exterior",
        value: 1.35e9,
        component_tier: 8,
        full_armor_name: "Sea Green Battle Boots",
        defense_value: 24000,
        stats: {
            attack_mul: {
                flat: 0.02,
            },
        }
    });

    
    item_templates["秘银头盔"] = new ArmorComponent({
        name: "Mithril Helmet",
        description: "Tier B5 armor, standard issue for Yangang City guard captains.",
        component_type: "helmet exterior",
        value: 90e9,
        component_tier: 10,
        full_armor_name: "Mithril Helmet",
        defense_value: 324000,
        stats: {
            attack_mul: {
                flat: 0.03,
            },
        }
    });
    item_templates["秘银胸甲"] = new ArmorComponent({
        name: "Mithril Chestplate",
        description: "Tier B5 armor, standard issue for Yangang City guard captains.",
        component_type: "chestplate exterior",
        value: 120e9,
        component_tier: 10,
        full_armor_name: "Mithril Chestplate",
        defense_value: 432000,
        stats: {
            attack_mul: {
                flat: 0.03,
            },
        }
    });
    item_templates["秘银腿甲"] = new ArmorComponent({
        name: "Mithril Leg Armor",
        description: "Tier B5 armor, standard issue for Yangang City guard captains.",
        component_type: "leg armor exterior",
        value: 120e9,
        component_tier: 10,
        full_armor_name: "Mithril Leg Armor",
        defense_value: 432000,
        stats: {
            attack_mul: {
                flat: 0.03,
            },
        }
    });
    item_templates["秘银战靴"] = new ArmorComponent({
        name: "Mithril Sabatons",
        description: "Tier B5 armor, standard issue for Yangang City guard captains.",
        component_type: "shoes exterior",
        value: 60e9,
        component_tier: 10,
        full_armor_name: "Mithril Sabatons",
        defense_value: 216000,
        stats: {
            attack_mul: {
                flat: 0.03,
            },
        }
    });

    
    item_templates["冰髓头盔"] = new ArmorComponent({
        name: "Ice Marrow Helmet",
        description: "Truly freezing cold. But the Dark Forest Fabric and Fire Spirit Phantom Sea will protect Neko!",
        component_type: "helmet exterior",
        value: 2.7e12,
        component_tier: 12,
        full_armor_name: "Ice Marrow Helmet",
        defense_value: 162e4,
        stats: {
            attack_mul: {
                flat: 0.04,
            },
        }
    });
    item_templates["冰髓胸甲"] = new ArmorComponent({
        name: "Ice Marrow Chestplate",
        description: "Truly freezing cold. But the Dark Forest Fabric and Fire Spirit Phantom Sea will protect Neko!",
        component_type: "chestplate exterior",
        value: 3.6e12,
        component_tier: 12,
        full_armor_name: "Ice Marrow Chestplate",
        defense_value: 216e4,
        stats: {
            attack_mul: {
                flat: 0.04,
            },
        }
    });
    item_templates["冰髓腿甲"] = new ArmorComponent({
        name: "Ice Marrow Leg Armor",
        description: "Truly freezing cold. But the Dark Forest Fabric and Fire Spirit Phantom Sea will protect Neko!",
        component_type: "leg armor exterior",
        value: 3.6e12,
        component_tier: 12,
        full_armor_name: "Ice Marrow Leg Armor",
        defense_value: 216e4,
        stats: {
            attack_mul: {
                flat: 0.04,
            },
        }
    });
    item_templates["冰髓战靴"] = new ArmorComponent({
        name: "Ice Marrow Sabatons",
        description: "Truly freezing cold. But the Dark Forest Fabric and Fire Spirit Phantom Sea will protect Neko!",
        component_type: "shoes exterior",
        value: 1.8e12,
        component_tier: 12,
        full_armor_name: "Ice Marrow Sabatons",
        defense_value: 108e4,
        stats: {
            attack_mul: {
                flat: 0.04,
            },
        }
    });
    
    item_templates["水素头盔"] = new ArmorComponent({
        name: "水素头盔",
        description: "它本身是几乎透明的……外甲不能单独穿戴！想什么呢！",
        component_type: "helmet exterior",
        value: 41.4e12,
        component_tier: 14,
        full_armor_name: "水素头盔",
        defense_value: 1728e4,
        stats: {
            attack_mul: {
                flat: 0.05,
            },
        }
    });
    item_templates["水素胸甲"] = new ArmorComponent({
        name: "水素胸甲",
        description: "它本身是几乎透明的……外甲不能单独穿戴！想什么呢！",
        component_type: "chestplate exterior",
        value: 55.2e12,
        component_tier: 14,
        full_armor_name: "水素胸甲",
        defense_value: 2304e4,
        stats: {
            attack_mul: {
                flat: 0.05,
            },
        }
    });
    item_templates["水素腿甲"] = new ArmorComponent({
        name: "水素腿甲",
        description: "它本身是几乎透明的……外甲不能单独穿戴！想什么呢！",
        component_type: "leg armor exterior",
        value: 55.2e12,
        component_tier: 14,
        full_armor_name: "水素腿甲",
        defense_value: 2304e4,
        stats: {
            attack_mul: {
                flat: 0.05,
            },
        }
    });
    item_templates["水素战靴"] = new ArmorComponent({
        name: "水素战靴",
        description: "它本身是几乎透明的……外甲不能单独穿戴！想什么呢！",
        component_type: "shoes exterior",
        value: 27.6e12,
        component_tier: 14,
        full_armor_name: "水素战靴",
        defense_value: 1152e4,
        stats: {
            attack_mul: {
                flat: 0.05,
            },
        }
    });
    //价格基本单位:405e12,防御基本单位:0.216e8
    item_templates["魂晶头盔"] = new ArmorComponent({
        name: "魂晶头盔",
        description: "从魂晶开始，因为需要更厚的装甲来发挥材料的潜力，它们的消耗翻倍了！(经验也翻倍了)",
        component_type: "helmet exterior",
        value: 2025e12,
        component_tier: 16,
        full_armor_name: "魂晶头盔",
        defense_value: 1.08e8,
        stats: {
            attack_mul: {
                flat: 0.06,
            },
        }
    });
    item_templates["魂晶胸甲"] = new ArmorComponent({
        name: "魂晶胸甲",
        description: "从魂晶开始，因为需要更厚的装甲来发挥材料的潜力，它们的消耗翻倍了！(经验也翻倍了)",
        component_type: "chestplate exterior",
        value: 3240e12,
        component_tier: 16,
        full_armor_name: "魂晶胸甲",
        defense_value: 1.728e8,
        stats: {
            attack_mul: {
                flat: 0.06,
            },
        }
    });
    item_templates["魂晶腿甲"] = new ArmorComponent({
        name: "魂晶腿甲",
        description: "从魂晶开始，因为需要更厚的装甲来发挥材料的潜力，它们的消耗翻倍了！(经验也翻倍了)",
        component_type: "leg armor exterior",
        value: 2835e12,
        component_tier: 16,
        full_armor_name: "魂晶腿甲",
        defense_value: 1.512e8,
        stats: {
            attack_mul: {
                flat: 0.06,
            },
        }
    });
    item_templates["魂晶战靴"] = new ArmorComponent({
        name: "魂晶战靴",
        description: "从魂晶开始，因为需要更厚的装甲来发挥材料的潜力，它们的消耗翻倍了！(经验也翻倍了)",
        component_type: "shoes exterior",
        value: 1620e12,
        component_tier: 16,
        full_armor_name: "魂晶战靴",
        defense_value: 0.864e8,
        stats: {
            attack_mul: {
                flat: 0.06,
            },
        }
    });




})();
//盔甲

//成品金属
(function(){
    item_templates["铁锭"] = new Material({
        id: "铁锭",
        name: "Iron Ingot",
        description: "An iron ingot smelted from metal scraps. Can be used to craft sword blades and armor.",
        value: 30,
        material_type: "metal",
        image: "image/item/iron_ingot.png",
    });
    item_templates["精钢锭"] = new Material({
        id: "精钢锭",
        name: "Steel Ingot",
        description: "An iron alloy mixed with other metals. Hard but brittle, only suitable for sword blades.",
        value: 400,
        material_type: "metal",
        image: "image/item/steel_ingot.png",
    });
    item_templates["紫铜锭"] = new Material({
        id: "紫铜锭",
        name: "Purple Copper Ingot",
        description: "A barely tier-qualifying A1 metal with uniform properties.",
        value: 16666,
        material_type: "metal",
        image: "image/item/purplecopper_ingot.png",
    });
    
    item_templates["宝石锭"] = new Material({
        id: "宝石锭",
        name: "Gem Ingot",
        description: "An ingot forged from ability gems. This won't be subject to the soft cap...",
        value: 120e3,
        material_type: "metal",
        image: "image/item/gem_ingot.png",
    });
    item_templates["地宫金属锭"] = new Material({
        id: "地宫金属锭",
        name: "Dungeon Metal Ingot",
        description: "An A2-grade alloy. The mixed dungeon materials make armor crafted from it toxic, leading to poor sales. Furthermore, due to rapid market saturation, its market price is less than half the cost of its materials.",
        value: 200e3,
        material_type: "metal",
        image: "image/item/TPmetal_ingot.png",
    });
    item_templates["暗影钢锭"] = new Material({
        id: "暗影钢锭",
        name: "Shadow Steel Ingot",
        description: "A metal reforged from black blade coins and souls. Strength reaches A4 — useless items can't become currency on the Xuelo Continent.",
        value: 1.3e6,
        material_type: "metal",
        image: "image/item/darksteel_ingot.png",
    });

    
    item_templates["活化柳木"] = new Material({
        id: "活化柳木",
        name: "Activated Willow",
        description: "Willow wood injected with active components from wild beasts, with greatly enhanced energy conductivity.",
        value: 2.333e6,
        material_type: "wood",
        image: "image/item/active_salix.png",
    });
    item_templates["充能合金锭"] = new Material({
        id: "充能合金锭",
        name: "Charged Alloy Ingot",
        description: "An A6-grade alloy that can be smelted by various means. Hard to find better metal along the Qingye River.",
        value: 6.666e6,
        material_type: "metal",
        image: "image/item/chargealloy_ingot.png",
    });
    item_templates["脉冲合金锭"] = new Material({
        id: "脉冲合金锭",
        name: "Pulse Alloy Ingot",
        description: "An A8-grade alloy composed of pulse alloy and light blue crystal powder. Possesses energy-storing properties.",
        value: 77.777e6,
        material_type: "metal",
        image: "image/item/pulsealloy_ingot.png",
    });
    
    item_templates["缠绕水晶"] = new Material({
        id: "缠绕水晶",
        name: "Binding Crystal",
        description: "A sword handle component modeled after [Binding Bones].",
        value: 111e6,
        material_type: "metal",
        image: "image/item/reedy_transparent.png",
    });
    
    item_templates["蓝金锭"] = new Material({
        id: "蓝金锭",
        name: "Blue Gold Ingot",
        description: "An A9-grade metal abundant in the Barrier Lake. Due to bioaccumulation, wild beast flesh also contains large quantities of this metal.",
        value: 333.333e6,
        material_type: "metal",
        image: "image/item/bluegold_ingot.png",
    });
    item_templates["海绿锭"] = new Material({
        id: "海绿锭",
        name: "Sea Green Ingot",
        description: "A B1-grade alloy forged from green blade coins. Perhaps because the powerful occasionally use it, it is mostly non-toxic and can be used for armor.",
        value: 800e6,
        material_type: "metal",
        image: "image/item/seagreen_ingot.png",
    });
    
    item_templates["固态凝胶"] = new Material({
        id: "固态凝胶",
        name: "Solid Gel",
        description: "A stable waxy substance created when lightning strikes high-energy gel. More uniform conductivity than Binding Crystal, much better to the touch.",
        value: 800e6,
        material_type: "metal",
        image: "image/item/solid_rubber.png",
    });
    
    item_templates["红钢锭"] = new Material({
        id: "红钢锭",
        name: "Red Steel Ingot",
        description: "Metal restored and strengthened from heavy armor remnants by red-black marks. Strength approximately B2-B3.",
        value: 1800e6,
        material_type: "metal",
        image: "image/item/redsteel_ingot.png",
    });

    
    item_templates["秘银锭"] = new Material({
        id: "秘银锭",
        name: "Mithril Ingot",
        description: "An alloy distributed as rewards by the City Lord's Mansion. Seems to be rich in Pt/Fe/Cs, with some mana energy for harmonization.",
        value: 54e9,
        material_type: "metal",
        image: "image/item/mythril_ingot.png",
    });
    item_templates["旋律合金锭"] = new Material({
        id: "旋律合金锭",
        name: "Melody Alloy Ingot",
        description: "An alloy refined from beast horns and fluorescent essence. B6-grade strength, but not suitable for armor... otherwise it would glow in the dark like a homing beacon.",
        value: 648e9,
        material_type: "metal",
        image: "image/item/melodyalloy_ingot.png",
    });
    item_templates["万载冰髓锭"] = new Material({
        id: "万载冰髓锭",
        name: "Eternal Ice Marrow Ingot",
        description: "A phase-change product of [Arctic Superfluid]. Note: workbench recipe efficiency is extremely low, recommend using [Extreme Cold Phase Engine] for production.",
        value: 1.92e12,
        material_type: "metal",
        image: "image/item/icesteel_ingot.png",
    });
    item_templates["光暗枝丫"] = new Material({
        id: "光暗枝丫",
        name: "Light-Dark Branch",
        description: "A black-and-white branch infused with fluorescent essence. More compatible with spiritual force and smoother to the touch.",
        value: 512e9,
        material_type: "metal",
        image: "image/item/light_twig.png",
    });
    item_templates["黑森织料"] = new Material({
        id: "黑森织料",
        name: "Dark Forest Fabric",
        description: "Improved leaf material. Doesn't look like leaves anymore... otherwise Neko would look like a wild person!",
        value: 704e9,
        material_type: "metal",
        image: "image/item/mixed_comp04.png",
    });
    item_templates["峰"] = new Material({
        id: "峰",
        name: "Peak",
        description: "<span class='realm_cloudy'>Ascendant Rank: Peak</span><br><b><span style='color:#00fa9a'>Hundred-Line Style</span> <span style='color:#edec9f'>Golden Void Law</span><br><span style='color:lime'>4.489Qi</span> <span style='color:red'>167.24Q</span> <span style='color:blue'>86.49Q</span></b> <br><br>Priceless... but only if you survive to claim it.",
        value: 1.21e24,
        material_type: "metal",
        image: "image/item/bigbrother.png",
    });
    
    item_templates["结界湖之心·材"] = new Material({
        id: "结界湖之心·材",
        name: "Barrier Lake Heart · Material",
        description: "Can no longer be worn, just a temporary solution for crafting [Spaceship Heart].",
        value: 2.4e9,
        material_type: "metal",
        image: "image/item/barrierlake_heart.png",
    });
    item_templates["飞船之心·材"] = new Material({
        id: "飞船之心·材",
        name: "飞船之心·材", 
        description: "无法继续被佩戴，只是用于合成【冰原之心】的临时材料。", 
        value: 4.8e12,
        material_type: "metal",
        image: "image/item/spaceship_heart.png",
    });
    item_templates["冰原之心·材"] = new Material({
        id: "冰原之心·材",
        name: "冰原之心·材", 
        description: "无法继续被佩戴，只是用于合成【幻境之心】的临时材料。", 
        value: 160e12,
        material_type: "metal",
        image: "image/item/iceland_heart.png",
    });
    item_templates["晶化合金锭"] = new Material({
        id: "晶化合金锭",
        name: "晶化合金锭", 
        description: "【万载冰髓】与冰宫中的镶嵌宝石结合成的合金。表面十分锋利，因此不适合制作盔甲。强度为B7+级。", 
        value: 6.61e12,
        material_type: "metal",
        image: "image/item/icealloy_ingot.png",
    });
    item_templates["极寒织料"] = new Material({
        id: "极寒织料",
        name: "极寒织料", 
        description: "将万载冰髓打碎，研磨，注入能量回路中……冰元素固然寒冷刺骨，但广谱能量抵消的特性仍然使它值得作为材料。", 
        value: 7.21e12,
        material_type: "metal",
        image: "image/item/mixed_comp05.png",
    });
    item_templates["冰块"] = new Material({
        id: "冰块",
        name: "冰块", 
        description: "非常普通的冰块，在地宫都嫌便宜。完全就是建筑废料……", 
        value: 233,
        material_type: "metal",
        image: "image/item/normal_ice.png",
    });
    item_templates["水素合金锭"] = new Material({
        id: "水素合金锭",
        name: "水素合金锭", 
        description: "水素晶体注入冰原超流体得到的合金。比起冰元素，水元素与它的相性更好。它的强度为B9-级。", 
        value: 27.6e12,
        material_type: "metal",
        image: "image/item/aquaalloy_ingot.png",
    });
    item_templates["虹彩杖芯"] = new Material({
        id: "虹彩杖芯",
        name: "虹彩杖芯", 
        description: "悬浮着的光环杖芯本就是不错的念力兵器材料，而虹彩凝胶的多种元素更使得兵器可以更加灵活。", 
        value: 16.8e12,
        material_type: "metal",
        image: "image/item/rainbow_ending.png",
    });
    item_templates["破空紫蕨"] = new OtherItem({
        name: "破空紫蕨", 
        description: "引力异常的功率可不止于让绝音蕨自动漂浮！它可以打乱战斗区域的光线，让敌人手忙脚乱！",
        value: 768e12,
        image: "image/item/floating_fern.png",
    });
    item_templates["宝石母锭"] = new Material({
        id: "宝石母锭",
        name: "宝石母锭", 
        description: "吞噬星空的设定中，矿脉中会含有100ppm的【精】和10ppb的【母】，分别+1tier和+2tier。<br>因此，宝石锭是A1级，宝石母锭就是C1级了！", 
        value: 133e12,
        material_type: "metal",
        image: "image/item/gemM_ingot.png",
    });
    item_templates["魂晶锭"] = new Material({
        id: "魂晶锭",
        name: "魂晶锭", 
        description: "吸收魂魄的紫晶锭。粗制器灵，但是更强了——境界越高的修者，死后的魂魄残留越多的灵性。", 
        value: 672e12,
        material_type: "metal",
        image: "image/item/violet_ingot.png",
    });
})();

//矿石
(function(){
    item_templates["紫铜矿"] = new OtherItem({
        id: "紫铜矿",
        name: "Purple Copper Ore",
        description: "Common A1-grade metal ore, can be fully refined using venom.",
        value: 2222,
        image: "image/item/purplecopper_ore.png",
    });
    item_templates["煤炭"] = new OtherItem({
        id: "煤炭",
        name: "Coal",
        description: "Real coal! Having absorbed some energy, it can provide a much higher temperature than magic crystal shards.",
        value: 999,
        image: "image/item/coal.png",
    });
    item_templates["百年柳木"] = new OtherItem({
        id: "百年柳木",
        name: "Century Willow Wood",
        description: "Common large tree timber from wild beast forests. Excellent material quality, suitable for conducting power.",
        value: 320000,
        image: "image/item/salix_wood.png",
    });
    
    item_templates["湖鲤鱼"] = new OtherItem({
        id: "湖鲤鱼",
        name: "Lake Carp",
        description: "The energy of the Barrier Lake cannot change the carp's naturally sluggish nature. As a tier 6 Earth-grade fish, even a Tidal Rank cultivator has a chance to reel it in.",
        value: 28e6,
        image: "image/item/lake_carp.png",
    });
    item_templates["青花鱼"] = new UsableItem({
        id: "青花鱼",
        name: "Blue Flower Fish",
        description: "Another type of Barrier Lake fish. Its gluttonous nature makes it relatively agile, requiring more effort to catch at the same cultivation level.",
        value: 84e6,
        effects: [{effect: "Satiated VI", duration: 90}],
        realmcap:18,
        image: "image/item/cyan_fish.png",
    });
    item_templates["冰柱鱼"] = new UsableItem({
        id: "冰柱鱼",
        name: "Ice Pillar Fish",
        description: "The king-like existence among Barrier Lake fish. Small but extremely difficult to handle, legend has it there are records of Sky-rank Ice Pillar Fish leaping from the water.",
        value: 216e6,
        effects: [{effect: "Satiated VI", duration: 540}],
        realmcap:20,
        image: "image/item/ice_fish.png",
    });
    
    item_templates["血莲鱼"] = new UsableItem({
        id: "血莲鱼",
        name: "血莲鱼", 
        description: "青花鱼的究极形态——天空级七阶。比起只会沉浮的鱼，学会了在二维平面移动……", 
        value: 192e12,
        effects: [{effect: "饱食 IX", duration: 45}],
        realmcap:31,
        image: "image/item/red_fish.png",
    });
    item_templates["冰柱鱼王"] = new UsableItem({
        id: "冰柱鱼王",
        name: "冰柱鱼王", 
        description: "传说有误！结界能量太充沛了，冰柱鱼王突破到天空级巅峰 +了！这里最强的不会有3+境吧……虽然没资源突破不了云霄级就是了啦。", 
        value: 864e12,
        effects: [{effect: "饱食 IX", duration: 360}],
        realmcap:34,
        image: "image/item/ice_fish_king.png",
    });
})();

//特殊
(function(){
    item_templates["地图-藏宝地"] = new OtherItem({
        id: "地图-藏宝地",
        name: "Map - Treasure Site",
        description: "A map of a newly discovered treasure site. (Neko has memorized the location, safe to sell)",
        value: 999,
        image: "image/item/MT15.png",
    });
    
    item_templates["牵制-从入门到入土"] = new OtherItem({
        id: "牵制-从入门到入土",
        name: "Suppression - From Beginner to Buried",
        description: "Completely blacked out, with only a blood letter in the common language of the Xuelo Continent: 'Suppression ruins a life, weakness impoverishes three generations.'",
        value: 11037,
        image: "image/item/BurnBlood.png",
    });

    
    item_templates["微花残片"] = new OtherItem({
        name: "Micro-Flower Fragment",
        description: "It's okay... Father can't enter the secret realm. He definitely doesn't know I secretly broke the halo! (When held, 2-3 and 2-4 BOSS battle halo -8%/piece, no less than 0%)",
        value: 99e6,
        image: "image/item/MF_fragment.png",
    });
    
    item_templates["符文工作台套件"] = new UsableItem({
        id: "符文工作台套件",
        name: "Rune Workbench Kit",
        description: "A workbench carved from massive quantities of sea green ingots and ruin runes. [Use] this item to unlock the T8 workbench! (By the way, crafting recipes require terrifyingly large amounts of materials, so buying directly is recommended)",
        value: 500e9,
        spec:"T8-table",
        image: "image/item/rune_workingtable.png",
    });
    item_templates["极寒相变引擎"] = new UsableItem({
        id: "极寒相变引擎",
        name: "极寒相变引擎", 
        description: "使用多冲程压缩-膨胀来制冷的套件，附带隔热装置。<br>可用于生产万载冰髓与玄冰果实·觉醒。<br>具体使用方式详见左下角问号菜单！", 
        value: 96e12,
        spec:"freezing_engine",
        image: "image/item/freezing_engine.png",
    });
    item_templates["冰宫商人"] = new UsableItem({
        id: "冰宫商人",
        name: "冰宫商人", 
        description: "冰宫的女巫们已经把他的身上给搜干净了。当奴隶还能卖一点钱，但放走了等他对接货源收益更高！<br>PS:每血洛日0点刷新商品", 
        value: 5.21e12,
        spec:"saved_trader",
        image: "image/item/icepalace_trader.png",
    });
    
    item_templates["牵制-从入门到精通"] = new UsableItem({
        id: "牵制-从入门到精通",
        name: "牵制-从入门到精通", 
        description: "传承水晶的知识补全了被涂黑的书！虽然自己不应该用，但可以套路心魔……<br>实际效果:【压制·伪】判定 +1%牵制比重(上限100%/加权几何平均)<br>", 
        value: 168e12,
        spec:"HeartDemon_nerf",
        image: "image/item/BurnBloodPlus.png",
    });
})();

//消耗品
    (function(){
    item_templates["微尘·凶兽肉排"] = new UsableItem({
        name: "Dust·Beast Steak",
        description: "Cooked young wild beast steak. Restores 40 HP per second for 60 seconds when consumed.",//血药模版
        value: 20,
        realmcap:5,
        effects: [{effect: "Satiated", duration: 60}],
        image: "image/item/O1_cooked_meat.png",
    });
    item_templates["万物·凶兽肉排"] = new UsableItem({
        name: "Myriad·Beast Steak",
        description: "The color is strange but it's truly edible! Restores 80 HP per second for 60 seconds when consumed.",
        value: 240,
        realmcap:7,
        effects: [{effect: "Satiated II", duration: 60}],
        image: "image/item/O5_cooked_meat.png",
    });
    item_templates["潮汐·凶兽肉排"] = new UsableItem({
        name: "Tidal·Beast Steak",
        description: "Tidal-rank wild beast meat. Not only restores HP, but also slightly increases comprehension!",
        value: 6000,
        effects: [{effect: "Satiated III", duration: 60}],
        realmcap:8,
        image: "image/item/O8_cooked_meat.png",
    });
    item_templates["地宫恢复药水"] = new UsableItem({
        name: "Dungeon Recovery Potion",
        description: "Not particularly tasty. Sadly, dungeon monster meat tastes even worse...",
        value: 210e3,
        effects: [{effect: "Recovery A1", duration: 60}],
        realmcap:11,
        image: "image/item/A1_medicine.png",
    });
    item_templates["地宫狂暴药水"] = new UsableItem({
        name: "Dungeon Frenzy Potion",
        description: "Can greatly enhance your strength for a short time. Well, there are just a few side effects...",
        value: 420e3,
        realmcap:11,
        effects: [{effect: "Enhance A1", duration: 30},{effect: "Weakness", duration: 90}],
        image: "image/item/A1_booster.png",
    });
    item_templates["地宫·荒兽肉排"] = new UsableItem({
        name: "Dungeon·Wild Beast Steak",
        description: "Earth-rank wild beast meat. Thank goodness, there's finally something edible in the deep dungeon.",
        value: 500e3,
        effects: [{effect: "Satiated IV", duration: 90}],
        realmcap:11,
        image: "image/item/A2_cooked_meat.png",
    });
    item_templates["森林·荒兽肉排"] = new UsableItem({
        name: "Forest·Wild Beast Steak",
        description: "Mid-tier Earth-rank wild beast meat. Outside the dungeon, the wild beasts taste much better.",
        value: 1.8e6,
        effects: [{effect: "Satiated V", duration: 60}],
        realmcap:14,
        image: "image/item/A4_cooked_meat.png",
    });//
    
    item_templates["A9·魔攻药剂"] = new UsableItem({
        name: "A9·Magic Attack Potion",
        description: "Provides 10% magic attack, at the cost of -10% normal attack multiplier.",
        value: 240e6,
        realmcap:18,
        effects: [{effect: "Magic Attack A9", duration: 120}],
        image: "image/item/A9_magic.png",
    });
    item_templates["A9·牵制药剂"] = new UsableItem({
        name: "A9·Suppression Potion",
        description: "Provides 60% effective suppression, capped at 3x damage amplification.",
        value: 240e6,
        realmcap:18,
        effects: [{effect: "Suppression A9", duration: 120}],
        image: "image/item/A9_contain.png",
    });
    item_templates["A9·回风药剂"] = new UsableItem({
        name: "A9·Whirlwind Potion",
        description: "Allows 0.8 and 1.2 unequal dual strikes, at the cost of 1% bleed effect.",
        value: 240e6,
        realmcap:18,
        effects: [{effect: "Whirlwind A9", duration: 120}],
        image: "image/item/A9_rewind.png",
    });
    item_templates["A9·坚固药剂"] = new UsableItem({
        name: "A9·Fortify Potion",
        description: "Limits damage taken per round to 5% of max HP, at the cost of 1% bleed effect.",
        value: 240e6,
        realmcap:18,
        effects: [{effect: "Fortify A9", duration: 120}],
        image: "image/item/A9_hard.png",
    });
    
    item_templates["废墟恢复药水"] = new UsableItem({
        name: "Ruin Recovery Potion",
        description: "A potion commonly kept by Lanling City explorers. Seemingly brewed in a cauldron.",
        value: 180e6,
        effects: [{effect: "Recovery A8", duration: 60}],
        realmcap:21,
        image: "image/item/A8_medicine.png",
    });
    item_templates["废墟狂暴药水"] = new UsableItem({
        name: "Ruin Frenzy Potion",
        description: "A potion commonly kept by Lanling City explorers. Why use a cauldron? Because high-energy gel would destroy fragile alchemy equipment.",
        value: 360e6,
        realmcap:21,
        effects: [{effect: "Enhance A8", duration: 30},{effect: "Weakness", duration: 90}],
        image: "image/item/A8_booster.png",
    });

    
    item_templates["战场·荒兽肉排"] = new UsableItem({
        name: "Battlefield·Wild Beast Steak",
        description: "Late-tier Earth-rank wild beast meat. Compared to fish, its greater advantage is mass production potential...",
        value: 540e6,
        effects: [{effect: "Satiated VII", duration: 60}],
        realmcap:21,
        image: "image/item/A8_cooked_meat.png",
    });//

    
    item_templates["超浓缩·坚固药剂"] = new UsableItem({
        name: "Ultra-Concentrated·Fortify Potion",
        description: "After intense purification, a potion effective for below B5 tier. The duration is greatly reduced though.",
        value: 120e9,
        realmcap:23,
        effects: [{effect: "Fortify A9", duration: 30}],
        image: "image/item/B3_hard.png",
    });

    item_templates["血气升腾药剂"] = new UsableItem({
        name: "Rising Vitality Potion",
        description: "A potion that temporarily suppresses [Sublimation] by releasing vitality outward. To prevent fatal overdose, it also includes a vitality recovery function.",
        value: 3e9,
        realmcap:24,
        effects: [{effect: "Recovery B1", duration: 90}],
        image: "image/item/B1_life_medicine.png",
    });

    item_templates["能量冰沙"] = new UsableItem({
        name: "Energy Ice Smoothie",
        description: "Conceals a portion of life, thereby increasing life [capacity].",
        value: 3e12,
        realmcap:27,
        effects: [{effect: "Recovery B4", duration: 90}],
        image: "image/item/B4_medicine.png",
    });
    
    item_templates["沼泽·荒兽肉排"] = new UsableItem({
        name: "Swamp·Wild Beast Steak",
        description: "Early-tier Sky-rank wild beast meat. Unlike the previous meats, this one is deep-fried!",
        value: 160e9,
        effects: [{effect: "Satiated VIII", duration: 90}],
        realmcap:24,
        image: "image/item/B3_cooked_meat.png",
    });//


    
    item_templates["B9·反戈药剂"] = new UsableItem({
        name: "B9·Retaliation Potion",
        description: "Reflects 50% of damage back to the enemy, ignoring defense! At the cost of -30% normal attack multiplier, and enemies killed by reflected damage yield no experience. (Still drop loot)",
        value: 8.4e12,
        realmcap:27,
        effects: [{effect: "Reversal B9", duration: 120}],
        image: "image/item/B9_reflect.png",
    });
    item_templates["B9·灵闪药剂"] = new UsableItem({
        name: "B9·Spirit Flash Potion",
        description: "If the enemy's attack is less than twice the character's, damage taken is reduced by half of (character's defense / enemy's defense). Otherwise, it increases by twice that ratio. This effect cannot reduce damage below 0.",
        value: 8.4e12,
        realmcap:27,
        effects: [{effect: "Spirit Flash B9", duration: 120}],
        image: "image/item/B9_spiritdodge.png",
    });
    item_templates["B9·散华药剂"] = new UsableItem({
        name: "B9·Sublimation Potion",
        description: "The enemy's attack is weakened by (character HP / enemy HP)^0.5 × 10 (in %), but causes 1% HP drain. This effect cannot reduce enemy base attack below 0.",
        value: 8.4e12,
        realmcap:27,
        effects: [{effect: "Scatter B9", duration: 120}],
        image: "image/item/B9_sublimhealth.png",
    });
    item_templates["B9·异界药剂"] = new UsableItem({
        name: "B9·Other Realm Potion",
        description: "Base attack multiplier becomes 20%, but increases by 40%, 60%... with each hit. Choose this for long-term battles!",
        value: 8.4e12,
        realmcap:27,
        effects: [{effect: "Void Gate B9", duration: 120}],
        image: "image/item/B9_portal.png",
    });
    item_templates["B9·??药剂"] = new UsableItem({
        name: "B9·??药剂", 
        description: "使用后随机获取5瓶B9级炼金药剂。", 
        value: 50e12,
        realmcap:27,
        spec:"random-potion",
        image: "image/item/B9_unknown.png",
    });
    
    item_templates["幻境·恢复精华"] = new UsableItem({
        name: "幻境·恢复精华", 
        description: "被击碎的传承水晶·绿。是稀有的百分比恢复——别想囤几十万个！云霄级突破清buff的！", 
        value: 100e12,
        effects: [{effect: "恢复 B8", duration: 60}],
        realmcap:27,
        image: "image/item/B8_medicine.png",
    });
    item_templates["幻境·狂暴精华"] = new UsableItem({
        name: "幻境·狂暴精华", 
        description: "被击碎的传承水晶·蓝。绝对出乎意料的是，这个没有debuff！结界的一百纪元里，配方已经变得完美了呢。", 
        value: 120e12,
        effects: [{effect: "强化 B8", duration: 60}],
        realmcap:27,
        image: "image/item/B8_booster.png",
    });

})();
//炼金
(function(){
    item_templates["粘合织料"] = new OtherItem({
        name: "Binding Fabric",
        description: "A combination of gel-coated moth wings, suitable for close contact with skin.",
        value: 12,
        image: "image/item/mixed_comp01.png",
    });
    item_templates["润灵铜骨"] = new OtherItem({
        name: "Aura-Infused Copper Bones",
        description: "The product of fusing copper bones and sky silk with spirit fluid.",
        value: 10000,
        image: "image/item/aura_bone.png",
    });
    item_templates["活性织料"] = new OtherItem({
        name: "Active Fabric",
        description: "A biologically active mixture resistant to extreme environments. Similar substances were once used to make the [Black God] armor set.",
        value: 1.10e6,
        image: "image/item/mixed_comp02.png",
    });
    item_templates["湛蓝芦苇"] = new OtherItem({
        name: "Azure Reed",
        description: "Reed fibers from the secret realm, dispersed and filled with water-soluble essence. Its ability to conduct energy and absorb attacks has greatly improved.",
        value: 30e6,
        image: "image/item/blue_reed.png",
    });
    item_templates["高能织料"] = new OtherItem({
        name: "High-Energy Fabric",
        description: "A viscous material containing large amounts of unreleased energy, capable of absorbing some incoming attacks.",
        value: 240e6,
        image: "image/item/mixed_comp03.png",
    });
    
    item_templates["幻符织料"] = new OtherItem({
        name: "幻符织料", 
        description: "幻境符文/绝音蕨的两层吸收使得它几乎完成了光学隐身。什么叫外甲可以被看见？不要在意那些细节！",
        value: 666e12,
        image: "image/item/mixed_comp06.png",
    });
    item_templates["绝音蕨"] = new OtherItem({
        name: "绝音蕨", 
        description: "本身价值不算高昂，但却是第三幕最佳内甲的必备材料！", 
        value: 24811e9,
        image: "image/item/slient_fern.png",
    });
    item_templates["噬芒兰"] = new OtherItem({
        name: "噬芒兰", 
        description: "它暗到似乎可以吸收周围的光。幻境阵法中多余的暗元素全数汇入了四重幻境，它就是受益者。", 
        value: 4.5e15,
        image: "image/item/light_absorb_flower.png",
    });

})();

//宝石
(function(){
    item_templates["初始黄宝石"] = new UsableItem({
        name: "Basic Yellow Gem",
        description: "A crystal that enhances power. When used, randomly adds 1 ATK/DEF/AGI or 50 HP.",
        value: 1,
        image: "image/item/gem11_1.png",
        effects: [],
        gem_value: 1,
    });
    item_templates["初始蓝宝石"] = new UsableItem({
        name: "Basic Blue Gem",
        description: "A crystal that enhances power. When used, randomly adds 2 ATK/DEF/AGI or 100 HP.",
        value: 2,
        image: "image/item/gem12_2.png",
        effects: [],
        gem_value: 2,
    });
    item_templates["初始红宝石"] = new UsableItem({
        name: "Basic Red Gem",
        description: "A crystal that enhances power. When used, randomly adds 5 ATK/DEF/AGI or 250 HP.",
        value: 5,
        image: "image/item/gem13_5.png",
        effects: [],
        gem_value: 5,
    });
    item_templates["初始绿宝石"] = new UsableItem({
        name: "Basic Green Gem",
        description: "A crystal that enhances power. When used, randomly adds 10 ATK/DEF/AGI or 500 HP.",
        value: 10,
        image: "image/item/gem14_10.png",
        effects: [],
        gem_value: 10,
    });
    item_templates["高级黄宝石"] = new UsableItem({
        name: "Advanced Yellow Gem",
        description: "A higher-tier crystal. When used, randomly adds 20 ATK/DEF/AGI or 1,000 HP.",
        value: 20,
        image: "image/item/gem21_20.png",
        effects: [],
        gem_value: 20,
    });
    item_templates["高级蓝宝石"] = new UsableItem({
        name: "Advanced Blue Gem",
        description: "A higher-tier crystal. When used, randomly adds 50 ATK/DEF/AGI or 2,500 HP.",
        value: 50,
        image: "image/item/gem22_50.png",
        effects: [],
        gem_value: 50,
    });
    item_templates["高级红宝石"] = new UsableItem({
        name: "Advanced Red Gem",
        description: "A higher-tier crystal. When used, randomly adds 100 ATK/DEF/AGI or 5,000 HP.",
        value: 100,
        image: "image/item/gem23_100.png",
        effects: [],
        gem_value: 100,
    });
    item_templates["高级绿宝石"] = new UsableItem({
        name: "Advanced Green Gem",
        description: "A higher-tier crystal. When used, randomly adds 200 ATK/DEF/AGI or 10,000 HP.",
        value: 200,
        image: "image/item/gem24_200.png",
        effects: [],
        gem_value: 200,
    });
    item_templates["极品黄宝石"] = new UsableItem({
        name: "Superior Yellow Gem",
        description: "An extremely precious crystal. When used, randomly adds 500 ATK/DEF/AGI or 25,000 HP.",
        value: 500,
        image: "image/item/gem31_500.png",
        effects: [],
        gem_value: 500,
    });
    item_templates["极品蓝宝石"] = new UsableItem({
        name: "Superior Blue Gem",
        description: "An extremely precious crystal. When used, randomly adds 1,000 ATK/DEF/AGI or 50,000 HP.",
        value: 1000,
        image: "image/item/gem32_1k.png",
        effects: [],
        gem_value: 1000,
    });
    item_templates["极品红宝石"] = new UsableItem({
        name: "Superior Red Gem",
        description: "An extremely precious crystal. When used, randomly adds 2,000 ATK/DEF/AGI or 100,000 HP.",
        value: 2000,
        image: "image/item/gem33_2k.png",
        effects: [],
        gem_value: 2000,
    });
    item_templates["极品绿宝石"] = new UsableItem({
        name: "Superior Green Gem",
        description: "An extremely precious crystal. When used, randomly adds 5,000 ATK/DEF/AGI or 250,000 HP.",
        value: 5000,
        image: "image/item/gem34_5k.png",
        effects: [],
        gem_value: 5000,
    });
    item_templates["殿堂黄宝石"] = new UsableItem({
        name: "Hall Yellow Gem",
        description: "A crystal rarely seen in an ordinary person's lifetime. When used, randomly adds 10,000 ATK/DEF/AGI or 1,000,000 HP.",
        value: 10000,
        image: "image/item/gem41_10k.png",
        effects: [],
        gem_value: 10000,
    });
    item_templates["殿堂蓝宝石"] = new UsableItem({
        name: "Hall Blue Gem",
        description: "A crystal rarely seen in an ordinary person's lifetime. When used, randomly adds 20,000 ATK/DEF/AGI or 2,000,000 HP.",
        value: 20000,
        image: "image/item/gem42_20k.png",
        effects: [],
        gem_value: 20000,
    });
    item_templates["殿堂红宝石"] = new UsableItem({
        name: "Hall Red Gem",
        description: "A crystal rarely seen in an ordinary person's lifetime. When used, randomly adds 50,000 ATK/DEF/AGI or 5,000,000 HP.",
        value: 50000,
        image: "image/item/gem43_50k.png",
        effects: [],
        gem_value: 50000,
    });
    item_templates["殿堂绿宝石"] = new UsableItem({
        name: "Hall Green Gem",
        description: "A crystal rarely seen in an ordinary person's lifetime. When used, randomly adds 100,000 ATK/DEF/AGI or 10,000,000 HP.",
        value: 100000,
        image: "image/item/gem44_100k.png",
        effects: [],
        gem_value: 100000,
    });
    item_templates["史诗黄宝石"] = new UsableItem({
        name: "Epic Yellow Gem",
        description: "An extremely rare crystal. When used, randomly adds 200,000 ATK/DEF/AGI or 20,000,000 HP.",
        value: 200000,
        image: "image/item/gem51_200k.png",
        effects: [],
        gem_value: 200000,
    });
    item_templates["史诗蓝宝石"] = new UsableItem({
        name: "Epic Blue Gem",
        description: "An extremely rare crystal. When used, randomly adds 500,000 ATK/DEF/AGI or 50,000,000 HP.",
        value: 500000,
        image: "image/item/gem52_500k.png",
        effects: [],
        gem_value: 500000,
    });
    item_templates["史诗红宝石"] = new UsableItem({
        name: "Epic Red Gem",
        description: "An extremely rare crystal. When used, randomly adds 1,000,000 ATK/DEF/AGI or 100,000,000 HP.",
        value: 1000000,
        image: "image/item/gem53_1M.png",
        effects: [],
        gem_value: 1000000,
    });
    item_templates["史诗绿宝石"] = new UsableItem({
        name: "Epic Green Gem",
        description: "An extremely rare crystal. When used, randomly adds 2,000,000 ATK/DEF/AGI or 200,000,000 HP.",
        value: 2000000,
        image: "image/item/gem54_2M.png",
        effects: [],
        gem_value: 2000000,
    });
    item_templates["传说黄宝石"] = new UsableItem({
        name: "传说黄宝石", 
        description: "能引发天空级强者厮杀的宝物，使用时随机增加攻击/防御/敏捷500万点或生命5亿点", 
        value: 5000000,
        image: "image/item/gem61_5M.png",
        effects: [],
        gem_value: 5000000,
    });
    item_templates["传说蓝宝石"] = new UsableItem({
        name: "传说蓝宝石", 
        description: "能引发天空级强者厮杀的宝物，使用时随机增加攻击/防御/敏捷1000万点或生命10亿点", 
        value: 10000000,
        image: "image/item/gem62_10M.png",
        effects: [],
        gem_value: 10000000,
    });
    item_templates["传说红宝石"] = new UsableItem({
        name: "传说红宝石", 
        description: "能引发天空级强者厮杀的宝物，使用时随机增加攻击/防御/敏捷2000万点或生命20亿点", 
        value: 20000000,
        image: "image/item/gem63_20M.png",
        effects: [],
        gem_value: 20000000,
    });
    item_templates["传说绿宝石"] = new UsableItem({
        name: "传说绿宝石", 
        description: "能引发天空级强者厮杀的宝物，使用时随机增加攻击/防御/敏捷5000万点或生命50亿点", 
        value: 50000000,
        image: "image/item/gem64_50M.png",
        effects: [],
        gem_value: 50000000,
    });
    item_templates["血杀剑"] = new UsableItem({
        name: "血杀剑", 
        description: "虽然看起来是剑，但其实是血洛晶的一丝碎片，蕴含着强烈的杀戮能量！使用时必定增加攻击1亿点。", 
        value: 1e15,
        image: "image/item/bloodkill_sword.png",
        effects: [],
        gem_value: 100e6,
    });
    item_templates["神话黄宝石"] = new UsableItem({
        name: "神话黄宝石", 
        description: "仅仅一颗就可以掀起小范围的腥风血雨，使用时随机增加攻击/防御/敏捷1亿点或生命100亿点", 
        value: 100e6,
        image: "image/item/gem71_100M.png",
        effects: [],
        gem_value: 100e6,
    });
    item_templates["神话蓝宝石"] = new UsableItem({
        name: "神话蓝宝石", 
        description: "仅仅一颗就可以掀起小范围的腥风血雨，使用时随机增加攻击/防御/敏捷2亿点或生命200亿点", 
        value: 200e6,
        image: "image/item/gem72_200M.png",
        effects: [],
        gem_value: 200e6,
    });
    item_templates["神话红宝石"] = new UsableItem({
        name: "神话红宝石", 
        description: "仅仅一颗就可以掀起小范围的腥风血雨，使用时随机增加攻击/防御/敏捷5亿点或生命500亿点", 
        value: 500e6,
        image: "image/item/gem73_500M.png",
        effects: [],
        gem_value: 500e6,
    });
    item_templates["神话绿宝石"] = new UsableItem({
        name: "神话绿宝石", 
        description: "仅仅一颗就可以掀起小范围的腥风血雨，使用时随机增加攻击/防御/敏捷10亿点或生命1000亿点", 
        value: 1e9,
        image: "image/item/gem74_1B.png",
        effects: [],
        gem_value: 1e9,
    });
})();



//怪物掉落
(function(){
    item_templates["凝胶"] = new Loot({
        name: "Gel",
        description: "Gel found from dead slimes. Can be used as a cushion, but not very durable.",
        value: 1,
        image: "image/item/rubber.png",
    });
    item_templates["金属残片"] = new Loot({
        name: "Metal Scraps",
        description: "Damaged ordinary metal pieces. No longer usable for crafting swords or shields, but perhaps they can be re-smelted?",
        value: 4,
        image: "image/item/iron_fragment.png",
    });
    item_templates["魔力碎晶"] = new Loot({
        name: "Magic Crystal Shard",
        description: "A small crystal with residual magical energy. The energy inside is still enough to cook meat or smelt iron.",//烤肉
        value: 6,
        image: "image/item/magic_fragment.png",
    });
    item_templates["飞蛾翅膀"] = new Loot({
        name: "Moth Wing",
        description: "A complete wing left by a moth. Can be used as clothing material.",
        value: 8,
        image: "image/item/fly_wing.png",
    });
    item_templates["坚硬石块"] = new Loot({
        name: "Hard Rock",
        description: "Large stones from the mountains outside Yangang City, also used to make abandoned golems and stone men.",
        value: 5,
        image: "image/item/hard_rock.png",
    });
    item_templates["微尘·凶兽肉块"] = new Loot({
        name: "Dust·Beast Meat",
        description: "Dust-rank wild beast meat. Has a raw smell, perhaps it needs to be cooked?", //加魔力碎晶
        value: 8,
        image: "image/item/O1_meat.png",
    });
    item_templates["骨头"] = new Loot({
        name: "Bone",
        description: "A thick bone. Just holding it feels eerie...",
        value: 6,
        image: "image/item/bone.png",
    });
    item_templates["铜骨"] = new Loot({
        name: "Copper Bone",
        description: "Bronze bones left by Myriad-rank skeletons after death. Both hardness and toughness are excellent!",
        value: 20,
        image: "image/item/copper_bone.png",
    });


    //1-2
    item_templates["万物·凶兽肉块"] = new Loot({
        name: "Myriad·Beast Meat",
        description: "Myriad-rank wild beast meat. Full of vitality, slightly higher price.", //加魔力碎晶
        value: 200,
        image: "image/item/O5_meat.png",
    });
    item_templates["合金残片"] = new Loot({
        name: "Alloy Fragment",
        description: "Special metal from golems, mixing it into iron ingots can increase hardness.",
        value: 150,
        image: "image/item/alloy_fragment.png",
    });
    item_templates["异兽皮"] = new Loot({
        name: "Beast Hide",
        description: "Myriad-rank exotic beast hide, combining both hardness and flexibility.",
        value: 500,
        image: "image/item/O5_leather.png",
    });

    //1-3
    item_templates["毒液"] = new Loot({
        name: "Venom",
        description: "A common toxin aggregate found in the outskirts. The A1 alloy \"Purple Copper\" requires it as a raw material.",
        value: 2000,
        image: "image/item/poison_drop.png",
    });
    item_templates["灵液"] = new Loot({
        name: "Spirit Fluid",
        description: "Essence of Tidal-rank magical creatures, possessing multiple excellent properties.",
        value: 2500,
        image: "image/item/aura_drop.png",
    });
    item_templates["天蚕丝"] = new Loot({
        name: "Sky Silk",
        description: "Building material from leafcutter cocoons, containing wind elements. Tidal-rank wild beasts with nascent intelligence often carry it.",
        value: 3000,
        image: "image/item/sky_silk.png",
    });
    item_templates["潮汐·凶兽肉块"] = new Loot({
        name: "Tidal·Beast Meat",
        description: "Tidal-rank wild beast meat. Contains elemental power, hard to cook without a coal flame.",
        value: 5000,
        image: "image/item/O8_meat.png",
    });

    //1-4
    item_templates["大地级魂魄"] = new Loot({
        name: "Earth-Rank Soul",
        description: "The soul from a pure spirit wild beast. After processing, it can become pure energy.",
        value: 80e3,
        image: "image/item/A1_soul.png",
    });
    item_templates["巨型眼球"] = new Loot({
        name: "Giant Eyeball",
        description: "The eyeball of an Earth-rank wild beast, can be used as material for life recovery potions.",
        value: 100e3,
        image: "image/item/A1_eye.png",
    });
    item_templates["A1·能量核心"] = new Loot({
        name: "A1·Energy Core",
        description: "The core inside wild beasts that follow the \"inner alchemy\" cultivation system. Can induce tremendous power in a short time.",
        value: 120e3,
        image: "image/item/A1_crystal.png",
    });
    item_templates["断剑"] = new Loot({
        name: "Broken Sword",
        description: "A crude low-quality weapon used by wild beasts. Though prone to breaking, its potential is not limited to this.",
        value: 80e3,
        image: "image/item/A1_sword.png",
    });
    //1-5
    item_templates["地宫·荒兽肉块"] = new Loot({
        name: "Dungeon·Wild Beast Meat",
        description: "Edible wild beast meat found in the dungeon core! So all the edible wild beasts ran to the core?",
        value: 300e3,
        image: "image/item/A2_meat.png",
    });
    item_templates["霜炙皮草"] = new Loot({
        name: "Frost-Scorched Hide",
        description: "Hide that can withstand extreme cold and scorching heat, only obtainable from Earth-rank wild beasts.",
        value: 400e3,
        image: "image/item/temp_leather.png",
    });
    item_templates["流动凝胶"] = new Loot({
        name: "Living Gel",
        description: "Gel left behind after Earth-rank fluid creatures die. Compared to Tidal-rank and below dead matter, they still retain some biological activity.",
        value: 500e3,
        image: "image/item/living_rubber.png",
    });

    //1-5
    //2-1
    item_templates["一丝荒兽森林感悟"] = new Loot({
        name: "A Trace of Wild Beast Forest Insight",
        description: "Combat experience and breakthrough insights accumulated in the wild beast forest. (Deprecated/Unobtainable in current version/Go find the Heart Stone for a free breakthrough)",
        value: 0,
        image: "image/item/A1_break_trance.png",
    });
    item_templates["凝实荒兽森林感悟"] = new  UsableItem({
        name: "Crystallized Wild Beast Forest Insight",
        description: "A complete insight compiled from fragmented battle insights, can be used to break through to Earth Rank or accumulate experience.",
        value: 0,
        E_value: 10000000,
        effects:[],
        C_value: 1,
        image: "image/item/A1_break_clump.png",
    });
    item_templates["A4·能量核心"] = new Loot({
        name: "A4·Energy Core",
        description: "The core inside wild beasts that follow the \"inner alchemy\" cultivation system. Can induce tremendous power in a short time.",
        value: 960e3,
        image: "image/item/A4_crystal.png",
    });
    item_templates["森林·荒兽肉块"] = new Loot({
        name: "Forest·Wild Beast Meat",
        description: "As a forest famous for wild beasts, there's much more meat here than in the dungeon...",
        value: 1.2e6,
        image: "image/item/A4_meat.png",
    });
    item_templates["甲壳碎片"] = new Loot({
        name: "Carapace Fragment",
        description: "Carapace fragments from wild beasts with hard exoskeletons. Used for smelting A6-grade charged alloy.",
        value: 1.35e6,
        image: "image/item/A4_fragment.png",
    });
    item_templates["荒兽精华"] = new Loot({
        name: "Wild Beast Essence",
        description: "While it's neither tasty nor has a shell, its lifeblood is still full of energy.",
        value: 1.5e6,
        image: "image/item/beast_essence.png",
    });
    item_templates["水溶精华"] = new Loot({
        name: "Aquatic Essence",
        description: "Essence from aquatic wild beasts along the riverside. Can be used as material for magic potions.",
        value: 4.5e6,
        image: "image/item/aq_essence.png",
    });
    item_templates["秘境芦苇"] = new Loot({
        name: "Secret Realm Reed",
        description: "A flexible material from the Na family secret realm, can absorb energy attacks. Many cultivators and wild beasts carry it.",
        value: 2.4e7,
        image: "image/item/A6_reed.png",
    });
    item_templates["浅蓝晶粉"] = new Loot({
        name: "Light Blue Crystal Powder",
        description: "A somewhat bluer ender pearl isotope. Sadly, teleportation on the Xuelo Continent isn't that easy.",
        value: 3.2e7,
        image: "image/item/LB_powder.png",
    });

    
    item_templates["A7·能量核心"] = new Loot({
        name: "A7·Energy Core",
        description: "Energy crystals from certain spirit-type creatures. Can induce tremendous power in a short time.",
        value: 64e6,
        image: "image/item/A7_crystal.png",
    });
    item_templates["蓝金碎片"] = new Loot({
        name: "Blue Gold Fragment",
        description: "This is how the mighty warrior became a mighty warrior in exotic attire. Surprisingly, the secret realm contains high-strength metal!",
        value: 72e6,
        image: "image/item/bluegold_fragment.png",
    });
    item_templates["透明水晶"] = new Loot({
        name: "Transparent Crystal",
        description: "A sword handle energy-conducting material slightly better than willow wood. The only drawback is it's too hard to grip directly.",
        value: 80e6,
        image: "image/item/transparent_crystal.png",
    });
    item_templates["结界湖血肉"] = new Loot({
        name: "Barrier Lake Beast Flesh",
        description: "Wild beasts near the dead waters can't be eaten directly! But they can be used to forge blue gold...",
        value: 96e6,
        image: "image/item/A7-flesh.png",
    });
    item_templates["废墟符文"] = new Loot({
        name: "Ruin Rune",
        description: "Seems to contain mysterious power. Accumulate enough to craft a T8 workbench... of course, buying directly is much cheaper.",
        value: 120e6,
        image: "image/item/ruin_rune.png",
    });
    item_templates["废墟精华"] = new Loot({
        name: "Ruin Essence",
        description: "Vibrant life force sprouted from the ruins. Can resonate with water and fire badges, or be used to make more binding crystals.",
        value: 144e6,
        image: "image/item/ruin_essence.png",
    });
    item_templates["高能凝胶"] = new Loot({
        name: "High-Energy Gel",
        description: "Black gel from the bodies of battlefield spirit creatures. Concentrated with energy, has multiple uses.",
        value: 160e6,
        image: "image/item/warfield_rubber.png",
    });
    item_templates["战场·荒兽肉块"] = new Loot({
        name: "Battlefield·Wild Beast Meat",
        description: "Though the environment is chaotic, wild beasts that reach late Earth-rank have self-purification ability. Even goblins can eat it...",
        value: 480e6,
        image: "image/item/A8_meat.png",
    });
    item_templates["B1·能量核心"] = new Loot({
        name: "B1·Energy Core",
        description: "You know what this is, right? Super-evolved coal desu!",
        value: 2.64e9,
        image: "image/item/B1_crystal.png",
    });
    item_templates["红黑印记"] = new Loot({
        name: "Red-Black Mark",
        description: "An exclusive mark from inside standard heavy machinery. Can be used to increase metal strength during smelting.",
        value: 720e6,
        image: "image/item/redblack_mark.png",
    });
    item_templates["雷电加护"] = new Loot({
        name: "Lightning Blessing",
        description: "A trace of electrical attribute from inside the blockade-zone machinery. Law attribute is nearly 0, but sufficient to solidify high-energy gel.",
        value: 600e6,
        image: "image/item/electric_mark.png",
    });
    item_templates["重甲残骸"] = new Loot({
        name: "Heavy Armor Remnants",
        description: "Armor left behind by spaceship adventurers. Has not yet been amplified by red-black marks.",
        value: 540e6,
        image: "image/item/heavyarmor_shard.png",
    });
    item_templates["摩羽币"] = new Loot({
        name: "Moyu Coin",
        description: "Currency of a mid-tier cosmic nation. Worth only about 200Z in cosmic currency, but has considerable collectible value on the Xuelo Continent.",
        value: 1600e6,
        image: "image/item/MY_coin.png",
    });
    item_templates["进化结晶凝聚-一学就会"] = new Loot({
        name: "Evolution Crystal Condensate - Instant Mastery",
        description: "Because it's instant mastery, you've already learned it. You can sell it now! (Please check the core reactor)",
        value: 100e9,
        image: "image/item/evolve_script.png",
    });
    item_templates["初等进化结晶"] = new  UsableItem({
        name: "Basic Evolution Crystal",
        description: "A crystal nourished by the abundant energy between heaven and earth, upon contact it transforms into vast experience. Adds 100 billion EXP, can be used to break through to [Sky Rank]. (Tip: Must already have 900 billion+ EXP before using to break through)",
        value: 300e9,
        E_value: 1000e8,
        effects:[],
        C_value: 2,
        image: "image/item/evolve_1e11.png",
    });
    item_templates["中等进化结晶碎片"] = new  UsableItem({
        name: "中等进化结晶碎片", 
        description: "天地间充沛的能量滋养诞生的晶体碎片，接触后能够化作海量的经验为人所用。增加1000兆经验值，或等待【第四幕】更新后合成【中等进化结晶】突破云霄级。", 
        value: 3e15,
        E_value: 1000e12,
        effects:[],
        C_value: 2,
        image: "image/item/evolve_1e16_shard.png",
    });
    item_templates["一捆高能凝胶"] = new Loot({
        name: "Bundle of High-Energy Gel",
        description: "Coolant for the spaceship core machinery. Can be split into 100 ordinary high-energy gels.",
        value: 16000e6,
        image: "image/item/warfield_rubber_100.png",
    });
    item_templates["一捆B1·能量核心"] = new Loot({
        name: "Bundle of B1·Energy Cores",
        description: "Energy source for the spaceship core machinery. Can be split into 100 ordinary B1·Energy Cores.",
        value: 264e9,
        image: "image/item/B1_crystal_100.png",
    });
    item_templates["B6·飞船核心"] = new Loot({
        name: "B6·Spaceship Core",
        description: "Strongly recommend not selling. [Barrier Lake Heart] in V3.0X will surpass your hard-saved big sister, and reforging a spaceship core is very expensive...",
        value: 666666e6,
        image: "image/item/B6_spaceship_core.png",
    });
    //3幕
    item_templates["荒兽凭证"] = new Loot({
        name: "Wild Beast Voucher",
        description: "Proof of slaying an [early Sky-rank] wild beast. Can be used to exchange materials at the swamp entrance. One beast yields one voucher, but a person may have more...",
        value: 2e9,
        image: "image/item/B3_ear.png",
    });
    item_templates["沼泽·荒兽肉块"] = new Loot({
        name: "Swamp·Wild Beast Meat",
        description: "Might have radiation from evolving too quickly. But Sky-rank can completely ignore such chaotic energy~",
        value: 80e9,
        image: "image/item/B3_meat.png",
    });
    item_templates["荧光精华"] = new Loot({
        name: "Fluorescent Essence",
        description: "Remnants of natural luminescent organisms in the swamp. Its fluorescence can dispel the miasma that never dissipates.",
        value: 64e9,
        image: "image/item/firefly_essence.png",
    });
    item_templates["沼泽兽油"] = new Loot({
        name: "Swamp Beast Oil",
        description: "Though unsightly, it is an indispensable supply for fluorescent essence to glow long-term. It also has some sinister uses...",
        value: 48e9,
        image: "image/item/B3_oil.png",
    });
    //3-2
    item_templates["天空兽角"] = new Loot({
        name: "Sky Beast Horn",
        description: "Horns from wild beasts in the dark forest. Soaked in primal energy, excellent material for alloys.",
        value: 405e9,
        image: "image/item/sky_horn.png",
    });
    item_templates["B4·能量核心"] = new Loot({
        name: "B4·Energy Core",
        description: "Placing it in the core reactor would cause an instant explosion. Such unstable fuel requires a more reliable reactor.",
        value: 218.7e9,
        image: "image/item/B4_crystal.png",
    });
    item_templates["黑白枝丫"] = new Loot({
        name: "Black-White Branch",
        description: "Unfortunately, they are not super-giant gems. However, they possess the [Psychokinesis] attribute...",
        value: 341e9,
        image: "image/item/binary_twig.png",
    });
    item_templates["黑森叶片"] = new Loot({
        name: "Dark Forest Leaf",
        description: "Looks small but is actually large and thick. After appropriate processing, it can be made into better fabric.",
        value: 486e9,
        image: "image/item/forest_leaf.png",
    });
    //3-3
    item_templates["多孔冰晶"] = new Loot({
        name: "Porous Ice Crystal",
        description: "Air is a poor conductor of heat. Though the tundra gas doesn't seem to be a nitrogen-oxygen mixture, that doesn't stop it from being excellent insulation material.",
        value: 864e9,
        image: "image/item/ice_crystal.png",
    });
    item_templates["冰原超流体"] = new Loot({
        name: "Arctic Superfluid",
        description: "Thermal capacity similar to water, freezing point similar to helium.<br>After absorbing sufficient ice elements, it phase-changes into Eternal Ice Marrow...<br>As the name implies, this conversion takes approximately one epoch at tundra room temperature [240K].",
        value: 1.12e12,
        image: "image/item/iceland_superfiuld.png",
    });
    item_templates["玄冰果实"] = new Loot({
        name: "Mystic Ice Fruit",
        description: "When cooled to a sufficiently low temperature, a frost core will condense.<br>Must dissipate heat to [Arctic Superfluid] in the [Extreme Cold Phase Engine]!",
        value: 28.8e12,
        image: "image/item/ice_fruit.png",
    });
    //3-4
    item_templates["镶晶盾牌"] = new Loot({
        name: "镶晶盾牌", 
        description: "冰宫中的高级盾牌，镶嵌着特殊的晶体。可以用于和万载冰髓锭形成合金！", 
        value: 2.4e12,
        image: "image/item/crystal_shield.png",
    });
    item_templates["冰宫鳞片"] = new Loot({
        name: "冰宫鳞片", 
        description: "并不全是龙鳞，只要可以剥皮的敌人身上都会有。没有它的话会被万载冰髓冻死的……", 
        value: 3.0e12,
        image: "image/item/icepalace_shard.png",
    });
    item_templates["光环杖芯"] = new Loot({
        name: "光环杖芯", 
        description: "女巫构建的稳定微型能量回路。可以持续向外转化光环能量，也可用于调和不同性质的力量。", 
        value: 3.6e12,
        image: "image/item/halo_ending.png",
    });
    //3-5
    item_templates["B7·能量核心"] = new Loot({
        name: "B7·能量核心", 
        description: "颜色更加深邃而内敛了。或许云霄级的核心会有一个惊喜？", 
        value: 8.8e12,
        image: "image/item/B7_crystal.png",
    });
    item_templates["虹彩凝胶"] = new Loot({
        name: "虹彩凝胶", 
        description: "和那个只值几十个铜板的兄弟不同，它的彩色来源于多种元素的力量，因此价值不菲。", 
        value: 10.4e12,
        image: "image/item/rainbow_rubber.png",
    });
    item_templates["水素晶体"] = new Loot({
        name: "水素晶体", 
        description: "这个水素不是hydro-gen，而是水元素啦……或者你也可以当它是无人深空那个二氢晶体？", 
        value: 12.4e12,
        image: "image/item/aqua_element.png",
    });
    //3-6
    item_templates["传承水晶·橙"] = new Loot({
        name: "传承水晶·橙", 
        description: "左阿传承的一部分。一种与幻境阵法核心相连的水晶，能量输出比能量核心稳定许多。", 
        value: 40e12,
        image: "image/item/inherit_orange.png",
    });
    item_templates["传承水晶·白"] = new Loot({
        name: "传承水晶·白", 
        description: "左阿传承的一部分。单纯锋利而闪光的水晶。", 
        value: 50e12,
        image: "image/item/inherit_white.png",
    });
    item_templates["传承水晶·绿"] = new Loot({
        name: "传承水晶·绿", 
        description: "左阿传承的一部分。蕴含大量生机的水晶，加强热以提取能量。", 
        value: 60e12,
        image: "image/item/inherit_green.png",
    });
    item_templates["传承水晶·蓝"] = new Loot({
        name: "传承水晶·蓝", 
        description: "左阿传承的一部分。蕴含大量虚浮力量的水晶。", 
        value: 75e12,
        image: "image/item/inherit_blue.png",
    });
    item_templates["传承水晶·粉"] = new Loot({
        name: "传承水晶·粉", 
        description: "左阿传承的一部分。看似杂乱无章，实际上却含有大量能量回路的水晶。", 
        value: 125e12,
        image: "image/item/inherit_pink.png",
    });
    //3-7
    item_templates["天空级魂魄"] = new Loot({
        name: "天空级魂魄", 
        description: "保留完整能量回路，自动吸收天地间能量的魂魄。放置数年也不会丢失记忆。", 
        value: 210e12,
        image: "image/item/B9_soul.png",
    });
    item_templates["紫晶碎片"] = new Loot({
        name: "紫晶碎片", 
        description: "蓝金的上位金属。晶莹剔透，具有容纳灵魂的潜质。", 
        value: 325e12,
        image: "image/item/violet_fragment.png",
    });
    item_templates["幻境符文"] = new Loot({
        name: "幻境符文", 
        description: "由纳可的水火领域外溢的能量衍生的符文。巨型结界的作用可不是盖的！", 
        value: 369e12,
        image: "image/item/fantasy_rune.png",
    });
    item_templates["引力反常"] = new Loot({
        name: "引力反常", 
        description: "天外飞船到底是怎么飞进血洛的？这就是答案了！", 
        value: 416e12,
        image: "image/item/gravi_error.png",
    });


    




    item_templates["玄冰果实·觉醒"] = new  UsableItem({
        name: "Mystic Ice Fruit · Awakened",
        description: "A Mystic Ice Fruit with a condensed [Frost Core]. Can be used to craft [Heart of the Tundra] (evolvable equipment), or eaten directly for 10 trillion EXP.",
        value: 57.6e12,
        E_value: 10e12,
        effects:[],
        C_value: 3,
        image: "image/item/ice_fruit_awaken.png",
    });
    
    


    //以下为打钱的东西
    item_templates["铜板"] = new Loot({
        name: "Copper Coin",
        description: "Common currency minted by Yangang Territory.",
        value: 1,
        image: "image/item/1C.png",
    });
    item_templates["大铜板"] = new Loot({
        name: "Large Copper Coin",
        description: "Common currency minted by Yangang Territory, denomination 5C.",
        value: 5,
        image: "image/item/5C.png",
    });
    item_templates["五彩凝胶"] = new Loot({
        name: "Colorful Gel",
        description: "Intact, vibrantly colored gel. Sells for a good price!",
        value: 75,
        image: "image/item/rubber_colorful.png",
    });
    item_templates["银钱"] = new Loot({
        name: "Silver Coin",
        description: "Common currency minted by Yangang Territory, denomination 100C.",
        value: 100,
        image: "image/item/100C.png",
    });
    item_templates["红色刀币"] = new Loot({
        name: "Red Blade Coin",
        description: "Common currency of the Xuelo Continent, denomination 1X=1000C.",
        value: 1e3,
        image: "image/item/1X.png",
    });
    item_templates["黑色刀币"] = new Loot({
        name: "Black Blade Coin",
        description: "Common currency of the Xuelo Continent. 1Z=1000X=1'000'000C.",
        value: 1e6,
        image: "image/item/1Z.png",
    });
    item_templates["一捆黑币"] = new Loot({
        name: "Bundle of Black Coins",
        description: "Packaged common currency of the Xuelo Continent. Total denomination 10Z.",
        value: 10e6,
        image: "image/item/10Z.png",
    });
    item_templates["绿色刀币"] = new Loot({
        name: "Green Blade Coin",
        description: "Common currency of the Xuelo Continent. 1D=1000Z. Worth noting, it has two blades and can be forged into two sea green ingots.",
        value: 1e9,
        image: "image/item/1D.png",
    });
    item_templates["紫色刀币"] = new Loot({
        name: "Purple Blade Coin",
        description: "Common currency of the Xuelo Continent. 1B=1000D. Made from gems, it is quite precious, and even has a slight effect of enhancing fortune.",
        value: 1e12,
        image: "image/item/1B.png",
    });
    item_templates["宇宙币"] = new Loot({
        name: "宇宙币", 
        description: "全宇宙通用的货币。1U=1000B。界主强者在突破时会凝聚海量宇宙晶，切成小块即为富含能量的宇宙币。", 
        value: 1e15,
        image: "image/item/1U.png",
    });
    item_templates["宇宙币堆"] = new Loot({
        name: "宇宙币堆", 
        description: "一大堆宇宙币，共计1000U(或记为1kU)", 
        value: 1000e15,
        image: "image/item/1000U.png",
    });
})();


Object.keys(item_templates).forEach(id => {
    item_templates[id].id = id;
})

export {
    item_templates, 
    Item, OtherItem, UsableItem, 
    Armor, Shield, Weapon, Artifact, Book, 
    WeaponComponent, ArmorComponent, ShieldComponent,
    getItem, setLootSoldCount, recoverItemPrices, round_item_price, getArmorSlot, getEquipmentValue,
    book_stats, loot_sold_count,
    rarity_multipliers, getItemRarity
};