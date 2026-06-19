"use strict";

const dialogues = {};

class Dialogue {
    constructor({ name, 
                  starting_text = `Talk to ${name}`,
                  ending_text = `Return`,
                  is_unlocked = true, 
                  is_finished = false, 
                  textlines = {}, 
                  location_name,
    }) 
    {
        this.name = name; //displayed name, e.g. "Village elder"
        this.starting_text = starting_text;
        this.ending_text = ending_text; //text shown on option to finish talking
        this.is_unlocked = is_unlocked;
        this.is_finished = is_finished; //separate bool to remove dialogue option if it's finished
        this.textlines = textlines; //all the lines in dialogue

        this.location_name = location_name; //this is purely informative and wrong value shouldn't cause any actual issues
    }
}

class Textline {
    constructor({name,
                 text,
                 getText,
                 is_unlocked = true,
                 is_finished = false,
                 unlocks = {textlines: [],
                            locations: [],
                            dialogues: [],
                            traders: [],
                            stances: [],
                            flags: [],
                            items: [],
                            spec: [],
                            },
                locks_lines = {},
                otherUnlocks,
                required_flags,
            }) 
    {
        this.name = name; // displayed option to click, don't make it too long
        this.text = text; // what's shown after clicking
        this.getText = getText || function(){return this.text;};
        this.otherUnlocks = otherUnlocks || function(){return;};
        this.is_unlocked = is_unlocked;
        this.is_finished = is_finished;
        this.unlocks = unlocks || {};
        //this.spec = spec;
        
        this.unlocks.textlines = unlocks.textlines || [];
        this.unlocks.locations = unlocks.locations || [];
        this.unlocks.dialogues = unlocks.dialogues || [];
        this.unlocks.traders = unlocks.traders || [];
        this.unlocks.stances = unlocks.stances || [];
        this.unlocks.flags = unlocks.flags || [];
        this.unlocks.items = unlocks.items || []; //not so much unlocks as simply items that player will receive
        
        this.required_flags = required_flags;

        this.locks_lines = locks_lines;
        //related text lines that get locked; might be itself, might be some previous line 
        //e.g. line finishing quest would also lock line like "remind me what I was supposed to do"
        //should be alright if it's limited only to lines in same Dialogue
        //just make sure there won't be Dialogues with ALL lines unavailable
    }
}

(function(){
    dialogues["village elder"] = new Dialogue({
        name: "village elder",
        textlines: {
            "hello": new Textline({
                name: "Hello?",
                text: "Hello. Glad to see you got better",
                unlocks: {
                    textlines: [{dialogue: "village elder", lines: ["what happened", "where am i", "dont remember", "about"]}],
                },
                locks_lines: ["hello"],
            }),
            "what happened": new Textline({
                name: "My head hurts.. What happened?",
                text: `Some of our people found you unconscious in the forest, wounded and with nothing but pants and an old sword, so they brought you to our village. `
                + `It would seem you were on your way to a nearby town when someone attacked you and hit you really hard in the head.`,
                is_unlocked: false,
                locks_lines: ["what happened", "where am i", "dont remember"],
                unlocks: {
                    textlines: [{dialogue: "village elder", lines: ["ask to leave 1"]}],
                },
            }),
            "where am i": new Textline({
                name: "Where am I?",
                text: `Some of our people found you unconscious in the forest, wounded and with nothing but pants and an old sword, so they brought you to our village. `
                + `It would seem you were on your way to a nearby town when someone attacked you and hit you really hard in the head.`,
                is_unlocked: false,
                locks_lines: ["what happened", "where am i", "dont remember"],
                unlocks: {
                    textlines: [{dialogue: "village elder", lines: ["ask to leave 1"]}],
                },
            }),
            "dont remember": new Textline({
                name: "I don't remember how I got here, what happened?",
                text: `Some of our people found you unconscious in the forest, wounded and with nothing but pants and an old sword, so they brought you to our village. `
                + `It would seem you were on your way to a nearby town when someone attacked you and hit you really hard in the head.`,
                is_unlocked: false,
                locks_lines: ["what happened", "where am i", "dont remember"],
                unlocks: {
                    textlines: [{dialogue: "village elder", lines: ["ask to leave 1"]}],
                },
            }),
            "about": new Textline({
                name: "Who are you?",
                text: "I'm the unofficial leader of this village. If you have any questions, come to me",
                is_unlocked: false,
                locks_lines: ["about"]
            }),
            "ask to leave 1": new Textline({
                name: "Great... Thank you for help, but I think I should go there then. Maybe it will help me remember more.",
                text: "Nearby lands are dangerous and you are still too weak to leave. Do you plan on getting ambushed again?",
                is_unlocked: false,
                unlocks: {
                    textlines: [{dialogue: "village elder", lines: ["need to"]}],
                },
                locks_lines: ["ask to leave 1"],
            }),
            "need to": new Textline({
                name: "But I want to leave",
                text: `You first need to recover, to get some rest and maybe also training, as you seem rather frail... Well, you know what? Killing a few wolf rats could be a good exercise. `
                        +`You could help us clear some field of them, how about that?`,
                is_unlocked: false,
                unlocks: {
                    textlines: [{dialogue: "village elder", lines: ["rats", "ask to leave 2", "equipment"]}],
                    locations: ["Infested field"],
                    activities: [{location:"Village", activity:"weightlifting"}],
                },
                locks_lines: ["need to"],
            }),
            "equipment": new Textline({
                name: "Is there any way I could get a weapon and proper clothes?",
                text: `We don't have anything to spare, but you can talk with our trader. He should be somewhere nearby. `
                        +`If you need money, try selling him some rat remains. Fangs, tails or pelts, he will buy them all. I have no idea what he does with this stuff...`,
                is_unlocked: false,
                locks_lines: ["equipment"],
                unlocks: {
                    textlines: [{dialogue: "village elder", lines: ["money"]}],
                    traders: ["village trader"]
                }
            }),
            "money": new Textline({
                name: "Are there other ways to make money?",
                text: "You could help us with some fieldwork. I'm afraid it won't pay too well.",
                is_unlocked: false,
                locks_lines: ["money"],
                unlocks: {
                    activities: [{location: "Village", activity: "fieldwork"}],
                }
            }),
            "ask to leave 2": new Textline({
                name: "Can I leave the village?",
                text: "We talked about this, you are still too weak",
                is_unlocked: false,
            }),
            "rats": new Textline({
                name: "Are wolf rats a big issue?",
                text: `Oh yes, quite a big one. Not literally, no, though they are much larger than normal rats... `
                        +`They are a nasty vermin that's really hard to get rid of. And with their numbers they can be seriously life-threatening. `
                        +`Only in a group though, single wolf rat is not much of a threat`,
                is_unlocked: false,
            }),
            "cleared field": new Textline({ //will be unlocked on clearing infested field combat_zone
                name: "I cleared the field, just as you asked me to",
                text: `You did? That's good. How about a stronger target? Nearby cave is just full of this vermin. `
                        +`Before that, maybe get some sleep? Some folks prepared that shack over there for you. It's clean, it's dry, and it will give you some privacy. `
                        +`Oh, and before I forget, our old craftsman wanted to talk to you.`,
                is_unlocked: false,
                unlocks: {
                    locations: ["Nearby cave", "Infested field", "Shack"],
                    textlines: [{dialogue: "village elder", lines: ["ask to leave 3"]}],
                    dialogues: ["old craftsman"],
                },
                locks_lines: ["ask to leave 2", "cleared field"],
            }),
            "ask to leave 3": new Textline({
                name: "Can I leave the village?",
                text: "You still need to get stronger.",
                unlocks: {
                    locations: ["Nearby cave", "Infested field"],
                    dialogues: ["old craftsman"],
                },
                is_unlocked: false,
            }),
            "cleared cave": new Textline({
                name: "I cleared the cave. Most of it, at least",
                text: `Then I can't call you "too weak" anymore, can I? You are free to leave whenever you want, but still, be careful. You might also want to ask the guard for some tips about the outside. He used to be an adventurer.`,
                is_unlocked: false,
                unlocks: {
                    textlines: [{dialogue: "village elder", lines: ["ask to leave 4"]}],
                    locations: ["Forest road", "Infested field", "Nearby cave"],
                    dialogues: ["village guard"],
                },
                locks_lines: ["ask to leave 3", "rats", "cleared cave"],
            }),
            "ask to leave 4": new Textline({
                name: "Can I leave the village?",
                text: "You are strong enough, you can leave and come whenever you want.",
                is_unlocked: false,
                unlocks: {
                    locations: ["Forest road", "Infested field", "Nearby cave"],
                    dialogues: ["village guard", "old craftsman"],
                },
            }),
            "new tunnel": new Textline({
                name: "I found an even deeper tunnel in the cave",
                text: "The what?... I have a bad feeling about this, you better avoid it until you get better equipment. Don't forget to bring a good shield too.",
                is_unlocked: false,
                locks_lines: ["new tunnel"],
            }),
        }
    });

    dialogues["old craftsman"] = new Dialogue({
        name: "old craftsman",
        is_unlocked: false,
        textlines: {
            "hello": new Textline({
                name: "Hello, I heard you wanted to talk to me?",
                text: "Ahh, good to see you traveler. I just thought of a little something that could be of help for someone like you. See, young people this days "+
                "don't care about the good old art of crafting and prefer to buy everything from the store, but I have a feeling that you just might be different. "+
                "Would you like a quick lesson?",
                unlocks: {
                    textlines: [{dialogue: "old craftsman", lines: ["learn", "leave"]}],
                },
                locks_lines: ["hello"],
            }),
            "learn": new Textline({
                name: "Sure, I'm in no hurry.",
                text: "Ahh, that's great. Well then... \n*[Old man spends some time explaining all the important basics of crafting and providing you with tips]*\n"+
                "Ahh, and before I forget, here, take these. They will be helpful for gathering necessary materials.",
                unlocks: {
                    textlines: [{dialogue: "old craftsman", lines: ["remind1", "remind2", "remind3"]}],
                    items: ["Old pickaxe" ,"Old axe", "Old sickle"],
                    flags: ["is_gathering_unlocked", "is_crafting_unlocked"],
                },
                locks_lines: ["learn","leave"],
                is_unlocked: false,
            }),
            "leave": new Textline({
                name: "I'm not interested.",
                text: "Ahh, I see. Maybe some other time then, when you change your mind, hmm?",
                is_unlocked: false,
            }),
            
            "remind1": new Textline({
                name: "Could you remind me how to create equipment for myself?",
                text: "Ahh, of course. Unless you are talking about something simple like basic clothing, then you will first need to create components that can then be assembled together. "+
                "For weapons, you generally need a part that you use to hit an enemy and a part that you hold in your hand. For armor, you will need some actual armor and then something softer to wear underneath, "+
                "which would mostly mean some clothes.",
                is_unlocked: false,
            }),
            "remind2": new Textline({
                name: "Could you remind me how to improve my creations?",
                text: "Ahh, that's simple, you just need more experience. This alone will be a great boon to your efforts. For equipment, you might also want to start with better components. "+
                "After all, even with the most perfect assembling you can't turn a bent blade into a legendary sword.",
                is_unlocked: false,
            }),
            "remind3": new Textline({
                name: "Could you remind me how to get crafting materials?",
                text: "Ahh, there's multiple ways of that. You can gain them from fallen foes, you can gather them around, or you can even buy them if you have some spare coin.",
                is_unlocked: false,
            }),
        }
    });

    dialogues["village guard"] = new Dialogue({
        name: "village guard",
        is_unlocked: false,
        textlines: {
            "hello": new Textline({
                name: "Hello?",
                text: "Hello. I see you are finally leaving, huh?",
                unlocks: {
                    textlines: [{dialogue: "village guard", lines: ["tips", "job"]}],
                },
                locks_lines: ["hello"],
            }),
            "job": new Textline({
                name: "Do you maybe have any jobs for me?",
                is_unlocked: false,
                text: "You are somewhat combat capable now, so how about you help me and the boys on patrolling? Not much happens, but it pays better than working on fields",
                unlocks: {
                    activities: [{location:"Village", activity:"patrolling"}],
                },
                locks_lines: ["job"],
            }),
            "tips": new Textline({
                name: "Can you give me any tips for the journey?",
                is_unlocked: false,
                text: `First and foremost, don't rush. It's fine to spend some more time here, to better prepare yourself. `
                +`There's a lot of dangerous animals out there, much stronger than those damn rats, and in worst case you might even run into some bandits. `
                +`If you see something that is too dangerous to fight, try to run away.`,
                unlocks: {
                    textlines: [{dialogue: "village guard", lines: ["teach"]}],
                },
            }),
            "teach": new Textline({
                name: "Could you maybe teach me something that would be of use?",
                is_unlocked: false,
                text: `Lemme take a look... Yes, it looks like you know some basics. Do you know any proper techniques? No? I thought so. I could teach you the most standard three. `
                +`They might be more tiring than fighting the "normal" way, but if used in a proper situation, they will be a lot more effective. Two can be easily presented through `
                + `some sparring, so let's start with it. The third I'll just have to explain. How about that?`,
                unlocks: {
                    locations: ["Sparring with the village guard (quick)", "Sparring with the village guard (heavy)"],
                },
                locks_lines: ["teach"],
            }),
            "quick": new Textline({
                name: "So about the quick stance...",
                is_unlocked: false,
                text: `It's usually called "quick steps". As you have seen, it's about being quick on your feet. `
                +`While power of your attacks will suffer, it's very fast, making it perfect against more fragile enemies`,
                otherUnlocks: () => {
                    if(dialogues["village guard"].textlines["heavy"].is_finished) {
                        dialogues["village guard"].textlines["wide"].is_unlocked = true;
                    }
                },
                locks_lines: ["quick"],
                unlocks: {
                    stances: ["quick"]
                }
            }),
            "heavy": new Textline({
                name: "So about the heavy stance...",
                is_unlocked: false,
                text: `It's usually called "crushing force". As you have seen, it's about putting all your strength in attacks. ` 
                +`It will make your attacks noticeably slower, but it's a perfect solution if you face an enemy that's too tough for normal attacks`,
                otherUnlocks: () => {
                    if(dialogues["village guard"].textlines["quick"].is_finished) {
                        dialogues["village guard"].textlines["wide"].is_unlocked = true;
                    }
                },
                locks_lines: ["heavy"],
                unlocks: {
                    stances: ["heavy"]
                }
            }),
            "wide": new Textline({
                name: "What's the third technique?",
                is_unlocked: false,
                text: `It's usually called "broad arc". Instead of focusing on a single target, you make a wide swing to hit as many as possible. ` 
                +`It might work great against groups of weaker enemies, but it will also significantly reduce the power of your attacks and will be even more tiring than the other two stances.`,
                locks_lines: ["wide"],
                unlocks: {
                    stances: ["wide"]
                }
            }),
        }
    });

    dialogues["gate guard"] = new Dialogue({
        name: "gate guard",
        textlines: {
            "enter": new Textline({
                name: "Hello, can I get in?",
                text: "The town is currently closed to everyone who isn't a citizen or a guild member. No exceptions.",
            }), 
        }
    });
    dialogues["suspicious man"] = new Dialogue({
        name: "suspicious man",
        textlines: {
            "hello": new Textline({ 
                name: "Hello? Why are you looking at me like that?",
                text: "Y-you! You should be dead! *the man pulls out a dagger*",
                unlocks: {
                    locations: ["Fight off the assailant"],
                },
                locks_lines: ["hello"],
            }), 
            "defeated": new Textline({ 
                name: "What was that about?",
                is_unlocked: false,
                text: "I... We... It was my group that robbed you. I thought you came back from your grave for revenge... Please, I don't know anything. "
                +"If you want answers, ask my boss. He's somewhere in the town.",
                locks_lines: ["defeated"],
                unlocks: {
                    textlines: [{dialogue: "suspicious man", lines: ["behave"]}],
                },
            }), 
            "behave": new Textline({ 
                name: "Are you behaving yourself?",
                is_unlocked: false,
                text: "Y-yes! Please don't beat me again!",
                locks_lines: ["defeated"],
            }), 
        }
    });
    dialogues["farm supervisor"] = new Dialogue({
        name: "farm supervisor",
        textlines: {
            "hello": new Textline({ 
                name: "Hello",
                text: "Hello stranger",
                unlocks: {
                    textlines: [{dialogue: "farm supervisor", lines: ["things", "work", "animals", "fight", "fight0"]}],
                },
                locks_lines: ["hello"],
            }),
            "work": new Textline({
                name: "Do you have any work with decent pay?",
                is_unlocked: false,
                text: "We sure could use more hands. Feel free to help my boys on the fields whenever you have time!",
                unlocks: {
                    activities: [{location: "Town farms", activity: "fieldwork"}],
                },
                locks_lines: ["work"],
            }),
            "animals": new Textline({
                name: "Do you sell anything?",
                is_unlocked: false,
                text: "Sorry, I'm not allowed to. I could however let you take some stuff in exchange for physical work, and it just so happens our sheep need shearing.",
                required_flags: {yes: ["is_gathering_unlocked"]},
                unlocks: {
                    activities: [{location: "Town farms", activity: "animal care"}],
                },
                locks_lines: ["animals"],
            }),
            "fight0": new Textline({
                name: "Do you have any task that requires some good old violence?",
                is_unlocked: false,
                text: "I kinda do, but you don't seem strong enough for that. I'm sorry.",
                required_flags: {no: ["is_deep_forest_beaten"]},
            }),
            "fight": new Textline({
                name: "Do you have any task that requires some good old violence?",
                is_unlocked: false,
                text: "Actually yes. There's that annoying group of boars that keep destroying our fields. "
                + "They don't do enough damage to cause any serious problems, but I would certainly be calmer if someone took care of them. "
                + "Go to the forest and search for a clearing in north, that's where they usually roam when they aren't busy eating our crops."
                + "I can of course pay you for that, but keep in mind it won't be that much, I'm running on a strict budget here.",
                required_flags: {yes: ["is_deep_forest_beaten"]},
                unlocks: {
                    locations: ["Forest clearing"],
                },
                locks_lines: ["fight"],
            }),
            "things": new Textline({
                is_unlocked: false,
                name: "How are things around here?",
                text: "Nothing to complain about. Trouble is rare, pay is good, and the soil is as fertile as my wife!",
                unlocks: {
                    textlines: [{dialogue: "farm supervisor", lines: ["animals", "fight", "fight0"]}],
                }
            }), 
            "defeated boars": new Textline({
                is_unlocked: false,
                name: "I took care of those boars",
                text: "Really? That's great! Here, this is for you.",
                locks_lines: ["defeated boars"],
                unlocks: {
                    money: 1000,
                }
            }), 
        }

    });

    //NekoRPG dialogues below
    dialogues["猫妖"] = new Dialogue({
        name: "Cat Demon",
        textlines: {
            "你是谁": new Textline({
                name: "Who are you?",
                text: "This is Cat Demon! Now, let me give you a brief introduction to this place.",
                unlocks: {
                    textlines: [{dialogue: "猫妖", lines: ["背景故事"]}],
                },
                locks_lines: ["你是谁"],
            }),
            "背景故事": new Textline({
                is_unlocked: false,
                name: "Where is this place?",
                text: "In the beginning, a continent called Xuelo came into being.<br>The Xuelo Continent brims with energy, giving rise to countless races and forms of life.<br>On this continent, the strong can trample the weak underfoot without restraint!<br>And here — within the Xuelo Continent, the Siyong World, the Yangang Territory — is the Nayaka Clan.",


                unlocks: {
                    textlines: [{dialogue: "猫妖", lines: ["Neko是谁"]}],
                },

                locks_lines: ["背景故事"],
            }),
            "Neko是谁": new Textline({
                is_unlocked: false,
                name: "And who is Neko?",
                text: "Neko — an ordinary, unremarkable girl of the Nayaka Clan in Yangang City.<br>"+
                "One day, just as Neko finished her morning cultivation,<br>"+
                "she discovered that her elder sister Nanami, who had grown up alongside her, was nowhere to be found.<br>"+
                "Upon learning from the clan that Nanami had gone out to train the day before and had not yet returned, Neko could not spare a moment to think.<br>"+
                "She resolutely left the clan alone, setting out to find any trace of Nanami.<br>"+
                "And so our story begins...",

                unlocks: {

                    flags: ["is_gathering_unlocked", "is_crafting_unlocked"],
                    locations: ["纳家练兵场 - 1"],
                },

                locks_lines: ["Neko是谁"],
            }),
            "MT10_clear": new Textline({
                is_unlocked: false,
                name: "Open the Gate",
                text: "In [V0.13], this dialogue should theoretically never unlock.<br>" +
                "If you are loading an old save after an update, you may use this dialogue to unlock subsequent areas.<br>" +
                "MOD - NekoRPG author: Supernatural Creature Fire-Breathing Research Association - Sayuki (perpetually whimpering =w=)<br>" +
                "Original: Yet Another Idle RPG - miktaew <br>" +
                "Settings from: I Eat Tomatoes - Swallowed Star, Qianye - Neko's Story <br>",
                unlocks: {
                    locations: ["燕岗城"],
                },
                locks_lines: ["MT10_clear"],
            })
            // "what happened": new Textline({
            //     name: "My head hurts.. What happened?",
            //     text: `Some of our people found you unconscious in the forest, wounded and with nothing but pants and an old sword, so they brought you to our village. `
            //     + `It would seem you were on your way to a nearby town when someone attacked you and hit you really hard in the head.`,
            //     is_unlocked: false,
            //     locks_lines: ["what happened", "where am i", "dont remember"],
            //     unlocks: {
            //         textlines: [{dialogue: "village elder", lines: ["ask to leave 1"]}],
            //     },
            // }),
        }
    });
    dialogues["秘法石碑 - 1"] = new Dialogue({
        name: "Arcane Stele - 1",
        textlines: {
            "Speed": new Textline({
                is_unlocked: false,
                name: "Comprehend: Blood Fusion - Swift",
                text: "Blood Fusion - Swift has been added to available Arcane Arts!",
                locks_lines: ["Speed"],
                unlocks: {
                    stances: ["MB_Speed"],
                },
            }), 
            "Power": new Textline({
                is_unlocked: false,
                name: "Comprehend: Blood Fusion - Edge",
                text: "Blood Fusion - Edge has been added to available Arcane Arts!",

                locks_lines: ["Power"],
                unlocks: {
                    stances: ["MB_Power"],
                },
            }), 
        }
    });
    
    dialogues["路人甲"] = new Dialogue({
        name: "Passerby",
        textlines: {
            "shop": new Textline({ 
                is_unlocked: false,
                name: "Excuse me, is there a shop around here?",
                text: "Little girl, just left your clan, haven't you?<br>" +
                "Space is precious in central Yangang City — shops are mostly in the outer districts.<br>" +
                "The nearest one is the chain store \"Yangang General Store\"<br>"+"Walk another half mile to the east and you'll find it",

                unlocks: {
                    traders: ["Yangang General Store"],
                },
                locks_lines: ["shop"],
            }), 
        }
    });
    
    dialogues["百兰"] = new Dialogue({
        name: "Bailan",
        textlines: {
            "before": new Textline({ 
                is_unlocked: true,
                name: "Excuse me, who are you?",
                text: "Where did you come from, little girl? With your level of cultivation, going out to train all on your own —<br>are you sure that's a good idea? The Wild Beasts out there will eat you alive.",

                unlocks: {
                    textlines: [{dialogue: "百兰", lines: ["before2"]}],
                },
                locks_lines: ["before"],
            }),
            "before2": new Textline({ 
                is_unlocked: false,
                name: "Sir, it's not right to look down on people, you know.",
                text: "Hey, who are you calling 'sir'?! Don't push your luck——",

                unlocks: {
                    locations: ["燕岗近郊 - 0"],
                },
                locks_lines: ["before2"],
            }), 
            "defeat": new Textline({ 
                is_unlocked: false,
                name: "Wait, what's that you're holding in your hand?",
                text: "This... this is a map,<br>drawn to show the location of a recently discovered Treasure Site.",

                unlocks: {
                    textlines: [{dialogue: "百兰", lines: ["defeat2"]}],
                },
                locks_lines: ["defeat"],
            }), 
            "defeat2": new Textline({ 
                is_unlocked: false,
                name: "Is there more detailed information?",
                text: "Oh yes, yes — I've heard there are quite a few valuable things inside,<br>but it's rather dangerous. Very few people make it out alive.",

                unlocks: {
                    textlines: [{dialogue: "百兰", lines: ["defeat3"]}],
                },
                locks_lines: ["defeat2"],
            }), 
            "defeat3": new Textline({ 
                is_unlocked: false,
                name: "Hand it over, and you can go.",
                text: "......Fine.<br>(Ugh, to lose to a little girl like this —<br>my luck is truly awful. How am I going to explain this to the clan...)",

                unlocks: {
                    items: [{item_name:"地图-藏宝地"}],
                    //items: ["地图-藏宝地"],
                    locations: ["燕岗近郊 - 1"],
                },
                locks_lines: ["defeat3"],
            }),
            "V0.21 Recover": new Textline({ 
                is_unlocked: false,
                name: "V0.21 update: click here to unlock the next area if loading an old save",
                text: "Area 3-1 has been unlocked!",

                unlocks: {
                    locations: ["燕岗近郊 - 1"],
                },
                locks_lines: ["V0.21 Recover"],
            }),
        }
    });
    
    dialogues["地宫老人"] = new Dialogue({
        name: "Old Man of the Underground Palace",
        textlines: {
            "dig": new Textline({ 
                is_unlocked: true,
                name: "Hmm... old man, what is it you want to say?",
                text: "Sometimes, fighting monsters directly yields very little.<br>" +
                "But when you put your pickaxe to clever use,<br>" +
                "you may find surprising and unexpected results.<br>However, don't be too greedy...<br>The law of diminishing returns plays out perfectly here.",
                
                locks_lines: ["dig"],
            }),
        }
    });

    
    dialogues["纳娜米"] = new Dialogue({
        name: "Nanami",
        textlines: {
            "1": new Textline({ 
                is_unlocked: true,
                name: "Sister!",
                text: "Koko?!<br>Why are you here? It's dangerous here,<br>listen to me — stop fooling around and get back to the clan.",

                unlocks: {
                    textlines: [{dialogue: "纳娜米", lines: ["2"]}],
                },
                locks_lines: ["1"],
            }),
            "2": new Textline({ 
                is_unlocked: false,
                name: "No. A well-behaved child would never abandon their sister at a time like this.",
                text: "......It's my fault for not explaining clearly.<br>The truth is, this expedition was tacitly approved by Clan Head Nabu.<br>Or rather, it was he who deliberately arranged for me to come.",

                unlocks: {
                    textlines: [{dialogue: "纳娜米", lines: ["3"]}],
                },
                locks_lines: ["2"],
            }),
            "3": new Textline({ 
                is_unlocked: false,
                name: "Eh, wait, what?",
                text: "...To tell you the truth, during a Wild Beast hunt some time ago,<br>the clan was ambushed by unknown assailants and suffered heavy losses.<br>"+
                "The attackers were extraordinarily powerful —<br>with eerie movement techniques and speed,<br>they cut down our clansmen almost effortlessly.<br>"+
                "The Clan Head was furious and dispatched our finest elites to investigate,<br>ultimately discovering this underground palace housing a great treasure,<br>and let word spread!<br>"+
                "Now, Earth Rank cultivators from a thousand miles around<br>have been receiving the news and making their way here.<br>Yet the master of this underground palace has shown no sign of movement.",

                unlocks: {
                    textlines: [{dialogue: "纳娜米", lines: ["4"]}],
                },
                locks_lines: ["3"],
            }),
            "4": new Textline({ 
                is_unlocked: false,
                name: "So that's how it is? A bit frightening. But then, Sister, why would you...",
                text: "Well......this enemy is extremely cunning.<br>If the clan were to rashly send out Sky Rank cultivators,<br>it would only put them on guard.<br>"+
                "That's why they quietly sent someone unassuming like me,<br>disguised as a reckless ordinary adventurer.<br>And I have in my hands a trump card capable of eliminating the enemy.<br>"+
                "But there are simply too many Wild Beasts down here.<br>I can handle a few at most,<br>and I can't reveal that trump card — so I got trapped.",

                unlocks: {
                    textlines: [{dialogue: "纳娜米", lines: ["5"]}],
                },
                locks_lines: ["4"],
            }),
            "5": new Textline({ 
                is_unlocked: false,
                name: "Leave it to me, Sister. We'll take them all out together!",
                text: "No no, it's too dangerous.<br>......Wait, Koko, how did you get down here?<br>Don't tell me you already dealt with that Wild Beast elite upstairs?<br>",

                unlocks: {
                    textlines: [{dialogue: "纳娜米", lines: ["6"]}],
                },
                locks_lines: ["5"],
            }),
            "6": new Textline({ 
                is_unlocked: false,
                name: "I've told you before, don't underestimate me. Besides, if I can't even help my sister with something this small, what good am I?",
                text: "......<br>I see... without realizing it, you've grown up, haven't you......<br>Alright, I understand.",

                unlocks: {
                    items: [{item_name: "纳娜米"}],
                },
                locks_lines: ["6"],
            }),
        }
    });
    
    dialogues["纳布"] = new Dialogue({
        name: "Nabu",
        textlines: {
            "1": new Textline({ 
                is_unlocked: true,
                name: "Father, Sister.",
                text: "[Nabu] You're both here. Koko, Nana — good work this time.<br>[Nanami] Koko, we really made a great contribution this time!<br>The City Lord's Mansion gave us so many rewards.",

                unlocks: {
                    textlines: [{dialogue: "纳布", lines: ["2"]}],
                },
                locks_lines: ["1"],
            }),
            "2": new Textline({ 
                is_unlocked: false,
                name: "Yes... far more generous than I had imagined.",
                text: "[Nabu] Koko, is something weighing on your mind?<br>[Nanami] Senior Clan Head, Koko will say what she wants to say when she's ready.<br>Please don't press her......<br>[Nabu] Very well. After all, our little girl is eleven years old now.<br>How does it feel? Are you close to breaking through to Earth Rank?",

                unlocks: {
                    textlines: [{dialogue: "纳布", lines: ["3"]}],
                },
                locks_lines: ["2"],
            }),
            "3": new Textline({ 
                is_unlocked: false,
                name: "Yes... ever since the underground palace trip, I've felt a great deal — and I've faintly touched that threshold.",
                text: "There are two ways to reach Earth Rank.<br>The first is to slowly accumulate comprehension until it naturally comes together.<br>The second — to break through swiftly through real-world tempering.",

                unlocks: {
                    textlines: [{dialogue: "纳布", lines: ["4"]}],
                },
                locks_lines: ["3"],
            }),
            "4": new Textline({ 
                is_unlocked: false,
                name: "...I don't want to wait any longer. Father, Sister — I want to go to the Wild Beast Forest and seek an opportunity to break through.",
                text: "[Nanami] Koko......<br>[Nabu] The Wild Beast Forest is extremely perilous,<br>but you have the heart of an adventurer — your father will surely support you.<br>"+
                "The sword and armor you cobbled together from scraps at the training grounds<br>are yours from this day forward.<br>"+
                "And here is a protective talisman inscribed with a teleportation formation.<br>Use it if you find yourself in danger.<br>"+
                "[Nanami] Senior Clan Head, the Wild Beast Forest is far too dangerous —<br>could you give Koko the laser rifle I used before?<br>"+
                "No. While that would make things easier for Koko,<br>it would also remove the pressure needed for a true breakthrough.<br>",

                unlocks: {
                    textlines: [{dialogue: "纳布", lines: ["5"]}],
                },
                locks_lines: ["4"],
            }),
            "5": new Textline({ 
                is_unlocked: false,
                name: "Father, what is a laser rifle?",
                text: "It is time to tell you these things.<br>They relate to a legend —<br>" +
                `<span style="color:lightblue">The legend of the [Extraterrestrial Clan].</span><br>Once you break through to Earth Rank, Koko, I will tell you more.`,

                unlocks: {
                    textlines: [{dialogue: "纳布", lines: ["6"]}],
                },
                locks_lines: ["5"],
            }),
            "6": new Textline({ 
                is_unlocked: false,
                name: "I see... I understand. Then wait for good news from me.",
                text: "Hmph, always giving your sister worry.<br>You'd better do your best, little girl.<br>......Just like before — make sure you come back safe and sound.",

                unlocks: {
                    //items: [{item_name: "纳娜米"}],
                    locations: ["荒兽森林"],
                },
                locks_lines: ["6"],
            }),
        }
    });
    
    dialogues["清野瀑布"] = new Dialogue({
        name: "Qingye Waterfall",
        starting_text: "Gazing at Qingye Waterfall",
        textlines: {
            "wf1": new Textline({
                is_unlocked: false,
                name: "...",
                text: "Father always said the outside world is dangerous and cruel.<br>......But I don't believe it. I want to see further places for myself.",
                locks_lines: ["wf1"],
                unlocks: {
                    textlines: [{dialogue: "清野瀑布", lines: ["wf2"]}],
                },
            }), 
            "wf2": new Textline({
                is_unlocked: false,
                name: "...",
                text: "Now I've truly experienced a brush with death,<br>and I understand what Father meant.",
                locks_lines: ["wf2"],
                unlocks: {
                    spec:"DeathCount-1",
                    textlines: [{dialogue: "清野瀑布", lines: ["wf3"]}],
                },
            }), 
            "wf3": new Textline({
                is_unlocked: false,
                name: "...",
                text: "Perhaps, when the day comes that I truly become a strong cultivator,<br>this wish might be fulfilled.",
                locks_lines: ["wf3"],
                unlocks: {
                    textlines: [{dialogue: "清野瀑布", lines: ["wf4"]}],
                },
            }), 
            "wf4": new Textline({
                is_unlocked: false,
                name: "Beyond the waterfall are mountains — what lies beyond the mountains?",
                text: "[Strange Voice] What are you afraid of?<br>You must become strong! Go explore the world beyond!<br>The trials of life and death — what doesn't kill you only sends you back to bed when you fail!",
                locks_lines: ["wf4"],
                unlocks: {
                    textlines: [{dialogue: "清野瀑布", lines: ["wf5"]}],
                },
            }), 
            "wf5": new Textline({
                is_unlocked: false,
                name: "*Swings sword instinctively*",
                text: "The body gradually becomes more agile and nimble.<br>All the accumulation of these days —<br>finally ignited in this very moment!",
                locks_lines: ["wf5"],
                unlocks: {
                    textlines: [{dialogue: "清野瀑布", lines: ["wf6"]}],
                },
            }), 
            "wf6": new Textline({
                is_unlocked: false,
                name: "......What just happened? What did I just do?",
                text: "Heartless Water - Flood, Heartless Water - Stream, Heartless Water - Rain have been added to available Arcane Arts!",

                locks_lines: ["wf6"],
                unlocks: {
                    stances: ["WH_Power","WH_Speed","WH_Multi"],
                },
            }), 
        }
    });
    dialogues["纳布(江畔)"] = new Dialogue({
        name: "Nabu (Riverside)",
        starting_text: "Talk to father Nabu",
        textlines: {
            "jp1": new Textline({ 
                is_unlocked: false,
                name: "...",
                text: "Koko! Are you alright? What happened to you, all those injuries?",
                unlocks: {
                    textlines: [{dialogue: "纳布(江畔)", lines: ["jp2"]}],
                },
                
                locks_lines: ["jp1"],
            }),
            "jp2": new Textline({ 
                is_unlocked: false,
                name: "It's a long story... I got into a fight with people from the Bai Clan outside. Good thing I had that talisman.",
                text: "Neko told Nabu everything that had happened,<br>including the unexpected gain she had<br>while meditating on Qingye Waterfall after being injured.<br><br>[Nabu] How outrageous — those Bai Clan bastards! They deserve everything coming to them!<br>All they did was get jealous of what our clan obtained, and stoop to such underhanded tactics.<br>That Bailan isn't even Earth Rank,<br>has no real standing in the Bai Clan at all — saying they're helping him save face is just a shameful excuse!",
                unlocks: {
                    textlines: [{dialogue: "纳布(江畔)", lines: ["jp3"]}],
                },
                
                locks_lines: ["jp2"],
            }),
            "jp3": new Textline({ 
                is_unlocked: false,
                name: "This matter... I bear some responsibility too. I shouldn't have provoked the powerful Bai Clan and brought trouble to the family.",
                text: "Koko, this is not your fault.<br>Don't go out alone for a while — I'll send someone to protect you. [Neko] I'm fine. Father, you always said that opportunity only comes in dangerous places.",
                unlocks: {
                    textlines: [{dialogue: "纳布(江畔)", lines: ["jp4"]}],
                },
                
                locks_lines: ["jp3"],
            }),
            "jp4": new Textline({ 
                is_unlocked: false,
                name: "It is precisely because of this life-and-death crisis that I have the strength I have now.",
                text: "",
                unlocks: {
                    spec:"Realm-A3",
                    textlines: [{dialogue: "纳布(江畔)", lines: ["jp5"]}],
                },
                
                locks_lines: ["jp4"],
            }),
            "jp5": new Textline({ 
                is_unlocked: false,
                name: "(Setting for the Extraterrestrial Clan abridged) What a fascinating world —",
                text: "......It is also time to send you into the clan's Secret Realm for tempering. Know that the requirement to enter the Nayaka Secret Realm is reaching the mid-stage of Earth Rank.",
                unlocks: {
                    textlines: [{dialogue: "纳布(江畔)", lines: ["jp6"]}],
                },
                
                locks_lines: ["jp5"],
            }),
            "jp6": new Textline({ 
                is_unlocked: false,
                name: "Oh, the clan's Secret Realm?",
                text: "",
                unlocks: {
                    spec:"Realm-A4",
                    locations: ["纳家秘境"],
                },
                
                locks_lines: ["jp6"],
            }),
        }
    });
    dialogues["秘境心火精灵"] = new Dialogue({
        name: "Secret Realm Heart-Fire Spirit",
        textlines: {
            "xh1": new Textline({ 
                is_unlocked: false,
                name: "Hmph~ Now you know how fearsome I am!",
                text: "Spare me, spare me——<br>This one is just a 'Spirit' born from the Secret Realm,<br>with absolutely no wealth or resources...",
                unlocks: {
                    textlines: [{dialogue: "秘境心火精灵", lines: ["xh2"]}],
                },
                
                locks_lines: ["xh1"],
            }),
            "xh2": new Textline({ 
                is_unlocked: false,
                name: "Hey, in a core area like this, you must have some authority over the Secret Realm, right?",
                text: "Ah yes, yes indeed!<br>I can help you adjust the Secret Realm's Spirit Formation Power!<br>That way you can gain more battle comprehension!",
                unlocks: {
                    textlines: [{dialogue: "秘境心火精灵", lines: ["check"]},{dialogue: "秘境心火精灵", lines: ["powerup"]},{dialogue: "秘境心火精灵", lines: ["powerdown"]},{dialogue: "秘境心火精灵", lines: ["powermax"]}],
                    locations: ["纳家秘境 - ∞"],
                },
                
                locks_lines: ["xh2"],
            }),
            "check": new Textline({ 
                is_unlocked: false,
                name: "How much Spirit Formation Power is currently active?",
                text: "",
                unlocks: {
                    textlines:[{dialogue: "秘境心火精灵", lines: ["powermax"]}],
                    spec: "A6-check"
                },
            }),
            "powerup": new Textline({ 
                is_unlocked: false,
                name: "Increase Spirit Formation Power by one level \\o/",
                text: "",
                unlocks: {
                    spec: "A6-up"
                },
            }),
            "powerdown": new Textline({ 
                is_unlocked: false,
                name: "Decrease Spirit Formation Power by one level T_T",
                text: "",
                unlocks: {
                    spec: "A6-down"
                },
            }),
            "powermax": new Textline({ 
                is_unlocked: false,
                name: "Raise Spirit Formation Power to the current maximum (ノ▼Д▼)ノ",
                text: "",
                unlocks: {
                    spec: "A6-max"
                },
            }),
        }
    });
    dialogues["纳鹰"] = new Dialogue({
        name: "Naying",
        starting_text: "Speak with the mysterious cultivator of the Barrier Lake",
        textlines: {
            "nb1": new Textline({ 
                is_unlocked: true,
                name: "......Senior, may I ask who you are?",
                text: "Heh heh, you don't recognize me?<br>True enough — it has been several thousand years since my fall.<br>Back in those days, I followed the Lord of Yangang City into battle,<br>and founded the Nayaka Clan within Yangang City.<br>I never imagined the clan would come this far.",
                unlocks: {
                    textlines: [{dialogue: "纳鹰", lines: ["nb2"]}],
                },
                
                locks_lines: ["nb1"],
            }),
            "nb2": new Textline({ 
                is_unlocked: false,
                name: "......You are the ancestor of the Nayaka Clan! This... how is it possible — the Elders and Father both said you were...",
                text: "No need to be surprised — I am indeed the ancestor of the Nayaka Clan, known as Naying.<br>None of the Nayaka descendants today know of this consciousness of mine,<br>hidden within the Secret Realm.<br>Were it to become known, I fear this Secret Realm<br>would be turned upside down by those adventurers.<br>",
                unlocks: {
                    textlines: [{dialogue: "纳鹰", lines: ["nb3"]}],
                },
                
                locks_lines: ["nb2"],
            }),
            "nb3": new Textline({ 
                is_unlocked: false,
                name: "How did this come to be? What happened back then that led to this state?",
                text: "Heh heh, little girl, no need to rush.<br>It is nothing more than a dull old tale.<br>In those days, I took a great risk to gather materials for a transaction,<br>venturing deep into the perilous Demon Blood Sea<br>to hunt powerful Wild Beasts.<br>In the Demon Blood Sea, I unwittingly fell into a trap<br>and became the soul slave of a <span style='color:pink'>Domain Rank</span> cultivator.<br>That cultivator... was likely comparable in power to the Lord of Yangang City.<br>",
                unlocks: {
                    textlines: [{dialogue: "纳鹰", lines: ["nb4"]}],
                },
                
                locks_lines: ["nb3"],
            }),
            "nb4": new Textline({ 
                is_unlocked: false,
                name: "...",
                text: "Such powerful cultivators forge soul slaves<br>for nothing more than to gain a powerful 'cannon fodder'.<br>At the time, I had absolutely no means of escape.<br>Those soul slaves obey their masters for life, without freedom,<br>with death ready to descend upon them at any moment.<br>Most met miserable ends after enduring endless dangers day and night!<br>To break free from this fate, I chose to destroy my own soul!<br>And transferred my consciousness into this single thread of thought.<br>This thread of thought had originally been stored within the clan's Secret Realm<br>to maintain communication with the clan — now it served a greater purpose.",
                unlocks: {
                    textlines: [{dialogue: "纳鹰", lines: ["nb5"]}],
                },
                
                locks_lines: ["nb4"],
            }),
            "nb5": new Textline({ 
                is_unlocked: false,
                name: "Ah...",
                text: "",
                unlocks: {
                    textlines: [{dialogue: "纳鹰", lines: ["nb6"]}],
                    spec: "A7-begin",
                },
                
                locks_lines: ["nb5"],
            }),
            "nb6": new Textline({ 
                is_unlocked: false,
                name: "I... can I?<br>Anything I can help with, Senior — please don't hesitate to ask.",
                text: "Your Fire Element comprehension has made some progress,<br>but there is still much room to grow.<br>That Domain Rank cultivator<br>was able to expand a [Domain] infused with law comprehension against his enemies —<br>I witnessed him use it several times.<br>Over thousands of years, I have developed my own understanding of this Domain.<br>Now I will impart my comprehension of these Arcane Arts<br>to you. Listen carefully.<br>",
                unlocks: {
                    textlines: [{dialogue: "纳鹰", lines: ["nb7"]}],
                },
                
                locks_lines: ["nb6"],
            }),
            "nb7": new Textline({ 
                is_unlocked: false,
                name: "Yes, this junior obeys.",
                text: "Naying extended a finger and pressed it between Neko's brows.<br>Instantly, a flood of complex information poured into her mind,<br>immersing her in all manner of profound states of comprehension.<br>After a moment, Neko opened her eyes,<br>with excitement gleaming at the depths of her gaze.<br>She could feel how greatly these insights would benefit her.<br>  [Neko] Senior, thank you.<br>I now have a clear understanding of the path ahead.<br>[Naying] No need for thanks.<br>I believe my legacy is nearly at its end here.<br>What you must do next is work hard to improve yourself —<br>and when I awaken once more, I hope to see you reach even greater heights.<br>",
                unlocks: {
                    textlines: [{dialogue: "纳鹰", lines: ["nb8"]}],
                    spec: "A7-exp",
                },
                
                locks_lines: ["nb7"],
            }),
            "nb8": new Textline({ 
                is_unlocked: false,
                name: "Senior... are you going to sleep again?",
                text: "  Heh heh, a single thread of thought cannot sustain itself indefinitely.<br>The next time, who knows when I shall wake.<br>If you wish to test yourself —<br>go to the depths of this Barrier Lake.<br>There, some 'Spirits' have naturally grown within the barrier,<br>developed consciousness, and seek to resist and break free.<br>For the stability of the Secret Realm, I entrust this task to you.<br>Go now — I won't keep you.",
                unlocks: {
                    locations: ["结界湖 - 1"],
                },
                
                locks_lines: ["nb8"],
            }),
        }
    });
    
    dialogues["纳娜米(废墟)"] = new Dialogue({
        name: "Nanami (Ruins)",
        textlines: {
            "fx1": new Textline({ 
                is_unlocked: true,
                name: "Sister, this vast expanse of ruins... is this where Shenlv City once stood?",
                text: "Yes. It is said that the Sky-Outsider<br>controlled a massive flying craft —<br>a palace-class treasure known as a 'D9-class Vessel'.<br>That craft reduced the entire city to rubble,<br>inflicting devastating casualties on our side of the Xuelo Continent.<br>In the end — through the combined assault of several hundred City Lord-level cultivators,<br>and even the intervention of a Heaven-Reaching existence,<br>they finally brought that craft down!",
                unlocks: {
                    textlines: [{dialogue: "纳娜米(废墟)", lines: ["fx2"]}],
                },
                
                locks_lines: ["fx1"],
            }),
            "fx2": new Textline({ 
                is_unlocked: false,
                name: "......Several hundred City Lord-level cultivators! Have the powerful fighters from over a dozen nearby territories already gathered here?",
                text: "More than half of them, at least.<br>But when the cultivators stormed inside the D9-class Vessel,<br>they found the Sky-Outsider wasn't in it at all.<br>We had underestimated him —<br>he had long since quietly launched over a hundred small craft,<br>known as 'B9-class Vessels', in an attempt to flee.",
                unlocks: {
                    textlines: [{dialogue: "纳娜米(废墟)", lines: ["fx3"]}],
                },
                
                locks_lines: ["fx2"],
            }),
            "fx3": new Textline({ 
                is_unlocked: false,
                name: "D9, B9. It feels like some kind of classification system — I wonder what it is...",
                text: "Who knows.<br>True, these small craft were made of only precious-grade materials,<br>but they were small and fast — for a time no one could track them.<br>It took that great figure personally intervening;<br>within his soul-detection range,<br>nothing could hide.<br>In the end, the cultivators intercepted the vessel he was riding<br>beneath the eighteenth cloud layer,<br>and destroyed every last one of the vessels.",
                unlocks: {
                    textlines: [{dialogue: "纳娜米(废墟)", lines: ["fx4"]}],
                },
                
                locks_lines: ["fx3"],
            }),
            "fx4": new Textline({ 
                is_unlocked: false,
                name: "Whew... quite a story. Our goal is to find those crashed 'Vessels' and search for the treasures we need, right?",
                text: "Exactly. The treasures within the main battle Vessel<br>are currently being fought over by Sky-Cloud Rank and above cultivators.<br>Our target, however, is those smaller vessels.<br>But — there is one more target,<br>Koko, right before your eyes.<br>The ruins of Shenlv City.",
                unlocks: {
                    textlines: [{dialogue: "纳娜米(废墟)", lines: ["fx5"]}],
                },
                
                locks_lines: ["fx4"],
            }),
            "fx5": new Textline({ 
                is_unlocked: false,
                name: "The ruins of... Shenlv City?",
                text: "Yes, that's right. The once-flourishing Shenlv City,<br>now in ruins, with many of its original inhabitants gone,<br>has left behind many things. The Clan Head has already issued orders<br>for the entire Nayaka Clan to split up and search.<br>After finding useful valuables and treasures——",
                unlocks: {
                    textlines: [{dialogue: "纳娜米(废墟)", lines: ["fx6"]}],
                },
                
                locks_lines: ["fx5"],
            }),
            "fx6": new Textline({ 
                is_unlocked: false,
                name: "Wait, Sister — this kind of thing... it doesn't feel right. Won't the people of this city be unable to rest in peace?",
                text: "Koko, all your sister knows is<br>that anything that helps the Nayaka Clan grow faster<br>is worth doing.<br>Right now, every power great and small in the surrounding cities is doing the same thing.<br>It is not easy for us to claim more than others,<br>and there is no time to grieve for those refugees.",
                unlocks: {
                    textlines: [{dialogue: "纳娜米(废墟)", lines: ["fx7"]}],
                },
                
                locks_lines: ["fx6"],
            }),
            "fx7": new Textline({ 
                is_unlocked: false,
                name: "......I, I will listen to you, Sister.",
                text: "(If the same thing were to happen to Yangang City, would everyone... treat us the same way?)",
                unlocks: {
                    textlines: [{dialogue: "声律城难民", lines: ["fx8"]}],
                    
                    locations: ["声律城废墟 - 1"],
                },
                
                locks_lines: ["fx7"],
            }),
        }
    });
    dialogues["声律城难民"] = new Dialogue({
        name: "Shenlv City Refugee",
        textlines: {
            "fx8": new Textline({ 
                is_unlocked: false,
                name: "......Are you thirsty? Let me go find you some water.",
                text: "Thank you, little girl, but there's no need.<br>Thanks to this disaster, I no longer have to repay my debts to the City Lord's Mansion.<br>In a little while, I'll head back into the city —<br>the Sky Rank and Sky-Cloud Rank fortunes left behind in there<br>are quite considerable.<br>Even just a portion of one powerful cultivator's belongings<br>would be enough to keep me comfortable for the rest of my life, hahaha——",
                unlocks: {
                    textlines: [{dialogue: "声律城难民", lines: ["fx9"]}],
                },
                
                locks_lines: ["fx8"],
            }),
            "fx9": new Textline({ 
                is_unlocked: false,
                name: "......S-sorry to bother you.",
                text: "(Come to think of it... when I get back to Yangang City,<br>should I ask the City Lord's Mansion for a<span class='coin coin_moneyT'>10B, 8B</span> loan?)<br>If the same thing were to happen to Yangang City,<br>at least there would be resources to start over with.",
                unlocks: {
                },
                
                locks_lines: ["fx9"],
            }),
        }
    });
    
    dialogues["心魔(战场)"] = new Dialogue({
        name: "Inner Demon (Battlefield)",
        starting_text: "Stop and steady your mind",
        textlines: {
            "zc1": new Textline({ 
                is_unlocked: true,
                name: "The sharp stench of blood hits you the moment you leave the city... it's suffocating.",
                text: "Just this one Sky-Outsider<br>has caused the fall of so many powerful cultivators.<br>I must stay clear-headed — I cannot engage in needless killing.<br>Otherwise... I will only drift further and further down that path.<br>",
                unlocks: {
                    textlines: [{dialogue: "心魔(战场)", lines: ["zc2"]}],
                    locations: ["声律城战场 - 1"],
                },
                
                locks_lines: ["zc1"],
            }),
            "zc2": new Textline({ 
                is_unlocked: false,
                name: "......(Review past experiences)",
                text: "",
                unlocks: {
                    spec: "A8-killcount",
                },
            }),
        }
    });
    
    dialogues["御兰"] = new Dialogue({
        name: "Yulan",
        starting_text: "Watch the battle between Yulan and Haohuang",
        textlines: {
            "yl1": new Textline({ 
                is_unlocked: false,
                name: "...",
                text: "[Haohuang] Yulan! You again —<br>this Vessel was discovered first by our people of Shenghuan City,<br>and yet your Lanling City insists on shamelessly contesting it?",
                unlocks: {
                    textlines: [{dialogue: "御兰", lines: ["yl2"]}],
                },
                
                locks_lines: ["yl1"],
            }), 
            "yl2": new Textline({ 
                is_unlocked: false,
                name: "(A Vessel! There's news about a Vessel?)",
                text: "[Yulan] What are you saying, General Hao?<br>This time, it was your Shenghuan City's forces who provoked us first —<br>Lanling City was merely acting in self-defense.<br>[Haohuang] Since you are so utterly unreasonable, I have no need to waste more words on you!<br>With just your handful of people, you think you can break our Huo Formation?<br>What a ridiculous fantasy!",
                unlocks: {
                    textlines: [{dialogue: "御兰", lines: ["yl3"]}],
                },
                
                locks_lines: ["yl2"],
            }),
            "yl3": new Textline({ 
                is_unlocked: false,
                name: "Oh, have they already clashed? What an exciting battle!",
                text: "(Intense greatsword effects)<br>(Intense lightning strike effects)<br><br>[Neko] Whew... even from this distance,<br>I can clearly feel the terrifying energy shockwaves.",
                unlocks: {
                    textlines: [{dialogue: "御兰", lines: ["yl4"]}],
                },
                
                locks_lines: ["yl3"],
            }),
            "yl4": new Textline({ 
                is_unlocked: false,
                name: "...",
                text: "But more than fearful,<br>being able to witness such powerful and refined Arcane Arts being unleashed with my own eyes —<br>it is truly exciting.<br>I can feel it — some of those insights deep in my mind<br>have already begun to become my own.",
                unlocks: {
                    flags: ["is_realm_enabled"],
                },
                
                locks_lines: ["yl4"],
            }),
        }
    });
    
    dialogues["皎月神像"] = new Dialogue({
        name: "Moonlight Idol",
        starting_text: "Pay respects to the Moonlight Idol on the battlefield",
        textlines: {
            "jy1": new Textline({ 
                is_unlocked: false,
                name: "(Bow respectfully three times)",
                text: "[Moonlight Projection]<br>(This is an automated response)<br>What era do you think this is? Drop the old formalities —<br>just offer some Dao Coins as tribute.<br>In return, you shall receive the Moonlight Blessing...<br><br>By the way, the greater your vitality, the greater the blessing cost,<br>so you'll need to pay more.<br>Cultivators above <span class='realm_sky'>Sky Rank 4th Stage</span> need not apply —<br>this small idol cannot bear a projection of too powerful a force.",
                unlocks: {
                    textlines: [{dialogue: "皎月神像", lines: ["jy2"]},{dialogue: "皎月神像", lines: ["jy3"]}],
                },
                
                locks_lines: ["jy1"],
            }), 
            "jy2": new Textline({ 
                is_unlocked: false,
                name: "(Check current blessing and cost information)",
                text: "",
                unlocks: {
                    spec: "JY-check",
                },
            }), 
            "jy3": new Textline({ 
                is_unlocked: false,
                name: "(Offer Dao Coins to receive the blessing)",
                text: "",
                unlocks: {
                    spec: "JY-sacrifice",
                },
            }), 
        }
    });


    
    dialogues["纳娜米(飞船)"] = new Dialogue({
        name: "Nanami (Vessel)",
        textlines: {
            "nnm1": new Textline({ 
                is_unlocked: false,
                name: "Sister! What are you doing here?",
                text: "[Neko] ......Sister? *poke*<br>Neko tilted her head —<br>her sister didn't seem to respond at all,<br>currently absorbed in reading a book in her hands.<br>[Neko] The spine reads... 'Gene Primal Energy Application - Spirit Body Arts'?<br>It seems like she is completely immersed in this book,<br>as if on the verge of an epiphany — best not to disturb her......",

                unlocks: {
                    textlines: [{dialogue: "纳娜米(飞船)", lines: ["nnm2"]}],
                },
                locks_lines: ["nnm1"],
            }),
            "nnm2": new Textline({ 
                is_unlocked: false,
                name: "Neko quietly waited by her side, and in the blink of an eye three hours had passed.",
                text: "[Nanami] Ah, I see — no wonder!<br>This book is so detailed; to gain so much in such a short time,<br>simply wonderful!<br>She tossed the book aside,<br>stood up, stretched with a lazy yawn,<br>and glanced over — Neko was staring at her with a look of profound grievance.<br>[Nanami/Neko] WAAAAAH!!",

                unlocks: {
                    textlines: [{dialogue: "纳娜米(飞船)", lines: ["nnm3"]}],
                },
                locks_lines: ["nnm2"],
            }),
            "nnm3": new Textline({ 
                is_unlocked: false,
                name: "What are you doing, Sister! Why did you suddenly make that sound!",
                text: "[Nanami] K-Koko, when, when did you get here?<br>I thought those iron-skinned monsters had come......<br>[Neko] Hmm, about three hours — no matter how much I called, Sister wouldn't respond.<br>[Nanami] Boo hoo, it's all my fault for worrying you. That cultivation book just now seemed to have a pull to it — I got absorbed in it without even noticing.",

                unlocks: {
                    textlines: [{dialogue: "纳娜米(飞船)", lines: ["nnm4"]}],
                },
                locks_lines: ["nnm3"],
            }),
            "nnm3": new Textline({ 
                is_unlocked: false,
                name: "But Sister, a Spirit Body value of 200 million gets fully negated if the enemy has 2 million Agility — and all the enemies here have over 2 million Agility...",
                text: "[Nanami] Huh, Koko, what did you just say?<br>[Neko] From what I know about this game,<br>as long as you don't learn the Restraint arts, it can't hurt.<br>[Nanami] ......Is that really how it works now?!<br>The two exchanged their gains from this vessel expedition,<br>along with everything they had seen and heard along the way.<br>[Nanami] Much of the intelligence I found came from the books on this bookshelf.<br>They seem to contain quite a bit of information about the Extraterrestrial Clan,<br>but unfortunately the more core content is not mentioned at all.",

                unlocks: {
                    textlines: [{dialogue: "纳娜米(飞船)", lines: ["nnm4"]}],
                },
                locks_lines: ["nnm3"],
            }),
            "nnm4": new Textline({ 
                is_unlocked: false,
                name: "Sister, you said these puppets are called 'Techno-Constructs' by the Extraterrestrial Clan? And the ones we encountered along the way, many of them are 'A9' and 'B1' grade?",
                text: "[Nanami] Yes, if the records in these books are accurate,<br>the three grades A, B, and C correspond to Earth, Sky, and Sky-Cloud Rank,<br>and the numbers that follow correspond to minor cultivation stages in order.<br>[Neko] So 'A9' grade is the ninth stage of Earth Rank?<br>But the ones I encountered along the way, like that blue-skinned creature...<br>they must be equivalent to early Sky Rank combat power.<br>[Nanami] One can only conclude... the Extraterrestrial Clan's classification is far stricter.<br>More than half a rank above the Xuelo World standard.<br>Koko, you've become so strong.<br>Without my laser rifle, the me of today<br>would be completely helpless against those Techno-Constructs.",

                unlocks: {
                    textlines: [{dialogue: "纳娜米(飞船)", lines: ["nnm5"]}],
                },
                locks_lines: ["nnm4"],
            }),
            "nnm5": new Textline({ 
                is_unlocked: false,
                name: "I suppose so, heh heh. So Sister, what do we do now?",
                text: "[Nanami] We've already come this far, so naturally we press on.<br>A vessel from the Sky-Outsiders...<br>who knows how many years until we see one again.<br>Even setting aside all the potentially precious treasures, I want to try out the new insights I've learned.<br>[Neko] That's really not that useful...<br>Sister, why not take a Moonlight Blessing during the new moon<br>and then drink this Returning Wind Potion?<br>I guarantee it can more than double your damage output!<br>With your HP, you can receive the blessing for just sixteen Dao Coins!<br><br>[Nanami] Hm... forget it,<br>we're already inside the vessel —<br>we can't exactly run all the way out to find the idol..",

                unlocks: {
                    items: [{item_name: "纳娜米(飞船)",quality:130}],
                },
                locks_lines: ["nnm5"],
            }),
        }
    });
    
    dialogues["核心反应堆"] = new Dialogue({
        name: "Core Reactor",
        starting_text: "Use [Core Reactor]",
        textlines: {
            "reactor": new Textline({ 
                is_unlocked: true,
                name: "Use [Core Reactor]",
                text: "...",
                unlocks: {
                    spec:"A7-reactor",
                },
            }),
        }
    });

    dialogues["纳布(沼泽)"] = new Dialogue({
        name: "Nabu (Swamp)",
        textlines: {
            "zz1": new Textline({ 
                is_unlocked: true,
                name: "...",
                text: "No one could have anticipated<br>that the radiation from the Sky-Outsider vessel's crash<br>would cause so many Wild Beasts to mutate.<br>Perhaps this is the outsider's final act of revenge...<br>These Wild Beasts have become stronger and more ferocious than before.<br>A vast number of Sky Rank and even Sky-Cloud Rank Wild Beasts have emerged — a Beast Tide has formed.",
                unlocks: {
                    textlines: [{dialogue: "纳布(沼泽)", lines: ["zz2"]}],
                },
                locks_lines: ["zz1"],
            }),
            "zz2": new Textline({ 
                is_unlocked: false,
                name: "Father, have you ever experienced a Beast Tide before? What is it like?",
                text: "[Nabu] As the name implies......<br>Countless berserk Wild Beasts assault human towns and cities,<br>countless weak common folk lose their homes and are displaced.<br>[Neko] ......So tragic......<br>[Nabu] Koko, the City Lord's Mansion has offered generous rewards this time,<br>taken from what was recovered from the Sky-Outsider by the major territories.<br>Hunt Wild Beasts and bring back proof, and you can claim your reward.",
                unlocks: {
                    textlines: [{dialogue: "纳布(沼泽)", lines: ["zz3"]}],
                },
                locks_lines: ["zz2"],
            }),
            "zz3": new Textline({ 
                is_unlocked: false,
                name: "Father, has Sister already departed with the clan's first group?",
                text: "",
                unlocks: {
                    spec:"3-1-nanami",
                    textlines: [{dialogue: "纳布(沼泽)", lines: ["zz4"]}],
                },
                locks_lines: ["zz3"],
            }),
            "zz4": new Textline({ 
                is_unlocked: false,
                name: "......Understood",
                text: "Alright, it's about time —<br>the next Nayaka Clan contingent has already set out.<br>Get your head in the game and let's move.<br>With the elite cultivators of Yangang City's main force leading the way,<br>there's no need to worry about encountering wandering Domain or Sky-Cloud Rank Beast Kings.",
                unlocks: {
                    
                    locations: ["赫尔沼泽"],
                },
                locks_lines: ["zz4"],
            }),
        }
    });

    dialogues["结界湖转化器"] = new Dialogue({
        name: "Barrier Lake Converter",
        starting_text: "Exchange Wild Beast vouchers for items (including the converter)",
        textlines: {
            "jjh": new Textline({
                is_unlocked: true,
                name: "Convert Barrier Lake Core (requires Barrier Lake Core in equipment slot)",
                text: "",
                unlocks: {
                    spec:"jjhzx",
                },
            }),
            "pz-my": new Textline({ 
                is_unlocked: true,
                name: "Exchange for Mithril Ingot (30:1)",
                text: "",
                unlocks: {
                    spec:"pz-my",
                },
            }),
            "pz-bs": new Textline({ 
                is_unlocked: true,
                name: "Exchange for Epic Topaz (80:1)",
                text: "",
                unlocks: {
                    spec:"pz-bs",
                },
            }),
            "pz-Bq": new Textline({ 
                is_unlocked: true,
                name: "Exchange for Purple Dao Coin (250:1)",
                text: "",
                unlocks: {
                    spec:"pz-Bq",
                },
            }),


            //20:1 宝石
            //40:1 秘银
            //250:1 紫刀币
        }
    });

    dialogues["峰"] = new Dialogue({
        name: "Feng",
        starting_text: "Talk to the armored young man",
        textlines: {
            "lf1": new Textline({ 
                is_unlocked: false,
                name: "You, you...",
                text: "[???] Thank you.<br>[Neko] Who are you, and why would you be in a place like this?<br>It's way too suspicious!<br>[???] Uh... do I really look suspicious?",
                unlocks: {
                    textlines: [{dialogue: "峰", lines: ["lf2"]}],
                },
                locks_lines: ["lf1"],
            }),
            "lf2": new Textline({ 
                is_unlocked: false,
                name: "And do you know how dangerous that was just now? That big one was Sky Rank 4th Stage!",
                text: "[???] Is that so, Sky Rank 4th Stage...<br>(According to intelligence, that corresponds to Stellar Rank 4th Stage.)<br>With your level of strength, dealing with that Wild Beast just now<br>carried quite considerable risk for you too, didn't it?<br>Even so, you chose to help someone without hesitation?",
                unlocks: {
                    textlines: [{dialogue: "峰", lines: ["lf3"]}],
                },
                locks_lines: ["lf2"],
            }),
            "lf3": new Textline({ 
                is_unlocked: false,
                name: "It was nothing, and it's none of your business — are you looking down on me?",
                text: "",
                unlocks: {
                    textlines: [{dialogue: "峰", lines: ["lf4"]}],
                    spec: "lf-1",
                    flags: ["is_moonwheel_unlocked"],
                },
                locks_lines: ["lf3"],
            }),
            "lf4": new Textline({ 
                is_unlocked: false,
                name: "......Wait! Don't go!",
                text: "[???] Is there something else?<br>[Neko] You...<br>Since you're so capable, guide me out of the forest then.<br>I can't find my way back.<br>[???] Heh heh, alright. Little girl, what's your name?<br>[Neko] ......<br><br>Neko. That's my name. And you?<br>[Feng] My name is <span style='color:aqua'>[Feng]</span>",
                unlocks: {
                    textlines: [{dialogue: "峰", lines: ["lf5"]}],
                },
                locks_lines: ["lf4"],
            }),
            "lf5": new Textline({ 
                is_unlocked: false,
                name: "................Along the way, the two gradually opened up to each other.",
                text: "[Neko] (How to put it...<br>this person, when I first saw him,<br>seemed to be acting very strangely.)<br>(But after walking together for a while,<br>he's unexpectedly easy to get along with.)<br>Feng... you must be older than me,<br>so I'll call you Big Brother Feng.<br>If you don't mind, call me Koko.<br>[Feng] Sure. Koko, you said earlier<br>that this is the heart of Yangang Territory's sphere of influence?<br>And where we're heading<br>is Yangang City, the [Territorial Capital] of Yangang Territory?",
                unlocks: {
                    textlines: [{dialogue: "峰", lines: ["lf6"]}],
                },
                locks_lines: ["lf5"],
            }),
            "lf6": new Textline({ 
                is_unlocked: false,
                name: "Yes, although the Beast Tide has struck,",
                text: "[Neko] All the powerful cultivators of Yangang Territory are out defending against the Beast Tide,<br>so the city is temporarily rather empty.<br>[Feng] In that case... once we're out of the forest,<br>I'll be counting on you to lead the way.<br><br>[Feng] has joined the party!",
                unlocks: {
                    textlines: [{dialogue: "峰", lines: ["lf7"]}],
                    items: [{item_name: "峰"}],
                },
                locks_lines: ["lf6"],
            }),
            "lf7": new Textline({ 
                is_unlocked: false,
                name: "Something's happening!",
                text: "(Baifang appears with a group of Bai Clan members!)<br>[Baifang] Haha, I wondered who it was —<br>turns out it's Miss Neko.<br>(Twist: Our ally Leidong appears)<br>(Intense standoff)<br>(Twist: The enemy's Baiyanta appears)<br>(Another intense standoff)<br>(Twist: The enemy is scared off by Big Brother Feng)",
                unlocks: {
                    textlines: [{dialogue: "峰", lines: ["lf8"]}],
                },
                locks_lines: ["lf7"],
            }),
            "lf8": new Textline({ 
                is_unlocked: false,
                name: "Another turn of events!",
                text: "(The Bai Clan members are robbed by the Thirteen Axes!)<br>(The Bai Clan members can't beat the Thirteen Axes without Restraint potions!)<br>(Baiyanta flees and begs Neko for help!)<br>(The Thirteen Axes think Neko is carrying the valuables and try to rob her!)<br><br>Not gonna lie, she really does have a <span class='coin coin_moneySp'>1.21Δ</span> gem...<br>(<span class='coin coin_moneySp'>1.21Δ</span> goes berserk and wipes out all the Thirteen Axes!)<br>(Uncle Lei suddenly gets excited and urges Neko and Feng to become friends!)",
                unlocks: {
                    textlines: [{dialogue: "峰", lines: ["lf9"]}],
                },
                locks_lines: ["lf8"],
            }),
            "lf9": new Textline({ 
                is_unlocked: false,
                name: "What in the world is even going on...",
                text: "[Feng] Heh heh, never mind. We're safe for now —<br>let's get moving. We can talk when we reach the capital.<br>[Neko] Ugh, what is up with this guy —<br>if he's this strong, why didn't he say so earlier!<br>I spent all that effort saving him,<br>but that Barbarian Beast with a hundred million buffs couldn't even scratch him!",
                unlocks: {
                    locations: ["黑暗森林 - 3"],
                },
                locks_lines: ["lf9"],
            }),
            "lf10": new Textline({ 
                is_unlocked: false,
                name: "Phew — we're finally out of that pitch-black forest.",
                text: "[Leidong] Lord Feng, I know this city very well —<br>if there's somewhere you'd like to go...<br>[Feng] That won't be necessary... let's part ways here.<br>[Neko] Part ways... already?<br>(A flicker of disappointment crosses Neko's expression)<br>[Feng] By the way, where is the best lodging in Yangang City?<br>[Neko] Feiyun Pavilion.<br>[Feng] Good. If you want to find me, head to Feiyun Pavilion.<br><br>[Feng] has left the party!",
                unlocks: {
                    locations: ["飞云阁"],
                    spec:"lf-leave",
                },
                locks_lines: ["lf10"],
            }),
        }
    });
    
    dialogues["峰(飞云)"] = new Dialogue({
        name: "Feng (Feiyun)",
        starting_text: "Talk to Big Brother Feng",
        textlines: {
            "lf11": new Textline({ 
                is_unlocked: true,
                name: "Big Brother Feng... is there something you wanted to ask?",
                text: "Little one, the Arcane Arts you're currently using —<br>where did you get them?",
                unlocks: {
                    textlines: [{dialogue: "峰(飞云)", lines: ["lf12"]}],
                },
                locks_lines: ["lf11"],
            }),
            "lf12": new Textline({ 
                is_unlocked: false,
                name: "...Two years ago, I found them on the Sky-Outsider's vessel.",
                text: "[Feng] This set of Arcane Arts only covers the basics,<br>and there are many imperfections.<br>Let me give you a deeper set to study.<br><br>Feng flicked his fingers lightly; two beams of light shot out and drilled into Neko's brow.<br>Neko felt only a throbbing pain in her head,<br>followed suddenly by a flood of knowledge.<br><br>Starflower - Star Cluster, Starflower - Giant Star, Starflower - Flower Sea<br> have been added to available Arcane Arts!",
                unlocks: {
                    textlines: [{dialogue: "峰(飞云)", lines: ["lf13"]}],
                    stances: ["SF_Power","SF_Lucky","SF_Multi"],
                },
                locks_lines: ["lf12"],
            }),
            "lf13": new Textline({ 
                is_unlocked: false,
                name: "......About this Beast Tide defense,",
                text: "[Neko] Even the rewards the City Lord's Mansion gives to the top few<br>probably can't compare to what Big Brother Feng just gave me.<br>[Feng] The Beast Tide?<br>Speaking of which, there is something suspicious about it.<br>It appears to have been caused by the vessel's crash,<br>but from what I know, the [D9-class Vessel]<br>contains an enormous reactor —<br>and this continent lacks the knowledge to operate it safely.",
                unlocks: {
                    textlines: [{dialogue: "峰(飞云)", lines: ["lf14"]}],
                },
                locks_lines: ["lf13"],
            }),
            "lf14": new Textline({ 
                is_unlocked: false,
                name: "...?",
                text: "Every time this type of Primal Energy reactor explodes,<br>it releases large amounts of [Primal Energy Radiation].<br>Based on the evidence at the scene,<br>to refine a batch of [Supreme Evolution Crystals],<br>this reactor exploded a total of 58 times.",
                unlocks: {
                    textlines: [{dialogue: "峰(飞云)", lines: ["lf15"]}],
                },
                locks_lines: ["lf14"],
            }),
            "lf15": new Textline({ 
                is_unlocked: false,
                name: "But — so many people died because of this, why would anyone...",
                text: "So long as the sacrifice of thousands of the weak<br>can bring about a single powerful cultivator's breakthrough,<br>the value to the clan far outweighs those thousands.<br>Moreover, mutated Wild Beasts are more valuable as materials<br>and make for suitable training targets.<br>Can't accept that? That's fine.<br>After all, I have never detonated a Core Reactor myself.<br>This is ultimately nothing more than my speculation.",
                unlocks: {
                    textlines: [{dialogue: "峰(飞云)", lines: ["lf16"]}],
                },
                locks_lines: ["lf15"],
            }),
            "lf16": new Textline({ 
                is_unlocked: false,
                name: "Suddenly... I've lost all interest in defending against the Beast Tide.",
                text: "These are things a [strong cultivator] must come to understand.<br>Rather than defending against the Beast Tide,<br>there may be a place more suited to you.<br>About ten thousand miles east of Yangang City,<br>there is a secluded place<br>where the flow of time seems to be accelerated.",
                unlocks: {
                    textlines: [{dialogue: "峰(飞云)", lines: ["lf17"]}],
                },
                locks_lines: ["lf16"],
            }),
            "lf17": new Textline({ 
                is_unlocked: false,
                name: "But Big Brother Feng, why don't you go there yourself...",
                text: "There's no need. Those things were left behind by a domain master —<br>a Domain Rank cultivator,<br>and packing them up isn't worth <span class='coin coin_moneySp'>0.01Δ</span> to me;<br>they are meaningless in my eyes.<br>Remember — be very careful.<br>I will leave a spirit imprint on you;<br>use it to communicate with me when you are in danger.<br><br>",
                unlocks: {
                    locations: ["纯白冰原"],
                },
                locks_lines: ["lf17"],
            }),
        }
    });

    dialogues["纳娜米(冰原)"] = new Dialogue({
        name: "Nanami (Ice Plains)",
        textlines: {
            "by1": new Textline({ 
                is_unlocked: true,
                name: "It's so cold... Sister. Why is this snowy plain not marked on the map of Yangang Territory?",
                text: "This must be the place that mysterious cultivator Feng spoke of.<br>The environment is indeed harsh — low temperatures combined with ice elements;<br>Earth Rank cultivators probably risk freezing to death here.",
                //冰元素设定：微型而懒惰的拉普拉斯妖怪，可以在气温并不十分离谱的情况下制造负热量，吸收人的能量

                unlocks: {
                    textlines: [{dialogue: "纳娜米(冰原)", lines: ["by2"]}],
                },
                locks_lines: ["by1"],
            }),
            "by2": new Textline({ 
                is_unlocked: false,
                name: "Can't take it anymore, it's too cold — I'll open the Flame Domain to warm up.",
                text: "[Nanami] Don't use the Domain for something like this...<br>Wait, Koko, have you ever actually closed your Flame Domain?<br>[Neko] Eh...<br>In any case, Sister come closer!<br><br>Nanami has joined the party! Ability effectiveness increased by 5%!",
                //火焰领域设定：高温会让冰元素活化，释放出负热量，但高温领域的量级高于一小片区域的冰元素，起到驱散效果

                unlocks: {
                    items: [{item_name: "纳娜米(冰原)",quality:160}],
                },
                locks_lines: ["by2"],
            }),
        }
    });


    dialogues["极寒相变引擎"] = new Dialogue({
        name: "Extreme Cold Phase-Change Engine",
        starting_text: "Use [Extreme Cold Phase-Change Engine]",
        textlines: {
            "engine": new Textline({
                is_unlocked: false,
                name: "Use [Extreme Cold Phase-Change Engine]",
                text: "...",
                unlocks: {
                    spec:"freezing-engine",
                },
            }),
        }
    });

    dialogues["冰霜门户"] = new Dialogue({
        name: "Frost Gate",
        textlines: {
            "bs1": new Textline({
                is_unlocked:false,
                name: "Hm, what's this? (Touch)",
                text: "Nako's hand touches the frost gate.<br>In an instant, a bone-chilling cold sensation<br>travels up from her palm, making the girl shiver.<br>Before Nako's eyes, a long corridor appears,<br>stretching deep ahead.<br>Both sides of the corridor are towering, transparent walls of ice.",

                unlocks: {
                    textlines: [{dialogue: "冰霜门户", lines: ["bs2"]}],
                },
                locks_lines: ["bs1"],
            }),
            "bs2": new Textline({
                is_unlocked:false,
                name: "(Continue forward)",
                text: "She instinctively steps toward the end of the corridor<br>and soon sees an ice door,<br>plain in appearance but radiating a faint blue glow.<br>The icy power feels almost tangible, filling the air,<br>gradually coalescing into a form both foreign and familiar —<br>a vast aqua-blue hexagram!",

                unlocks: {
                    textlines: [{dialogue: "冰霜门户", lines: ["bs3"]}],
                },
                locks_lines: ["bs2"],
            }),
            "bs3": new Textline({
                is_unlocked:false,
                name: "A domain... an ice-element domain!",
                text: "Nako's hand rises on its own, flame energy surging<br>and spreading around her body,<br>clashing in an instant with the massive ice-blue hexagram!<br>A violent explosion reverberates through the air<br>as the entire corridor shakes wildly.<br>Shockwaves sweep outward —<br>cracks form across the ice walls, only to seal themselves shut.<br>The aqua-blue hexagram splinters apart all the same,<br>and the scorching flame energy seizes the opening,<br>flowing into the cracks of the hexagram until it vanishes entirely.",

                unlocks: {
                    textlines: [{dialogue: "冰霜门户", lines: ["bs4"]}],
                },
                locks_lines: ["bs3"],
            }),
            "bs4": new Textline({
                is_unlocked:false,
                name: "Water, nourishing all things... Fire, illuminating everything...",
                text: "",

                unlocks: {
                    spec:"realm-II",
                    textlines: [{dialogue: "冰霜门户", lines: ["bs5"]}],
                },
                locks_lines: ["bs4"],
            }),
            "bs5": new Textline({
                is_unlocked:false,
                name: "...",
                text: "[Nanami] Keke, wake up...<br>Don't scare your sister.<br>Nako opens her hazy eyes,<br>her sister's anxious voice reaching her from nearby.<br>[Nanami] Keke!<br>You suddenly fainted just now — I thought you...<br>Do you remember what happened?",

                unlocks: {
                    textlines: [{dialogue: "冰霜门户", lines: ["bs6"]}],
                },
                locks_lines: ["bs5"],
            }),
            "bs6": new Textline({
                is_unlocked:false,
                name: "(Forming a miniature spell array) How did you know my domain had a breakthrough?",
                text: "[Nanami] Hm? When did...<br>I see — the Frost Gate just now.<br>That's so you, Keke — always giving your sister a fright.<br>Speaking of which, I found this inside just a moment ago...<br><br>Obtained [Eternal Ice Marrow Ingot]!",

                unlocks: {
                    items: [{item_name: "万载冰髓锭"}],
                },
                locks_lines: ["bs6"],
            }),
        }
    });


    dialogues["溪月"] = new Dialogue({
        name: "Xiyue",
        starting_text: "Speak with the mysterious girl who appeared out of nowhere",
        textlines: {
            "xy1": new Textline({
                is_unlocked: false,
                name: "Something's strange, sis.",
                text: "[Nako] In the earlier battles, after those guys died,<br>their 'clanmates' weren't scared at all —<br>they actually charged at us even more frantically.<br>That's just not how normal people behave...<br>If I had to compare, they're more like<br>those emotionless [Tech Constructs] we've encountered before.<br><br>[Nanami] What? That can't be right...<br>You mean to say<br>these guys aren't actually human?<br>[Nako] What kind of real humans would charge at us<br>in tens of thousands like this?",
                unlocks: {
                    textlines: [{dialogue: "溪月", lines: ["xy2"]}],
                },
                locks_lines: ["xy1"],
            }),
            "xy2": new Textline({
                is_unlocked: false,
                name: "......",
                text: "[???] Congratulations, congratulations! Outsiders,<br>you've cracked the secret of this place!<br>As your reward, I'll send you somewhere fun —<br>the [Water Prison].<br>[Nanami] You're... the girl we saw before!<br>So it was you deliberately leading us here.<br>[Nako] (Eyes lighting up) This sounds like a pretty incredible place!",
                unlocks: {
                    textlines: [{dialogue: "溪月", lines: ["xy3"]}],
                    locations: ["时封水牢"],
                },
                locks_lines: ["xy2"],
            }),
            "xy3": new Textline({
                is_unlocked: false,
                name: "Sis, sis, wake up......",
                text: "[Nanami] Ugh, Keko...?!<br>Thank goodness you're still here...<br>[Nako] I'm fine... that girl didn't kill us —<br>she just dumped us here...<br>[Xiyue] Welcome, you two cute little ladies.<br>Hehe, I'm still here. Rather than [that girl],<br>you'd do better to call me [Xiyue].",
                unlocks: {
                    textlines: [{dialogue: "溪月", lines: ["xy4"]}],
                },
                locks_lines: ["xy3"],
            }),
            "xy4": new Textline({
                is_unlocked: false,
                name: "Were you the one leading us here? Why would you do that?",
                text: "[Xiyue] All of this is my master's arrangement.<br>Though I never expected<br>the outsiders this time to be quite so adorable, hehe.<br>Ladies, within this Water Prison<br>there are hundreds of Sky Rank powerhouses imprisoned,<br>ranging from Sky Rank Tier 1-2 up to Tier 5-6.<br>The way out is simple —<br>kill every powerhouse in this Water Prison!<br>The exit will open to the last victor standing.",
                unlocks: {
                    textlines: [{dialogue: "溪月", lines: ["xy5"]}],
                },
                locks_lines: ["xy4"],
            }),
            "xy5": new Textline({
                is_unlocked: false,
                name: "(Stunned)",
                text: "[Nako] Only a few hundred?<br>You need 1,120 trillion EXP to break through to Sky Rank Tier 6!<br>That's nowhere near enough!<br><br>[Xiyue] Hehe, there's also a barrier my master set up here.<br>Nurtured by the abundant water elements,<br>this place generates water [Spirits] up to Sky Rank Tier 7.<br>In short,<br>combat experience is more than covered!<br>You can come and go as you please,<br>but Sky Rank Tier 7 enemies aren't available just anywhere!<br>Well, my job here is done.<br>Good luck, and goodbye~",
                unlocks: {
                    textlines: [{dialogue: "溪月", lines: ["xy6"]}],
                },
                locks_lines: ["xy5"],
            }),
            "xy6": new Textline({
                is_unlocked: false,
                name: "Hey, wait!",
                text: "[Nanami] Looks like she's really gone.<br>[Nako] What do we do now, sis...<br>There isn't a single [Spirit] here.<br>[Nanami] Not necessarily.<br>Maybe we can take the initiative and seek out<br>the powerhouses in the Water Prison<br>and try talking to them.<br>[Nako] What, go find them?<br>[Nanami] They might also be troubled by the [Spirit] attacks.<br>Going to help deal with the [Spirits] seems like a win-win.",
                unlocks: {
                    textlines: [{dialogue: "竺虎", lines: ["zh1"]}],
                },
                locks_lines: ["xy6"],
            }),
        }
    });

    

    dialogues["竺虎"] = new Dialogue({
        name: "Zhúhǔ",

        textlines: {
            "zh1": new Textline({
                is_unlocked: false,
                name: "...",
                text: "[Zhuhu] Oh, a new face?<br>Heh, it's been a while since the Water Prison had any newcomers.<br><br>[Nanami] Hello,<br>are you also a powerhouse imprisoned here?<br><br>[Zhuhu] That's right — been locked up here for several hundred years.<br>Oh, that little girl over there —<br>that weapon you're holding. Not bad.",
                unlocks: {
                    textlines: [{dialogue: "竺虎", lines: ["zh2"]}],
                },
                locks_lines: ["zh1"],
            }),
            "zh2": new Textline({
                is_unlocked: false,
                name: "Are you talking to me......?",
                text: "[Zhuhu] Indeed. Tsk tsk —<br>looks like a high-quality psychic weapon.<br>Well then, I'll just help myself to it.",
                unlocks: {
                    textlines: [{dialogue: "竺虎", lines: ["zh3"]}],
                },
                locks_lines: ["zh2"],
            }),
            "zh3": new Textline({
                is_unlocked: false,
                name: "Th-that's not yours to take!",
                text: "[Zhuhu] Hahaha, how naive.<br>Newcomers — you don't know the rules here yet.<br>In this place, might makes right, and killing is an everyday affair.<br>Two at early Sky Rank... Hah?!<br>Is it too late to beg for mercy now?",
                unlocks: {
                    textlines: [{dialogue: "竺虎", lines: ["zh4"]}],
                },
                locks_lines: ["zh3"],
            }),
            "zh4": new Textline({
                is_unlocked: false,
                name: "Just say you want to fight......",
                text: "[Nanami] In that case,<br>no more talking — you die here.<br>(Keko, I'll leave taking this guy down to you!)",
                unlocks: {
                    locations: ["时封水牢 - I"],
                },
                locks_lines: ["zh4"],
            }),
            "zh5": new Textline({
                is_unlocked: false,
                name: "So, who was it that was going to die here?",
                text: "[Zhuhu] Fool! No matter how strong you are,<br>realm limits are realm limits..................<br><br>(A silence like death)",
                unlocks: {
                    textlines: [{dialogue: "竺虎", lines: ["zh6-1"]},{dialogue: "竺虎", lines: ["zh6-2"]}],
                },
                locks_lines: ["zh5"],
            }),
            "zh6-1": new Textline({
                is_unlocked: false,
                name: "Spare",
                text: "[Nako] Since this lady happens to be in a good mood today,<br>you can go~<br><br>[Zhuhu] Then I'll take my leave, honored ladies —",
                unlocks: {
                    textlines: [{dialogue: "竺虎", lines: ["zh7"]}],
                },
                locks_lines: ["zh6-1","zh6-2"],
            }),
            "zh6-2": new Textline({
                is_unlocked: false,
                name: "<span style='color:red'><b>Kill</b></span>",
                text: "[Zhuhu] Mercy——<br><br>(Sound of a moon blade slicing)<br><br>[Nako] Alright, that'll do. Bury him like this.<br>[Nanami] You've grown up...<br><br>Obtained Swamp · Wildland Beast Chunk * 5!<br>Obtained Crystallized Sword (Quality 239%)!<br>Obtained <span class='coin coin_moneyT'>259B</span> <span class='coin coin_moneyB'>346D</span> <span class='coin coin_moneyM'>107Z</span> <span class='coin coin_moneyK'>197X</span> <span class='coin coin_copper'>56C</span>!",
                unlocks: {
                    spec:"kill-zh",
                    textlines: [{dialogue: "竺虎", lines: ["zh7"]}],
                },
                locks_lines: ["zh6-1","zh6-2"],
            }),
            "zh7": new Textline({
                is_unlocked: false,
                name: "Honestly, picking fights when you're clearly outmatched.",
                text: "[Nanami] (Omitting the full Water Prison strength assessment here)<br>Do you remember what you said before,<br>on the alien visitors' spacecraft?<br>[Nako] What did I say?<br>[Nanami] You said that if you could reach Sky Rank Tier 9 inside the spacecraft,<br>the trouble would resolve itself!<br><br>As if struck by a sudden revelation, Nako seemed to realize something, and her eyes lit up.",
                unlocks: {
                    textlines: [{dialogue: "竺虎", lines: ["zh8"]}],
                },
                locks_lines: ["zh7"],
            }),
            "zh8": new Textline({
                is_unlocked: false,
                name: "But sis, level-capping cuts EXP by 80%.",
                text: "[Nanami] That penalty only applies when your strength<br>surpasses everyone else's.<br>And if you've already surpassed everyone else,<br>doesn't the crisis cease to exist?<br><br>[Nako] That's a good point.",
                unlocks: {
                    locations: ["时封水牢 - 1"],
                },
                locks_lines: ["zh8"],
            }),
        }
    });
    
    dialogues["莫尔"] = new Dialogue({
        name: "Mo'er",
        textlines: {
            "mr1": new Textline({
                is_unlocked: false,
                name: "What brings you to us?",
                text: "Don't worry — I have no intention of fighting you.<br>I simply want to seek guidance: just how incredible<br>is the [Domain] that could suppress Zhuhu?",
                unlocks: {
                    textlines: [{dialogue: "莫尔", lines: ["mr2"]}],
                },
                locks_lines: ["mr1"],
            }),
            "mr2": new Textline({
                is_unlocked: false,
                name: "Not interested, and honestly a bit strange.",
                text: "[Nako] You're sitting in a prison, living day to day —<br>and you're still thinking about sparring?...<br><br>[Mo'er] I know the dangers here far better than you do.<br>But compared to growing stronger, what does any of that matter?<br>I can tell you — the few top powerhouses in this Water Prison<br>all have very unusual temperaments.<br>The Strength Ranking Publisher [Lanzhi], the Falling Leaf Blade [Qiuxing] —<br>each one is dozens of times stronger than me.",
                unlocks: {
                    textlines: [{dialogue: "莫尔", lines: ["mr3"]}],
                },
                locks_lines: ["mr2"],
            }),
            "mr3": new Textline({
                is_unlocked: false,
                name: "...",
                text: "[Nanami] So do you think we'd agree?<br>Fighting here brings us no benefit either —<br>it might even attract other powerhouses.<br><br>[Mo'er] Indeed, that's fair —<br>I expected two of your caliber wouldn't agree so easily. However —<br>this isn't a reckless imposition. It's a transaction.",
                unlocks: {
                    textlines: [{dialogue: "莫尔", lines: ["mr4"]}],
                },
                locks_lines: ["mr3"],
            }),
            "mr4": new Textline({
                is_unlocked: false,
                name: "Wait wait — what transaction? What are you talking about?",
                text: "[Mo'er] Little one, that weapon you're holding — it's powerful.<br>I've spent a long time researching psychic weapons,<br>and that moon wheel's structure is at minimum peak Spirit Treasure grade.<br>Even Sky Realm powerhouses would covet it.<br>But you can't yet harness its full power.<br>And I — might be able to help.<br>[Nako] You mean—!<br><br>[Mo'er] If I win, I won't do anything.<br>I only ask to learn from your insights,<br>or hear your thoughts on the way of the Domain.",
                unlocks: {
                    textlines: [{dialogue: "莫尔", lines: ["mr5"]}],
                },
                locks_lines: ["mr4"],
            }),
            "mr5": new Textline({
                is_unlocked: false,
                name: "(Can he really be trusted...)",
                text: "[Mo'er] I know what you're worried about.<br>I swear on the reputation of a Strength Ranker —<br>I will do nothing underhanded.<br>Besides, word of any treachery getting out from here<br>would likely mean ruin and bring disaster upon me.<br><br>[Nako] Fine... I accept. Well then — please, come at me.",
                unlocks: {
                    locations: ["时封水牢 - II"],
                },
                locks_lines: ["mr5"],
            }),
            "mr6": new Textline({
                is_unlocked: false,
                name: "(...)",
                text: "True to his word, Mo'er imparted every insight he had<br>regarding psychic weapons to Nako without reservation.<br>Only now did she realize that within this Water Prison,<br>it wasn't purely a kill-or-be-killed world —<br>powerhouses like Mo'er, single-mindedly devoted to cultivation,<br>were also here in no small number.<br>In their conversation, she felt Mo'er's burning desire to grow stronger —<br>a desire whose value transcended even survival.<br>Soon, the moon wheel made of 216 white crystals<br></br>shone with even more brilliant light in the girl's hands...<br>[Silver Frost Moon Wheel] gained 2.99 Gai EXP!",
                unlocks: {
                    spec:"moonwheel-lv40",
                },
                locks_lines: ["mr6"],
            }),
        }
    });

    dialogues["秋兴"] = new Dialogue({
        name: "Qiuxing",
        textlines: {
            "qx1": new Textline({
                is_unlocked: false,
                name: "(The Falling Leaf Blade...! Ranked third — the Falling Leaf Blade!)",
                text: "[Qiuxing] Aha, I know what you want to say.<br>Actually I noticed your hiding spot long ago.<br>I was just waiting for you to grow —<br>until you were strong enough to face me.",
                unlocks: {
                    textlines: [{dialogue: "秋兴", lines: ["qx2"]}],
                },
                locks_lines: ["qx1"],
            }),
            "qx2": new Textline({
                is_unlocked: false,
                name: "If you want stronger opponents, why are you fixating on us?",
                text: "[Qiuxing] Hahaha —<br>little girl, if you spotted an interesting toy,<br>could you bear to just leave it alone?",
                unlocks: {
                    textlines: [{dialogue: "秋兴", lines: ["qx3-1"]},{dialogue: "秋兴", lines: ["qx3-2"]}],
                },
                locks_lines: ["qx2"],
            }),
            "qx3-1": new Textline({
                is_unlocked: false,
                name: "......By 'interesting toy,' you mean us?",
                text: "[Qiuxing] Clever! That's right — I simply find you fun<br>and want to play with you.<br>Naturally, if you can satisfy me, I'll let you go.<br>My, what pretty little things...<br>Let me have a look.<br><br>Qiuxing reached out a hand,<br>making to touch Nako's cheek.",
                unlocks: {
                    textlines: [{dialogue: "秋兴", lines: ["qx4"]}],
                },
                locks_lines: ["qx3-1","qx3-2"],
            }),
            "qx3-2": new Textline({
                is_unlocked: false,
                name: "(Taking out the Extreme Cold Phase Engine) I've had this just sitting here!",
                text: "[Qiuxing] Hah? (push, pull, push, pull)<br>This is absolutely not a toy!<br>You two are much more fun than this thing.<br>My, what pretty little things...<br>Let me have a look.<br><br>Qiuxing reached out a hand,<br>making to touch Nako's cheek.",
                unlocks: {
                    textlines: [{dialogue: "秋兴", lines: ["qx4"]}],
                },
                locks_lines: ["qx3-1","qx3-2"],
            }),
            "qx4": new Textline({
                is_unlocked: false,
                name: "*Slap*——",
                text: "[Nanami] Scoundrel. Don't touch Keko —<br>or you'd better pray nothing happens to you.<br><br>[Qiuxing] Oh my, quite a temper on this young lady.<br>But can your strength back up that temper?",
                unlocks: {
                    locations: ["时封水牢 - III"],
                },
                locks_lines: ["qx4"],
            }),
            "qx5": new Textline({
                is_unlocked: false,
                name: "You... why did you hold back?",
                text: "[Qiuxing] What? Such a cute little sister —<br>does she absolutely have to fight to the death? Hahaha...<br>(Omitting some plot regarding Water Prison power distribution)<br>(Lanzhi doesn't have overwhelmingly dominant strength,<br>but due to internal conflicts among resisters,<br>resistance against Lanzhi has never succeeded)<br><br>Learned the way of the Domain from Qiuxing!<br>[Water Element Affinity] gained 39.97 million EXP!",
                unlocks: {
                    spec:"realm-III",
                    locations: ["时封水牢 - 5"],
                    textlines: [{dialogue: "秋兴", lines: ["qx6-1"]},{dialogue: "秋兴", lines: ["qx6-2"]},{dialogue: "秋兴", lines: ["qx6-3"]}],
                },
                locks_lines: ["qx5"],
            }),

            "qx6-1": new Textline({
                is_unlocked: false,
                name: "<span style='color:red'><b>Kill</b></span>",
                text: "[Qiuxing] No... please... I'll do anything!<br><br>(Sound of a moon blade slicing)<br><br>[Nako] ...Why am I doing this...<br>[Nanami] ...Keko, you feel like a stranger to me.<br><br><br>Obtained <span class='coin coin_moneyT'>923B</span> <span class='coin coin_moneyB'>124D</span> <span class='coin coin_moneyM'>981Z</span> <span class='coin coin_moneyK'>247X</span> <span class='coin coin_copper'>561C</span>!<br><span style='color:aqua'>Na Clan</span> approval of Nako decreased significantly!",
                unlocks: {
                    spec:"qx-kill",
                },
                locks_lines: ["qx6-1","qx6-2","qx6-3"],
            }),
            "qx6-2": new Textline({
                is_unlocked: false,
                name: "<span style='color:red'><b>Violate</b></span>",
                text: "(Nako crouches down, tilting Qiuxing's chin up)<br>Now who's the cute little sister?<br>Domain Third Layer · Flame Sea Frost Sky · Flame Sea, open!<br>Accompanied by temperatures of 1,280K<br>and the powerful circulation that comes with it,<br>Qiuxing's clothing is instantly torn open in several massive gashes.<br>3 [Ice Seal] crystals extracted from goblins<br>are activated in turn, freezing Qiuxing. With her unable to resist,<br>the 3 crystals land exactly in continuous succession.<br>......<br>......<br>After a full Xuelo day of this,<br>Nako finally kills the goblin<br>and brings Qiuxing back to the cave dwelling.<br><br>Qiuxing developed special feelings for Nako!",
                unlocks: {
                    spec:"qx-sox",
                },
                locks_lines: ["qx6-1","qx6-2","qx6-3"],
            }),
            "qx6-3": new Textline({
                is_unlocked: false,
                name: "<b>Leave</b>",
                text: "[Nako] You can go now~<br>Drop by sometime to chat about the way of the Domain?<br><br>[Qiuxing]",
                unlocks: {
                },
                locks_lines: ["qx6-1","qx6-2","qx6-3"],
            }),
        }
    });


    dialogues["蓝柒"] = new Dialogue({
        name: "Lanzhi",
        textlines: {
            "lq1": new Textline({
                is_unlocked: false,
                name: "(The aura of a powerhouse... so she's really come?)",
                text: "[Lanzhi]......<br><br>[Nanami] You've been watching, haven't you —<br>our battle with Qiuxing.<br>Otherwise you wouldn't have ranked Keko's strength<br>at third on the Strength Ranking —<br>or rather, many of the battles in the Water Prison,<br>you've been watching from the shadows?<br><br>[Lanzhi]......",
                unlocks: {
                    textlines: [{dialogue: "蓝柒", lines: ["lq2"]}],
                },
                locks_lines: ["lq1"],
            }),"lq2": new Textline({
                is_unlocked: false,
                name: "Sis, hold on a moment...",
                text: "[Nanami] Keko, interrupting your big sis at a time like this is annoying...<br><br>[Lanzhi]......<br>Stop growing any stronger.<br>Something terrible will happen.",
                unlocks: {
                    textlines: [{dialogue: "蓝柒", lines: ["lq3"]}],
                },
                locks_lines: ["lq2"],
            }),"lq3": new Textline({
                is_unlocked: false,
                name: "What do you mean...?",
                text: "[Lanzhi] There are special reasons.<br>In any case — stop here. This is a warning——",
                unlocks: {
                    locations: ["时封水牢 - IV"],
                },
                locks_lines: ["lq3"],
            }),"lq4": new Textline({
                is_unlocked: false,
                name: "......",
                text: "[Lanzhi] That's enough — this is my final warning.<br>The way out of this prison isn't what you think it is.<br>Goodbye.<br><br>[Nanami] She's just going to leave like that?<br>This is... not what we expected.",
                unlocks: {
                    textlines: [{dialogue: "蓝柒", lines: ["lq5"]}],
                },
                locks_lines: ["lq4"],
            }),"lq5": new Textline({
                is_unlocked: false,
                name: "Can't figure her out — and Qiuxing earlier didn't seem the warning type either.",
                text: "[Nako] That girl — is she really Lanzhi?<br>Her strength is definitely extraordinary, but she doesn't match the stories.<br>Even... I felt no hostility from her whatsoever.<br><br>[Nanami] More and more questions.<br>Does she mean there's a different way to escape this Water Prison?<br>[Nako] Let's head back, sis.<br>We'll think things over later.",
                unlocks: {
                    items: [{item_name: "传说红宝石"}],
                },
                locks_lines: ["lq5"],
            }),"lq6": new Textline({
                is_unlocked: false,
                name: "......",
                text: "[Lanzhi] You are strong...<br>but to break free...<br>still not enough......",
                unlocks: {
                    textlines: [{dialogue: "蓝柒", lines: ["lq7"]}],
                },
                locks_lines: ["lq6"],
            }),"lq7": new Textline({
                is_unlocked: false,
                name: "May I ask you something?",
                text: "[Nanami] When you saw us approach —<br>why did you react so... out of composure?<br><br>[Lanzhi] I'd rather not answer that...<br>Maybe... you'll understand soon enough.<br>But I can no longer help you.<br>",
                unlocks: {
                    locations: ["水牢走廊"],
                    textlines: [{dialogue: "蓝柒", lines: ["lq8-1"]},{dialogue: "蓝柒", lines: ["lq8-2"]},{dialogue: "蓝柒", lines: ["lq8-3"]}],
                },
                locks_lines: ["lq7"],
            }),
            "lq8-1": new Textline({
                is_unlocked: false,
                name: "<span style='color:red'><b>Kill</b></span>",
                text: "[Lanzhi] If... this is the Water Prison in your hearts...<br><br>(Sound of a moon blade slicing)<br><br>[Nako] Someone important... a reliable senior...<br>when did I become like this?<br>[Nanami] ...Keko, don't kill me, I'm scared...<br><br><br>Obtained <span class='coin coin_moneyQa'>5U</span> <span class='coin coin_moneyT'>810B</span> <span class='coin coin_moneyB'>358D</span> <span class='coin coin_moneyM'>643Z</span> <span class='coin coin_moneyK'>364X</span> <span class='coin coin_copper'>656C</span>!<br><span style='color:aqua'>Na Clan</span> approval of Nako decreased significantly!",
                unlocks: {
                    spec:"lq-kill",
                },
                locks_lines: ["lq8-1","lq8-2","lq8-3"],
            }),
            "lq8-2": new Textline({
                is_unlocked: false,
                name: "<span style='color:red'><b>Violate</b></span>",
                text: "Lanzhi had long been a figure shrouded in mystery in Nako's mind.<br>Taking this chance, she decided to bring Lanzhi back to the cave dwelling<br>for a thorough 'interrogation' to get to the bottom of things.<br>[Nako] Underground Palace Berserk Potion~ Ruins Berserk Potion~<br>Don't even think about recovering strength to resist me~<br>[Lanzhi] You're strong... but... still not enough...<br>[Nako] That's enough, is Domain Tier 4 really necessary?<br>(Nako takes out a bucket of otherworld elixir and drains it!)<br><br>Under multipliers that kept rising each round,<br>Lanzhi ultimately couldn't withstand Nako's 'assault.'<br><br>Lanzhi developed special feelings for Nako!",
                unlocks: {
                    spec:"lq-sox",
                },
                locks_lines: ["lq8-1","lq8-2","lq8-3"],
            }),
            "lq8-3": new Textline({
                is_unlocked: false,
                name: "<b>Leave</b>",
                text: "If you want to move forward, then go —<br>may the great immortal spirits bless you.",
                unlocks: {
                },
                locks_lines: ["lq8-1","lq8-2","lq8-3"],
            }),
        }
    });


    dialogues["溪月 II"] = new Dialogue({
        name: "Xiyue II",
        starting_text: "Talk with the pink-haired girl in the corridor",
        textlines: {
            "xy7": new Textline({
                is_unlocked: true,
                name: "...",
                text: "Congratulations, congratulations — you passed!",
                unlocks: {
                    textlines: [{dialogue: "溪月 II", lines: ["xy8"]}],
                },
                locks_lines: ["xy7"],
            }),
            "xy8": new Textline({
                is_unlocked: false,
                name: "Passed...? You're that girl from the glacier before.",
                text: "[Nanami] Does this count as us passing?<br>We didn't wipe out all the powerhouses in the Water Prison.<br><br>[Xiyue] Killing each other isn't the only way to pass —<br>if you reach Domain Tier 3, this passage will open for you naturally.<br>Feeling confused?<br>Don't worry, you'll understand soon enough.",
                unlocks: {
                    textlines: [{dialogue: "溪月 II", lines: ["xy9"]}],
                },
                locks_lines: ["xy8"],
            }),
            "xy9": new Textline({
                is_unlocked: false,
                name: "Could you tell us what this place really is..?",
                text: "[Xiyue] Mm-hm, sure, of course!<br>This is a barrier constructed by its master —<br>they say it's been around for a million years. Pretty impressive, right?",
                unlocks: {
                    textlines: [{dialogue: "溪月 II", lines: ["xy10"]}],
                },
                locks_lines: ["xy9"],
            }),
            "xy10": new Textline({
                is_unlocked: false,
                name: "Wait — the master?",
                text: "[Xiyue] As you know, the powerhouses imprisoned here<br>can't get out...<br>but as long as they don't break the rules of this place,<br>they can live safely for many years<br>and push their strength to astonishing levels.<br><br>Of course, cultivation resources are scarce in the Water Prison.<br>A powerhouse who might have broken through to Sky Rank Tier 9<br>can only polish themselves here to Sky Rank Tier 6 [IV],<br>with the strength to rival someone newly at Sky Rank Tier 8.<br><br>[PS/Setting Note]<br>Unless otherwise stated, 2+ corresponds to 1 minor tier.<br>To avoid realm notation getting overly complex,<br>3+ and above will be shown as Roman numerals.",
                unlocks: {
                    textlines: [{dialogue: "溪月 II", lines: ["xy11"]}],
                },
                locks_lines: ["xy10"],
            }),
            "xy11": new Textline({
                is_unlocked: false,
                name: "But... do you know how many people have died here in all that time?",
                text: "[Xiyue] My, what a naive child.<br>It's hard to say, but let me explain.<br>To cultivate powerful fighters, sacrifices like these are inevitable.<br>Amid the slaughter of several hundred Sky Rank experts,<br>if even one Yunxiao-grade expert is born —<br>that Yunxiao-grade expert's value<br>exceeds, let me think...<br>Depending on their tier,<br>the combined value of 10,000 to 3.1 billion first-tier Sky Rank experts!<br><br>When all's said and done, only 30,000 Sky Rank experts have died here in a million years!<br>Look at the kill counter in the top right —<br>what right do you have to criticize the master here?!",
                unlocks: {
                    textlines: [{dialogue: "溪月 II", lines: ["xy12"]}],
                },
                locks_lines: ["xy11"],
            }),
            "xy12": new Textline({
                is_unlocked: false,
                name: "So — what are we, having won, supposed to do now?",
                text: "[Xiyue] You've already earned the right to receive the inheritance!<br>Next, I'll take you to meet the master.<br>Once you enter the Heritage Illusory Realm, how much insight and cultivation wisdom you gain<br>is entirely up to you.<br><br>[Nako] I... can't accept this.<br>[Nanami] ...Keko, let's follow along.",
                unlocks: {
                    textlines: [{dialogue: "溪月 II", lines: ["xy13"]}],
                },
                locks_lines: ["xy12"],
            }),
            "xy13": new Textline({
                is_unlocked: false,
                name: "No, I didn't mean that...",
                text: "[Nako] 10,000 to 3.1 billion first-tier Sky Rank experts combined!<br>If I could cultivate some Yunxiao-grade fighters,<br>I'd definitely have a steady stream of <span class='coin coin_moneyT'>treasure coins</span> and <span class='coin coin_moneyQa'>cosmic coins</span> flowing in...<br>Once I receive this inheritance, it's time to unify the clan!<br>I feel like I already have what it takes to challenge Father now.<br>(Sky Rank Peak [-4], you old fossil!<br>Your era is over!)",
                unlocks: {
                    textlines: [{dialogue: "溪月 II", lines: ["xy14"]}],
                },
                locks_lines: ["xy13"],
            }),
            "xy14": new Textline({
                is_unlocked: false,
                name: "(Shakes it off) Let's pull ourselves together...",
                text: "[???] Young girl, to have made it here —<br>what courage, what audacity.<br>[Zuo'a] First, a self-introduction.<br>Former Yangang Hunting Ground, Huntian Gate — Deputy Master Zuo'a.<br>[Nanami] Zuo'a?! You're...<br>the senior recorded in the Yangang Hunting Ground history books?!<br>[Zuo'a] Haha, indeed. So many years later,<br>and juniors still know my name —<br>it seems I haven't been entirely forgotten by the world.",
                unlocks: {
                    textlines: [{dialogue: "溪月 II", lines: ["xy15"]}],
                },
                locks_lines: ["xy14"],
            }),
            "xy15": new Textline({
                is_unlocked: false,
                name: "(Sis... I never read those history books. Who is he?)",
                text: "[Nanami] A senior figure from roughly 100,000 years ago...<br>Who clashed with the Gate Master and destroyed the once-glorious [Huntian Gate].<br>[Zuo'a] Heh heh — whispering can't hide from my senses in here.<br>I was born into a family of outer-sect disciples,<br>with average talent — unremarkable to anyone.<br>Later, I awakened the Innate Primordial Spirit Body<br>and suddenly shot forward, rising to the top of the sect.<br><br>[Nako] Huh? How can the Innate Primordial Spirit Body awaken after birth?<br>[Zuo'a] Ahem... in any case, the Gate Master tried to seize my body!<br>I, at the peak of Yunxiao-grade,<br>perished together with him.<br>But in the instant of my death, I stepped into the Domain-level realm.",
                unlocks: {
                    textlines: [{dialogue: "溪月 II", lines: ["xy16"]}],
                },
                locks_lines: ["xy15"],
            }),
            "xy16": new Textline({
                is_unlocked: false,
                name: "Phew...",
                text: "[Zuo'a] And so it ended up like this —<br>living inside this barrier in a twisted form.<br>Since you've taken such great risks to come here<br>and passed through the many trials I laid out,<br>I can't very well let you leave empty-handed.<br>[Zuo'a] Now, open your hearts and minds,<br>enter the Heritage Illusory Realm, and receive my inheritance.<br>I'll only be responsible for sending you in —<br>how much insight you gain is up to your own fate.<br>Remember — the inheritance is a gift only for those destined for it...<br>I've been occupying Xiyue's dialogue box long enough;<br>time for me to rest.",
                unlocks: {
                    textlines: [{dialogue: "溪月 II", lines: ["xy17"]}],
                },
                locks_lines: ["xy16"],
            }),
            "xy17": new Textline({
                is_unlocked: false,
                name: "(Eyes lighting up)",
                text: "As Zuo'a's words fell,<br>a white light appeared before Nako and Nanami,<br>as if trying to pull the souls from their bodies.<br>The white light persisted for a moment, then, at the center of this space,<br>a massive vortex formed.<br><br>Faintly, colorful radiance reflected within the vortex.<br>As the light within the vortex grew brighter and brighter,<br>Nako was finally able to make out everything around her,<br>and she slowly opened her eyes.<br><br>Entering the Heritage Illusory Realm, Nanami... eh, we won't charge her for this one.<br>I mean, you probably already have a Glacier Heart anyway...",
                unlocks: {
                    locations: ["传承幻境"],
                },
                locks_lines: ["xy17"],
            }),


        }
    });

    dialogues["传承水晶"] = new Dialogue({
        name: "Heritage Crystal",
        starting_text: "Touch the glowing crystal",
        textlines: {
            "sj1": new Textline({
                is_unlocked: false,
                name: "(Touch)",
                text: "[Nako] Just as I thought — these crystals<br>hold Senior Zuo'a's insights!<br>Such tremendous power...<br>but laced with an intense aura of violence.<br>What exactly did Senior Zuo'a go through in the past?<br>I need to keep my mind calm and focused...<br>Well, who am I to judge.",
                unlocks: {
                    textlines: [{dialogue: "传承水晶", lines: ["sj2"]}],
                },
                locks_lines: ["sj1"],
            }),
            "sj2": new Textline({
                is_unlocked: false,
                name: "(Close eyes)",
                text: "[Nako] ...Just a brief touch,<br>and many parts of the secret art that hadn't clicked before<br>suddenly became clear.<br>This secret art was a gift from Brother Feng —<br>its true potential really is something else.<br>(Internal monologue: it does have a cap of level 50, after all!)<br>I'm a little excited — how strong will it be after it fully evolves?<br><br>Gained insight into a new secret art<span style='color:aqua'> [Stargazing Purple Jade]</span>!<br>Please equip it in the equipment slots.",
                unlocks: {
                    items: [{item_name: "映星紫华",quality:200}],
                },
                locks_lines: ["sj2"],
            }),

        }
    });

    dialogues["纳娜米?"] = new Dialogue({
        name: "Nanami?",
        starting_text: "The sis from the underground palace... is it really her?",
        textlines: {
            "hx1": new Textline({
                is_unlocked: false,
                name: "Huh, sis... what did you say?",
                text: "[Nanami] Keko! You're finally awake!<br>You wore yourself out fighting the monsters in the underground palace<br>and passed out.<br>But don't worry — the monsters in this area<br>have already been cleared out by your sis,<br>your sis will protect you.",
                unlocks: {
                    textlines: [{dialogue: "纳娜米?", lines: ["hx2"]}],
                },
                locks_lines: ["hx1"],
            }),
            "hx2": new Textline({
                is_unlocked: false,
                name: "Sis, while I was passed out just now...",
                text: "[Nako] You were... clearing the monsters in this area, right?<br><br>[Nanami?] That's right, don't you worry.<br>With sis here, these things are nothing...",
                unlocks: {
                    textlines: [{dialogue: "纳娜米?", lines: ["hx3"]}],
                },
                locks_lines: ["hx2"],
            }),
            "hx3": new Textline({
                is_unlocked: false,
                name: "You... you're not sis!",
                text: "[Nako] Before we entered the Illusory Realm,<br>sis was only Sky Rank Tier 6!<br>How could she possibly beat Tier 8-9 enemies?<br><br>[Nanami?]................<br><br>[Nako] Are you listening? I finally understand —<br>everything I'm seeing right now is an illusion,<br>not some kind of time reversal.<br>Just who are you?",
                unlocks: {
                    textlines: [{dialogue: "纳娜米?", lines: ["hx4"]}],
                },
                locks_lines: ["hx3"],
            }),
            "hx4": new Textline({
                is_unlocked: false,
                name: "Just who are you?",
                text: "[Nako] You're the heart demon lurking in my mind! Aren't you?!<br><br><del>[Nanami?]</del>[Miaogula]<br>Congratulations — wrong answer! I am<br>a fuzzy little creature wearing the same color clothes as your sis!<br>I'm nothing like that idiot heart demon who goes around using mind control tricks!",
                unlocks: {
                    locations: ["幻境核心 - I"],
                },
                locks_lines: ["hx4"],
            }),

        }
    });
    
    dialogues["纳鹰?"] = new Dialogue({
        name: "Naying?",
        starting_text: "The Ancestor from the barrier lake... it has to be a fake!",
        textlines: {
            "hx5": new Textline({
                is_unlocked: false,
                name: "Senior Naying... no, you're not the Senior!",
                text: "[Naying?] Oh ho ho, looks like there's been a little incident.<br>Little girl, don't be hasty.<br>You absorbed a great deal of knowledge all at once,<br>which was bound to cause a brief hyperactive period in your spiritual sense,<br>conjuring up all sorts of illusions that don't exist.<br>",
                unlocks: {
                    textlines: [{dialogue: "纳鹰?", lines: ["hx6"]}],
                },
                locks_lines: ["hx5"],
            }),
            "hx6": new Textline({
                is_unlocked: false,
                name: "Illusions? What... what are you talking about...?",
                text: "[Naying?] Listen, little girl —<br>cast aside those jumbled thoughts in your head.<br>I will pass on to you my own insights regarding the Domain,<br>which may influence the path you walk from here on.<br>In the future, you might even come to possess a Domain——",
                unlocks: {
                    textlines: [{dialogue: "纳鹰?", lines: ["hx7"]}],
                },
                locks_lines: ["hx6"],
            }),
            "hx7": new Textline({
                is_unlocked: false,
                name: "My... my Domain?",
                text: "[Nako] Listen here, old-timer! I do have a Domain,<br>— and it's Domain Tier 3 Peak!<br>[Naying?] ...... (disperses)<br>[Nako] Phew... this one's true form was a heart demon,<br>which spared me a tough fight.<br>I feel like I understand heart demons one layer deeper now.<br>At this rate,<br>I wonder if I can push even further...",
                unlocks: {
                    locations: ["幻境核心·战场"],
                },
                locks_lines: ["hx7"],
            }),
        }
    });
    


    dialogues["烈日神像"] = new Dialogue({
        name: "Lierix Statue",
        starting_text: "Pray at the Lierix Statue in the Illusory Realm Battlefield",
        textlines: {
            "lr1": new Textline({
                is_unlocked: true,
                name: "(Give a not-particularly-reverent little bow)",
                text: "[Lierix Projection]<br>Ahem... my brother Jiaoyue has told me about you.<br>Anyway, this statue is made of better material!<br>Though it takes more than just dao coins — it also requires some cosmic coins...<br>In return, you can receive Lierix's blessings!<br>They're stronger than the previous buffs!<br><br>By the way, the rules for Vitality and the money bonuses are the same as before.<br><br>Cultivators above <span class='realm_cloudy'>Yunxiao Tier 4</span> needn't bother —<br>this mid-tier statue can't sustain the projection of too powerful a force.<br>Also, a reminder — the blessing content rotates every 22.5 hours.<br>Given <span class='realm_cloudy'>Yunxiao-grade</span>'s time flow of 4.8h/s,<br>it's not recommended to check the blessings on the spot; use the reference chart instead.",
                unlocks: {
                    textlines: [{dialogue: "烈日神像", lines: ["lr2"]},{dialogue: "烈日神像", lines: ["lr3"]}],
                },
                locks_lines: ["lr1"],
            }),
            "lr2": new Textline({
                is_unlocked: false,
                name: "(Check current blessing and cost info)",
                text: "",
                unlocks: {
                    spec: "LR-check",
                },
            }),
            "lr3": new Textline({
                is_unlocked: false,
                name: "(Offer dao coins to receive a blessing)",
                text: "",
                unlocks: {
                    spec: "LR-sacrifice",
                },
            }),
        }
    });

    dialogues["末世天骄"] = new Dialogue({
        name: "Apocalyptic Prodigy",
        starting_text: "Speak with the resentment collective",
        textlines: {
            "hx8": new Textline({
                is_unlocked: true,
                name: "(Approach)",
                text: "[???] I refuse to accept this! I refuse!<br>This genius lived brilliantly, overcame every hardship, conquered the Prodigy War —<br>only to fall in some trivial trial mission!<br><br>[Nako] Such overwhelming resentment — and from someone I've never seen before.<br>Could it be... the owner of this ship?<br>That is, the celestial visitor<br>who perished here.",
                unlocks: {
                    textlines: [{dialogue: "末世天骄", lines: ["hx9"]}],
                },
                locks_lines: ["hx8"],
            }),
            "hx9": new Textline({
                is_unlocked: false,
                name: "I see...",
                text: "[Nako] During the time I was sealed inside the ship,<br>his resentment latched onto the depths of my heart —<br>and for so long, I never even noticed...<br>[???] Kill — kill you all!<br>Anyone who dares block this genius's path to greatness<br>is nothing but a bunch of ignorant savages——<br>[Nako] So... you really can't accept it, can you.<br>The ones you call savages —<br>those inhabitants of the Xuelo Continent who died at your hands —<br>didn't they want to live too?<br>Your senseless slaughter of low-ranked Xuelo residents<br>was clearly of no benefit to you whatsoever —<br>nothing but an outlet for your rage!<br><br>Do you think a true prodigy, facing death...",
                unlocks: {
                    textlines: [{dialogue: "末世天骄", lines: ["hx10"]}],
                },
                locks_lines: ["hx9"],
            }),
            "hx10": new Textline({
                is_unlocked: false,
                name: "Would break down hysterically like you?",
                text: "[???] You... I...<br>Aaaaahhhhh——<br><br>The celestial visitor suddenly fell silent,<br>as if completely calming down.<br>His gaze became still and unreadable.<br>Then, all at once, the resentment swirling around began to boil,<br>and the celestial visitor let out a villainous laugh.<br><br>[???] Heh heh heh...<br>When the reactor melted down,<br>did you ever wonder why the radiation cleared so quickly?<br>That was all because — this genius!<br>This genius has already recovered to half-step Yunxiao-grade!",
                unlocks: {
                    locations: ["幻境核心 - 歧路"],
                },
                locks_lines: ["hx10"],
            }),
        }
    });

    dialogues["十连扭蛋机"] = new Dialogue({
        name: "10-Pull Gacha Machine",
        starting_text: "Use the [10-Pull Gacha Machine]",
        textlines: {
            "nd1": new Textline({
                is_unlocked: false,
                name: "Gacha Machine Introduction",
                text: "Use <img src='image/item/inherit_pink.png'>Heritage Crystal · Pink to draw!<br>10 per single pull, 90 per 10-pull!",
                unlocks: {
                    textlines: [{dialogue: "十连扭蛋机", lines: ["nd2"]},{dialogue: "十连扭蛋机", lines: ["nd3"]}],
                },
                locks_lines: ["nd1"],
            }),
            "nd2": new Textline({
                is_unlocked: false,
                name: "Single Pull (10 x <img src='image/item/inherit_pink.png'>Heritage Crystal · Pink)",
                text: "",
                unlocks: {
                    spec:"gacha-1",
                },
            }),
            "nd3": new Textline({
                is_unlocked: false,
                name: "10-Pull (90 x <img src='image/item/inherit_pink.png'>Heritage Crystal · Pink)",
                text: "",
                unlocks: {
                    spec:"gacha-10",
                    textlines: [{dialogue: "十连扭蛋机", lines: ["nd4"]}],
                },
            }),
            "nd4": new Textline({
                is_unlocked: false,
                name: "50-Pull (450 x <img src='image/item/inherit_pink.png'>Heritage Crystal · Pink)",
                text: "",
                unlocks: {
                    spec:"gacha-50",
                },
            }),

            "by": new Textline({
                is_unlocked: true,
                name: "Convert <img src='image/item/iceland_heart.png'>Glacier Heart (Glacier Heart must be in equipment slot)",
                text: "",
                unlocks: {
                    spec:"byzx",
                },
            }),
        }
    });


    dialogues["心魔之主"] = new Dialogue({
        name: "Heart Demon Lord",
        starting_text: "Talk with Brother Feng (?)",
        textlines: {
            "xm1": new Textline({
                is_unlocked: false,
                name: "Feng... Brother Feng.",
                text: "[Feng] Keko.<br>I'm surprised — you managed to clear four layers of the Illusory Realm<br>and make it here. But this is as far as you go.",
                unlocks: {
                    textlines: [{dialogue: "心魔之主", lines: ["xm2"]}],
                },
                locks_lines: ["xm1"],
            }),
            "xm2": new Textline({
                is_unlocked: false,
                name: "Huh...?",
                text: "[Feng] The truth is, all these years,<br>I've been watching you clear<br>the glacier, the Water Prison, four layers of the Illusory Realm.<br>I've been watching you grow all along.<br><br>I even hid inside that gacha machine —<br>though unless it was a one-in-a-trillion miracle,<br>you probably never would have noticed.<br><br>Your performance has impressed me,<br>so you've earned the right —<br>to become my soul slave.",
                unlocks: {
                    textlines: [{dialogue: "心魔之主", lines: ["xm3"]}],
                },
                locks_lines: ["xm2"],
            }),
            "xm3": new Textline({
                is_unlocked: false,
                name: "I... I don't understand.",
                text: "[Feng] Even after all that, you still don't get it?<br>The truth is, I've been watching you for a long time —<br>watching a certain quality you possess.<br>I knew every plan the Hundred Families and Thirteen Axes had,<br>so I used them to get close to you,<br>and quietly left a deep mark in your heart.",
                unlocks: {
                    textlines: [{dialogue: "心魔之主", lines: ["xm4"]}],
                },
                locks_lines: ["xm3"],
            }),
            "xm4": new Textline({
                is_unlocked: false,
                name: "A mark? All I remember is... <span class='coin coin_moneySp'>1.21Δ</span>.",
                text: "[Feng] ...After all this, you're still thinking about money?!<br>Come now, open your heart and mind.<br>I will protect you, help you become a true powerhouse,<br>and together we'll traverse the vast world.<br><br>[Nako] And if I say no?<br>You're lying — in every sense of the word.<br>When Brother Feng was traveling with me,<br>I snuck a peek at his stat panel.<br>Do you really think your level is enough<br>to replicate the pressure of <b><span style='color:#00fa9a'>Hundred-Line Flow</span> <span style='color:#edec9f'>Golden Void Law</span><br><span style='color:lime'>4.489 Gai</span> <span style='color:red'>167.24 Jing</span> <span style='color:blue'>86.49 Jing</span></b>?",
                unlocks: {
                    textlines: [{dialogue: "心魔之主", lines: ["xm5"]}],
                },
                locks_lines: ["xm4"],
            }),
            "xm5": new Textline({
                is_unlocked: false,
                name: "The lies you're making up are embarrassingly amateur.",
                text: "(Feng's form shifts to ???)<br>[???] Absolute nonsense!<br>If you're going to fake stats, at least fake Agility too!<br>This is an RPG world!<br><br><span class='message_sayuki'>[Shaxue] Oh?<br>I unexpectedly just remembered something I'd forgotten.<br>I have you to thank for that.</span><br>[Nako] Even after meeting the City Lord and Senior Zuo'a —<br>two Domain-level powerhouses — standing before them<br>never felt as unfathomable as standing before Feng...<br>So, having seen the perspective of a truly powerful person...",
                unlocks: {
                    textlines: [{dialogue: "心魔之主", lines: ["xm6"]}],
                },
                locks_lines: ["xm5"],
            }),
            "xm6": new Textline({
                is_unlocked: false,
                name: "Words alone won't shake me.",
                text: "[Heart Demon Lord] You've earned the right to know my identity.<br>I am — the Heart Demon Lord.<br>The source of every fear within your heart,<br>the root of every negative emotion.",
                unlocks: {
                    textlines: [{dialogue: "心魔之主", lines: ["xm7"]}],
                },
                locks_lines: ["xm6"],
            }),
            "xm7": new Textline({
                is_unlocked: false,
                name: "Every fear? Have you looked at your skill bar?",
                text: "[Heart Demon Lord] You've earned the right to know my identity.<br>I am — the Heart Demon Lord.<br>The source of every fear within your heart,<br>the root of every negative emotion.<br>Skills? Fine, take a look!<br>",
                unlocks: {
                    spec:"heartdemon-lord",
                    locations:["幻境核心 - IV"]
                },
                locks_lines: ["xm7"],
            }),
        }
    });


    dialogues["溪月(核心)"] = new Dialogue({
        name: "Xiyue (Core)",
        starting_text: "Talk with the pink-haired girl [Xiyue]",
        textlines: {
            "hx11_1": new Textline({
                is_unlocked: true,
                name: "(Open eyes)",
                text: "[Xiyue] Welcome to the deepest layer of the Illusory Realm Core —<br>Illusory Realm Core · Present World.<br>Don't look around — you won't find me.<br>I'm deep within your mindspace, communicating through thought alone.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx12"]}],
                },
                locks_lines: ["hx11_1"],
            }),
            "hx12": new Textline({
                is_unlocked: false,
                name: "Miss Xiyue, why are you here?",
                text: "[Nako] Also — what's going on with this Illusory Realm,<br>and Senior Zuo'a, he——<br><br>[Xiyue] Don't call that guy 'Senior' in here, ugh.<br>Right now he's busy trying to erase the soul marks on you —<br>too preoccupied to notice, which gave me a chance to slip in.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx13"]}],
                },
                locks_lines: ["hx12"],
            }),
            "hx13": new Textline({
                is_unlocked: false,
                name: "Huh?",
                text: "[Xiyue] I'll keep it short —<br>not that it matters; thought-transmission is fast.<br>This won't take much of your time.<br>First — do you remember the 'Strength Ranking' from the Water Prison?<br>Yes, I mean the spot that's been sitting empty at number one.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx14"]}],
                },
                locks_lines: ["hx13"],
            }),
            "hx14": new Textline({
                is_unlocked: false,
                name: "Why bring that up out of nowhere.",
                text: "[Nako] Intel says that for hundreds of years,<br>the number one spot has been left empty by Lanzhi.<br><br>[Xiyue] Heh heh... of course it's empty,<br>because number one already left the Water Prison<br>and went over to the master of this barrier.<br>'Went over' is a stretch — it was more like going undercover beside Zuo'a,<br>who happened to find some use in them<br>and so accepted them in —<br>and along the way, gathered a great deal of intelligence.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx15"]}],
                },
                locks_lines: ["hx14"],
            }),
            "hx15": new Textline({
                is_unlocked: false,
                name: "The former number one on the Strength Ranking... that's you?!",
                text: "[Xiyue] Clever, clever! As expected,<br>talking to a smart kid is such a pleasure.<br>Little Blue is just as smart as you,<br>but unfortunately she doesn't like talking.<br>Back in the Water Prison, she... ah, I'm getting sidetracked.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx16"]}],
                },
                locks_lines: ["hx15"],
            }),
            "hx16": new Textline({
                is_unlocked: false,
                name: "You mean [Lanzhi].",
                text: "[Nako] ...When I was leaving the Water Prison,<br>she said some things that were only half-clear to me.<br><br>[Xiyue] Ah, I can probably guess what she said.<br>The reason she wasn't more direct<br>wasn't that she didn't want to — she couldn't.<br>The entire Water Prison is under [Zuo'a]'s surveillance.<br>When conveying any message, one wrong move,<br>one hint of suspicion from him, and it could mean death!",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx17"]}],
                },
                locks_lines: ["hx16"],
            }),
            "hx17": new Textline({
                is_unlocked: false,
                name: "Just what kind of person is Zuo'a?",
                text: "[Xiyue] He is a <span class='realm_realm'>Domain-level</span> powerhouse —<br>and a complete and utter... madman.<br><br>[Nako] Then, those precious inheritances...<br>don't tell me——<br><br>[Xiyue] All an illusion. On the surface he seems to be selecting talented cultivators to receive an inheritance,<br>but in reality, he just wants to use them to rebuild his body —<br>to forge a 'vessel' that can contain his soul!<br>As far as I know, every powerhouse who leaves the Water Prison,<br>no matter the method,<br>has ended up without exception<br>as part of that vessel.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx18"]}],
                },
                locks_lines: ["hx17"],
            }),
            "hx18": new Textline({
                is_unlocked: false,
                name: "What——!",
                text: "[Xiyue] The minimum standard to become a vessel is...<br>a living person with high-tier Sky Rank strength.<br>If you have Domain Tier 3,<br>you've undoubtedly met that threshold as well.<br>The exit of the Water Prison, once you meet the standard,<br>will summon the powerhouses to walk out —<br>and they naturally, inevitably become part of the vessel.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx19"]}],
                },
                locks_lines: ["hx18"],
            }),
            "hx19": new Textline({
                is_unlocked: false,
                name: "Then what's this about killing all the other powerhouses?",
                text: "[Xiyue] That was just a front...<br>Life-and-death battles are always the catalyst that forges powerhouses.<br>Historically, no one has ever killed every powerhouse in the Water Prison.<br>Because... outsiders who stumble into this secret realm<br>keep flowing in almost endlessly.<br>The only fates for these powerhouses are to be killed by others,<br>to die of old age, or to become part of the vessel.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx20"]}],
                },
                locks_lines: ["hx19"],
            }),
            "hx20": new Textline({
                is_unlocked: false,
                name: "'Life-and-death battles are always the catalyst that forges powerhouses'",
                text: "[Nako] 'A single powerhouse born from ten thousand weaklings<br>is worth more to the group than all ten thousand weaklings combined'<br>...Fine, I get it.<br>When does your HP bar appear?<br>(Red and blue light flickers in her eyes)<br><br>[Xiyue] Heh heh...<br>The way this girl reacts —<br>she's clearly met too many lunatics.<br>Unfortunately Shaxue didn't give me any stat boosts,<br>so all I can give you is the intelligence I have!",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx21"]}],
                },
                locks_lines: ["hx20"],
            }),
            "hx21": new Textline({
                is_unlocked: false,
                name: "(Receive intel pt1)",
                text: "Zuo'a — an utterly insignificant nobody.<br>Among the overflowing talent of the Huntian Gate,<br>he went unnoticed with his mediocre aptitude,<br>pushed aside by fellow disciples, subjected to endless cold looks.<br>In this world full of competition and killing,<br>the weak could only ever live at the very bottom.<br>He pushed himself desperately, but his cultivation talent was simply too poor to change anything.<br>Then one day, he encountered a fellow disciple with true genius.<br>The two hit it off wonderfully, and in a moment of good spirits, drank a few too many cups.<br>From that drunken night — one of them never woke up again.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx22"]}],
                },
                locks_lines: ["hx21"],
            }), 
            "hx22": new Textline({
                is_unlocked: false,
                name: "(Receive intel pt2)",
                text: "In everyone's eyes, he had abandoned his ambitions,<br>spending his days socializing and drinking.<br>Over time, he managed to befriend a few people of standing.<br>At last, he could hold his head up in front of his fellow disciples —<br>but what no one could have imagined<br>was that this was merely the first step of his grand plan.<br>On that day, the sect's upper echelon<br>found his martial brother's corpse in the Beast Forest.<br>Beside the body were several Sky Rank beasts.<br>He had clearly just survived a fierce battle,<br>covered in blood, his face smeared with mud and ash.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx23"]}],
                },
                locks_lines: ["hx22"],
            }),
            "hx23": new Textline({
                is_unlocked: false,
                name: "(Receive intel pt3)",
                text: "After that, Zuo'a became despondent,<br>as if his martial brother's death had hit him hard.<br>He stopped drinking and socializing, instead spending every day immersed in the cultivation chamber.<br>His cultivation began to climb steadily from that point on.<br>Everyone assumed the shock had suddenly awakened him,<br>and they all began to see him in a different light.<br>The Gate Master was especially thrilled,<br>and immediately appointed him Deputy Master on the spot —<br>the future successor of the Huntian Gate!<br><br>[Xiyue] Mm. That's how it went.<br>This should have been an inspirational story...<br>But, little girl — have you spotted the inconsistency?",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx24"]}],
                },
                locks_lines: ["hx23"],
            }),
            "hx24": new Textline({
                is_unlocked: false,
                name: "The circumstances of that martial brother's death are suspicious——",
                text: "[Xiyue] Correct! Later,<br>the Huntian Gate's master also noticed something was wrong<br>and ordered a thorough investigation——<br>",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx25"]}],
                },
                locks_lines: ["hx24"],
            }),
            "hx25": new Textline({
                is_unlocked: false,
                name: "(Receive intel pt4)",
                text: "After Zuo'a rose to a position of power,<br>his nature became more brazen and unrestrained.<br>Because his virtue didn't match his position, those who resented him grew in number.<br>You can't wrap a fire in paper——<br>the matter of the fallen martial brother was brought up again,<br>and many disciples confronted Zuo'a,<br>analyzing the many suspicious details of the affair.<br>The Gate Master was a Domain-level powerhouse —<br>illusions that ordinary people couldn't see through<br>were completely transparent to his eyes,<br>and before long, clues kept being gathered.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx26"]}],
                },
                locks_lines: ["hx25"],
            }),
            "hx26": new Textline({
                is_unlocked: false,
                name: "(Receive intel pt5)",
                text: "When the truth came to light and everyone awakened to the reality —<br>that the martial brother truly had been killed by Zuo'a,<br>and that his Innate Primordial Spirit Body had been seized and taken over by Zuo'a —<br>it was already too late. Everyone discovered in horror<br>that Zuo'a had been exploiting his position as Deputy Master<br>to train for years within the sect's supreme treasure —<br>the [Hall of Time].<br>His true cultivation had long since surpassed his surface level by an unknown margin!<br>When the false mask was torn away,<br>in merely a hundred-some years,<br>he had already cultivated to Yunxiao Tier 9!",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx27"]}],
                },
                locks_lines: ["hx26"],
            }),
            "hx27": new Textline({
                is_unlocked: false,
                name: "(Receive intel pt6)",
                text: "Zuo'a swept a cold gaze across the crowd,<br>and with his ruthless and brutal nature, he struck first.<br>The Gate Master moved to stop him, only to discover that the Zuo'a before him was merely a phantom.<br>His true body, under the guise of Deputy Master,<br>had already moved unobstructed from one sect hall to another,<br>unleashing a one-sided slaughter.<br>He was Yunxiao Tier 9, and had seized the Innate Primordial Spirit Body —<br>the Earth-rank and Sky-rank disciples,<br>even the Yunxiao-rank sect elders, were utterly powerless against him!",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx28"]}],
                },
                locks_lines: ["hx27"],
            }),
            "hx28": new Textline({
                is_unlocked: false,
                name: "(Receive intel pt7)",
                text: "Of the entire Huntian Gate, only the Gate Master remained to face him.<br>And that Gate Master, without a moment's hesitation,<br>laid down his own life to fight Zuo'a to the death.<br>Even so, the losses to the Huntian Gate were catastrophic.<br>This scene, witnessed by several other factions,<br>caused massive upheaval.<br>The Gate Master fell. Zuo'a's body was destroyed,<br>but he made a breakthrough at the last moment, and his soul escaped.<br>The sect's supreme treasure, the [Hall of Time], was taken by him as well.<br>Soon after, the Huntian Gate was carved up by many forces. The once-invincible, greatest power...",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx29"]}],
                },
                locks_lines: ["hx28"],
            }),
            "hx29": new Textline({
                is_unlocked: false,
                name: "Faded from the annals of Yangang Hunting Ground's history.",
                text: "[Xiyue] The rest of that story, you already know.<br>No need to repeat it.<br>That's how it was.<br>The Gate Master's family had originally been a distinguished house in the Yangang Hunting Ground.<br>After that earth-shaking war,<br>the Huntian Gate vanished, the family's strength was devastated, and they fell from grace.<br>That Gate Master was a man worthy of respect —<br>he single-handedly spared the entire sect from being wiped out to the last person.<br>And, he was also —<br>my ancestor. Mine and Lanzhi's.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx30"]}],
                },
                locks_lines: ["hx29"],
            }),
            "hx30": new Textline({
                is_unlocked: false,
                name: "It must be such a painful thing to carry.",
                text: "[Nako] Hearing someone speak so lightly of something so heavy.<br><br>[Xiyue] Ah, it's alright.<br>I'm actually very happy right now — because I can see hope —<br>hope that we can rewrite this fate.<br>Our family has endured in silence for generations,<br>a full ten eras have passed,<br>during which we gathered intelligence without pause,<br>tracking down Zuo'a's whereabouts<br>and everything he has done over these years.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx31"]}],
                },
                locks_lines: ["hx30"],
            }),
            "hx31": new Textline({
                is_unlocked: false,
                name: "...",
                text: "[Xiyue] And so, under those conditions,<br>Lanzhi and I<br>quietly disguised ourselves as ordinary adventurers,<br>crept into position at Zuo'a's side, and...<br>waited for the right moment to strike!<br>What Lanzhi was doing in the Water Prison<br>wasn't protecting her own status —<br>she was protecting the powerhouses inside the Water Prison,<br>preventing them from growing stronger<br>and reaching the standard to become a 'vessel.'<br><br>[Nako] Phew... what a winding tale...<br>You've been waiting, haven't you?",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx32"]}],
                },
                locks_lines: ["hx31"],
            }),
            "hx32": new Textline({
                is_unlocked: false,
                name: "Waiting for a power that could reverse the tides of fate to appear?",
                text: "[Xiyue] That's right. I know our plan is dangerous —<br>you could even say we have no guarantees.<br>Because Zuo'a right now<br>is on the verge of recovering to his former state.<br>This is the only chance to kill him,<br>so we have no choice but to go all in.<br>Even if it costs us our lives, we've accepted that.<br>Lanzhi and I — our family has waited ten eras.<br>We don't want to keep waiting any longer.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx33"]}],
                },
                locks_lines: ["hx32"],
            }),
            "hx33": new Textline({
                is_unlocked: false,
                name: "I believe you.",
                text: "[Nako] So Zuo'a has been hoarding all those treasures...<br>that explains it.<br>Wait — by that logic, isn't sis in danger?!<br><br>[Xiyue] Mm mm, don't worry.<br>Your sis is in a chest, right!<br>As long as we destroy this place before Zuo'a goes rummaging through it<br>and drags her out,<br>she'll be fine.<br>I'll do everything I can to protect your sis and get her out safe and sound.",
                unlocks: {
                    textlines: [{dialogue: "溪月(核心)", lines: ["hx34"]}],
                },
                locks_lines: ["hx33"],
            }),
            "hx34": new Textline({
                is_unlocked: false,
                name: "I'll give it everything I've got too!",
                text: "[Nako] Then, Miss Xiyue — it's a pleasure to work with you.<br><br>[Xiyue] ...Thank you. I'm counting on you...<br><br>",
                unlocks: {
                    locations:["幻境核心 - 6"],
                },
                locks_lines: ["hx34"],
            }),
            "hx35": new Textline({
                is_unlocked: false,
                name: "Now — open the way to the final battlefield!",
                text: "[Xiyue] Mm... ready!<br><br>",
                unlocks: {
                    locations:["幻境核心·决战"],
                    spec:'save',
                },
                locks_lines: ["hx35"],
            }),
        }
    })
    dialogues["草场"] = new Dialogue({
        name: "Grass Field",
        starting_text: "Go harvest [Silent Fern]",
        textlines: {
            "grass": new Textline({ 
                is_unlocked: true,
                name: "...",
                text: "...",
                unlocks: {
                    spec:"grass-field",
                },
                
            }),
        }
    });
    dialogues["左阿(决战)"] = new Dialogue({
        name: "Zuo'a (Final Battle)",
        starting_text: "Speak with 'Senior' Zuo'a",
        textlines: {
            "za1": new Textline({
                is_unlocked: true,
                name: "So I've finally arrived — the source of power sustaining this entire Illusory Realm...",
                text: "[Zuo'a] Congratulations, little girl.<br>You've made it here alive —<br>which means you qualify to receive my, [Zuo'a]'s, inheritance.<br>Only——",
                unlocks: {
                    textlines: [{dialogue: "左阿(决战)", lines: ["za2"]}],
                },
                locks_lines: ["za1"],
            }),
            "za2": new Textline({
                is_unlocked: false,
                name: "No need to reveal the punchline — I already know.",
                text: "[Nako] You've told so many lies.<br>I'm truly disappointed in you, Senior Zuo'a.<br><br>[Zuo'a] Ahahahaha, good, interesting, very interesting.<br>It seems things have taken, just the tiniest bit,<br>an unexpected turn.",
                unlocks: {
                    textlines: [{dialogue: "左阿(决战)", lines: ["za3"]}],
                },
                locks_lines: ["za2"],
            }),
            "za3": new Textline({
                is_unlocked: false,
                name: "Your time has passed, Senior.",
                text: "[Nako] There's no need to cause any more trouble here.<br><br>[Zuo'a] Save the speech. My hundred-thousand-year plan<br>is now just one step from completion —<br>do you really think I'd abandon it for one little girl?<br>You know how much I despise that undying Gate Master.<br>If not for him,<br>would a man of my caliber have been forced to languish in this barrier for a hundred thousand years?",
                unlocks: {
                    textlines: [{dialogue: "左阿(决战)", lines: ["za4"]}],
                },
                locks_lines: ["za3"],
            }),
            "za4": new Textline({
                is_unlocked: false,
                name: "After everything you've done — have you still not realized how utterly mediocre you are?",
                text: "[Nako] You've been wrong from the very first step.<br>In a hundred thousand years, a total of over 230,000 adventurers<br>have stumbled in here.<br>The 200,000 of them who hadn't reached Sky Rank<br>became nourishment for the barrier the instant they stepped in.<br>You didn't even consider looting their packs——<br>what if someone was carrying a treasure like the B6 Laser Gun?<br>You're just going to pass that up?",
                unlocks: {
                    textlines: [{dialogue: "左阿(决战)", lines: ["za5"]}],
                },
                locks_lines: ["za4"],
            }),
            "za5": new Textline({
                is_unlocked: false,
                name: "Thirty thousand Sky Rank cultivators, under the Water Prison's accelerated time,",
                text: "[Nako] survived five hundred thousand years of endless slaughter,<br>with only a few hundred left alive today.<br>Considering a Sky Rank cultivator's lifespan is only ten thousand years...<br>the fact that hundreds are still alive today<br>means the vast majority died of natural causes!<br>The atmosphere in the Water Prison should be one of mutual suspicion and backstabbing —<br>not the orderly society it's become!",
                unlocks: {
                    textlines: [{dialogue: "左阿(决战)", lines: ["za6"]}],
                },
                locks_lines: ["za5"],
            }),
            "za6": new Textline({
                is_unlocked: false,
                name: "Furthermore, twenty-five Yunxiao-rank powerhouses,",
                text: "[Nako] because they had already met the threshold to become vessels,<br>were killed by you without a second thought...<br>And that's your excuse for leaving your soul sitting idle all this time?<br><br>[Zuo'a] Little girl,<br>I'm not sure where you found the nerve<br>to start lecturing me on my poor Water Prison management.<br>But your cultivation, to me, is still far too green.",
                unlocks: {
                    textlines: [{dialogue: "左阿(决战)", lines: ["za7"]}],
                },
                locks_lines: ["za6"],
            }),
            "za7": new Textline({
                is_unlocked: false,
                name: "[Zuo'a] Are you joking?",
                text: "[Nako] Time's up.<br>Time to evolve — Domain power.",
                unlocks: {
                    textlines: [{dialogue: "左阿(决战)", lines: ["za8"]}],
                    spec:"realm-IV",
                },
                locks_lines: ["za7"],
            }),
            "za8": new Textline({
                is_unlocked: false,
                name: "(Warning ⚠️: Fast Return will be disabled after triggering this scene)",
                text: "[Zuo'a] Is that all you've got?<br>[Nako] We're nowhere near finished.<br><br>[Act 3 Boss Battle has begun!]",
                unlocks: {
                    textlines: [{dialogue: "决战木牌", lines: ["S31"]},{dialogue: "决战木牌", lines: ["S32"]},{dialogue: "决战木牌", lines: ["S33"]}],
                    spec:"S3-start",
                },
                locks_lines: ["za8"],
            }),
        }
    });
    dialogues["决战木牌"] = new Dialogue({
        name: "Final Battle Sign",
        starting_text: "Check boss battle rules",
        textlines: {
            "S31": new Textline({
                is_unlocked: false,
                name: "[Soul Spirit] and [Soul Power]",
                text: "Every [Soul Spirit] defeated<br>grants 1 point of [Soul Power]!<br>When Soul Power reaches 5 or 10 points, your max HP increases by 20%!<br>At 15 or 20 points, your ATK, DEF, and SPD each rise by 100 million!<br>At 25 points, the seal will be complete!<br>Once the seal is complete,<br>Zuo'a's power will be reduced <span style='color:aqua'>10,081</span>-fold, and the final battle with Nako will begin!",
                unlocks: {
                },
            }),
            "S32": new Textline({
                is_unlocked: false,
                name: "Dashboard Display",
                text: "<img src='image/item/violet_ingot.png'>Soul Crystal Ingots represent [Soul Power]!,<br><img src='image/boss/B3706.png'><img src='image/boss/B3707.png'><img src='image/boss/B3708.png'>Soul Spirits indicate the remaining count of each type on the field!",
                unlocks: {
                },
            }),
            "S33": new Textline({
                is_unlocked: false,
                name: "Wait — why can't I go back?",
                text: "Once the Final Battle begins, there's no turning back!<br>Load a save... I believe I warned you about this outside.<br>Of course, you can go back after you finish fighting.",
                unlocks: {
                },
            }),
        }
    });

    dialogues["冰溪月"] = new Dialogue({
        name: "Na Xiyue",
        starting_text: "Talk with Xiyue",
        textlines: {
            "bx1": new Textline({
                is_unlocked: true,
                name: "(The residual water-element barrier still flows through the Water Prison,)",
                text: "but that faint, ever-present sense of suffocation has at last dissipated.<br>A dozen-odd figures stand gathered on a platform bathed in light from above.<br><br>[Nako] Huh, huh??<br>So... everyone here<br>is from Miss Xiyue's... family?<br><br>[Na Xiyue] 'Xiyue' was only a temporary name.<br>Allow me to re-introduce myself.<br>I am — of the Na Clan — <span style='color:aqua'>Na Xiyue</span>.<br>",
                unlocks: {
                    spec:"P3-1",
                    textlines: [{dialogue: "冰溪月", lines: ["bx2"]}],
                },
                locks_lines: ["bx1"],
            }),
            "bx2": new Textline({
                is_unlocked: false,
                name: "And... what about the others?",
                text: "[Na Xiyue] Heh heh, sorry for not telling you until now.<br>But there was really no way around it.<br>Also, those twenty people on the Strength Ranking — not all of them, but most<br>were plants sent in by us one by one,<br>lying low like sleeper agents.<br>",
                unlocks: {
                    spec:"P3-2",
                    textlines: [{dialogue: "冰溪月", lines: ["bx3"]}],
                },
                locks_lines: ["bx2"],
            }),
            "bx3": new Textline({
                is_unlocked: false,
                name: "So that's how it was — no wonder...",
                text: "[Nanami] So many powerhouses with Domain abilities, gathered in one place.<br><br>[Na Xiyue] Mm, and it's actually not just that.<br>To gather intelligence about the Water Prison,<br>the clan lost several<br>Yunxiao-rank elders' lives in the process.",
                unlocks: {
                    textlines: [{dialogue: "冰溪月", lines: ["bx4"]}],
                },
                locks_lines: ["bx3"],
            }),
            "bx4": new Textline({
                is_unlocked: false,
                name: "Those soul spirits...",
                text: "",
                unlocks: {
                    textlines: [{dialogue: "冰溪月", lines: ["bx5"]}],
                    spec:"P3-3",
                },
                locks_lines: ["bx4"],
            }),
            "bx5": new Textline({
                is_unlocked: false,
                name: "So... was all of this within your calculations?",
                text: "[Nanami] Th-then, what about me and Koko——<br><br>Nanami's emotions suddenly flared up.<br>Though Nako ultimately pulled through,<br>she never wanted her little sister dragged into something like this.<br><br>[Nako] Sis, it's okay.<br>After everything I've been through,<br>I feel terrifyingly strong right now.<br>When we get home, I'll have to have a talk with Dad...<br>As the saying goes — the title of Clan Head goes to whoever is most capable!",
                unlocks: {
                    textlines: [{dialogue: "冰溪月", lines: ["bx6"]}],
                },
                locks_lines: ["bx5"],
            }),
            "bx6": new Textline({
                is_unlocked: false,
                name: "...",
                text: "",
                unlocks: {
                    spec:"P3-4",
                    textlines: [{dialogue: "冰溪月", lines: ["bx7"]}],
                },
                locks_lines: ["bx6"],
            }),
            "bx7": new Textline({
                is_unlocked: false,
                name: "Mm, you're heading off now?...",
                text: "[Nanami] There's still so much I want to ask,<br>but what you've been carrying is heavier than I imagined.<br>Please, rest well.<br><br>[Mo'er] Let's go — the clan elders have been waiting anxiously for a long time.<br>Well then — farewell for now. Take care.<br>",
                unlocks: {
                    textlines: [{dialogue: "冰溪月", lines: ["bx8"]}],
                },
                locks_lines: ["bx7"],
            }),
            "bx8": new Textline({
                is_unlocked: false,
                name: "Sis... what you said just now,",
                text: "[Nako] about seeing something you'd never seen before in your Illusory Realm —<br>is that true?<br><br>[Nanami] Yes, that scene... it was truly strange.<br>Koko, you said your Illusory Realm was generated from your own memories,<br>conjuring things that clashed with your beliefs to lead you into darkness.<br>But I don't remember having any memory of —<br>or ever visiting — the place in my Illusory Realm.<br>A sky blazing with golden light,<br>great beasts dancing through the clouds, celestial music ringing out across the heavens.",
                unlocks: {
                    textlines: [{dialogue: "冰溪月", lines: ["bx9"]}],
                },
                locks_lines: ["bx8"],
            }),
            "bx9": new Textline({
                is_unlocked: false,
                name: "Wow, that sounds incredible...",
                text: "[Nanami] But...<br>every time I tried to make out those beast shapes, or hear the celestial music clearly,<br>my mind felt like it was being shaken into a daze.",
                unlocks: {
                    textlines: [{dialogue: "冰溪月", lines: ["bx10"]}],
                },
                locks_lines: ["bx9"],
            }),
            "bx10": new Textline({
                is_unlocked: false,
                name: "Everyone's Illusory Realm is different... right?",
                text: "[Nako] Do you have any idea what it might mean, sis?<br><br>[Nanami] I don't know, but after we return to the clan<br>I plan to go into secluded cultivation for a while first.<br>As strange as it all was, when I emerged<br>I felt like I'd gained an enormous amount of insight.<br>As if that place was hiding some kind of opportunity for a breakthrough.<br>",
                unlocks: {
                    textlines: [{dialogue: "冰溪月", lines: ["bx11"]}],
                },
                locks_lines: ["bx10"],
            }),
            "bx11": new Textline({
                is_unlocked: false,
                name: "That's great, sis! Let's hurry back —",
                text: "[Nako] and tell Brother Feng and Father the news...<br><br>[Nanami] Phew — alright. Things here are settled. It's time to go.<br>",
                unlocks: {
                    locations:["纳家宝库"],
                },
                locks_lines: ["bx11"],
            }),
        }
    });

    dialogues["纳布(宝库)"] = new Dialogue({
        name: "Nabu (Treasury)",
        starting_text: "Talk with Nabu (Treasury)",
        textlines: {
            "bk1": new Textline({
                is_unlocked: true,
                name: "I'm back~",
                text: "[Nabu] Koko! Nana! Are you alright?<br>I've been searching for you",
                unlocks: {
                    spec:"age-check",
                    textlines: [{dialogue: "纳布(宝库)", lines: ["bk2"]}],
                },
                locks_lines: ["bk1"],
            }),
            "bk2": new Textline({
                is_unlocked: false,
                name: "I'm fine.",
                text: "[Nako] Father, as you always said —<br>only in dangerous places can one find opportunity.<br>The strength I have now<br>is entirely thanks to those life-and-death trials.<br><br>[Nabu] <span class='realm_sky'>Sky Rank Peak</span>? Domain Tier 4?!!<br>As expected of my child... alright, tell me —<br>what brings you back to the clan this time?",
                unlocks: {
                    textlines: [{dialogue: "纳布(宝库)", lines: ["bk3"]}],
                },
                locks_lines: ["bk2"],
            }),
            "bk3": new Textline({
                is_unlocked: false,
                name: "I heard... there's a Yangang Hunting Ground Tournament recently?",
                text: "[Nabu] That's right... anyone below <span class='realm_cloudy'>Yunxiao Rank</span> can participate.<br>After the beast tide of Era 31698, Year 1372,<br>the wild beasts across the entire Yangang Hunting Ground jumped up a whole tier.<br>The tournament rewards are substantial,<br>and Yunxiao-rank beast materials can be brought home.",
                unlocks: {
                    textlines: [{dialogue: "纳布(宝库)", lines: ["bk4"]}],
                },
                locks_lines: ["bk3"],
            }),
            "bk4": new Textline({
                is_unlocked: false,
                name: "Really! Then I'm going!",
                text: "[Nabu] Koko can go, Nana had better not...<br>Oh right, I was originally going to pass down the Na Clan's treasure [Eve] to you two.<br>But because I spent so long searching across the Yangang Hunting Ground,<br>I gained my own insights and broke through to <span class='realm_cloudy'>Yunxiao Rank</span>.<br>Looks like the Clan Head seat<br>will be mine to keep for a few more years!",
                unlocks: {
                    textlines: [{dialogue: "纳布(宝库)", lines: ["bk5"]}],
                    locations:["狩猎大赛·城门战"],
                },
                locks_lines: ["bk4"],
            }),
            "bk5": new Textline({
                is_unlocked: false,
                name: "I refuse to accept that!",
                text: "[Nabu] Ambition is a fine quality in the young.<br>If Koko has the strength to beat me,<br>then I'll happily retire.",
                unlocks: {
                    locations:["纳家宝库 - X"],
                },
                locks_lines: ["bk5"],
            }),
            "bk6": new Textline({
                is_unlocked: false,
                name: "How's that, then?",
                text: "[Nabu] Good, good, good.<br>Here's what you wanted.<br>Heh... you've grown up...<br><br>[Reminder]<br>Obtained the Na Clan's treasure [Eve]!<br>[WIP→V3.01] Family System is now active!",
                unlocks: {
                    flags: ["is_family_enabled"],
                },
                locks_lines: ["bk5"],
            }),
        },
    });



    dialogues["心之石像"] = new Dialogue({
        name: "Heart Stone Idol",
        starting_text: "Crystallize insights accumulated in battle",
        textlines: {
            "clumbs": new Textline({ 
                is_unlocked: true,
                name: "Wild Beast Forest Insight / Click to receive!! (will be removed in v1.10)",
                text: "...",
                unlocks: {
                    spec:"A1-fusion",
                },
                
                locks_lines: ["clumbs"],
            }),
        }
    });
})();

export {dialogues};