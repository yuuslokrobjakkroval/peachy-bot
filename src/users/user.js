const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    about_me: {type: String, default: 'Skyrealm fan'},
    relationship_partner_id: {type: String, default: ''},
    date_of_start_relationship: {type: String, default: ''},
    gold_coin: { type: Number, default: 0 },
    balance_limit: { type: Number, default: 0 },
    balance_main_limit: { type: Number, default: 0 },
    command_point: { type: Number, default: 0 },
    next_day: { type: Date, default: '' },
    username: { type: String, default: '' },
    wp: { type: Array },
    shard: { type: Number, default: 0 },
    bg: { type: Array },
    lvl_bg: {type: String, default: ''},
    spam_amount: { type: Number, default: 0 },
    elo: { type: Number, default: 0 },
    CD: { type: Boolean, default: false },
    daily_animal: { type: Date, default: '' },
    daily_lootbox: { type: Number, default: 0 },
    daily_crate: { type: Number, default: 0 },

    premium: {
        premium_bool: { type: Boolean, default: true },
        premium_endDate: { type: Date, default: '' },
    },

    autohunt: {
        autohunting: { type: Boolean, default: false },
        datekilling: { type: Date, default: '' },
        amount_animal: { type: Number, default: 0 },

        killTotal: { type: Number, default: 0 },
        spendTotal: { type: Number, default: 0 },
    },

    farm: {
        tree1: { type: String, default: '🌲' },
        tree2: { type: String, default: '🌳' },

        for_sell: { type: Number, default: 0 },
        qty_sell: { type: Number, default: 0 },

        for_sell2: { type: Number, default: 0 },
        qty_sell2: { type: Number, default: 0 },

        for_sell3: { type: Number, default: 0 },
        qty_sell3: { type: Number, default: 0 },

        seed_collect: { type: Number, default: 0 },
        seed: { type: Number, default: 0 },
        rice: { type: Number, default: 0 },
        milk: { type: Number, default: 0 },
        plan_bool: { type: Boolean, default: false },
        plan_type: { type: String, default: '' },

        ah_lerk: { type: Number, default: 0 },
        ju: { type: Number, default: 0 },
        khatna: { type: Number, default: 0 },

        coin: { type: Number, default: 0 },
        limit_coin: { type: Number, default: 0 },

        pizza: { type: Number, default: 0 },
        hamburger: { type: Number, default: 0 },
        fries: { type: Number, default: 0 },
        hotdog: { type: Number, default: 0 },
        pancakes: { type: Number, default: 0 },
        bread: { type: Number, default: 0 },
        french_bread: { type: Number, default: 0 },
        flatbread: { type: Number, default: 0 },

        psa_date: { type: Date, default: '' },
        max_seed: { type: Number, default: 0 },
        max_rice: { type: Number, default: 0 },
        max_milk: { type: Number, default: 0 },

        slot1: { type: String, default: '❔' }, slot1_amount: { type: Number, default: 0 }, slot1_price: { type: Number, default: 0 },
        slot2: { type: String, default: '❔' }, slot2_amount: { type: Number, default: 0 }, slot2_price: { type: Number, default: 0 },
        slot3: { type: String, default: '❔' }, slot3_amount: { type: Number, default: 0 }, slot3_price: { type: Number, default: 0 },
        slot4: { type: String, default: '❔' }, slot4_amount: { type: Number, default: 0 }, slot4_price: { type: Number, default: 0 },
        slot5: { type: String, default: '❔' }, slot5_amount: { type: Number, default: 0 }, slot5_price: { type: Number, default: 0 },
        slot6: { type: String, default: '❔' }, slot6_amount: { type: Number, default: 0 }, slot6_price: { type: Number, default: 0 },

        box_one: { type: Number, default: 0 },
        box_two: { type: Number, default: 0 },
        box_three: { type: Number, default: 0 },
        box_four: { type: Number, default: 0 },
        boat_date: { type: Date, default: '' },
        boat_nextday: { type: Date, default: '' },
        boat_box_need: { type: Number, default: 0 },
        boat_box_one_amount: { type: Number, default: 0 },
        boat_box_two_amount: { type: Number, default: 0 },
        boat_box_three_amount: { type: Number, default: 0 },
        boat_box_four_amount: { type: Number, default: 0 },
    },

    quest: {
        quest_nextday: { type: Date, default: '' },

        hunt_point: { type: Number, default: 0 }, hunt_claimed: { type: Boolean, default: false },
        battle_point: { type: Number, default: 0 }, battle_claimed: { type: Boolean, default: false },
        work_point: { type: Number, default: 0 }, work_claimed: { type: Boolean, default: false },
        fight_point: { type: Number, default: 0 }, fight_claimed: { type: Boolean, default: false },
    },

    inventory: {
        pickage: { type: Boolean, default: false },
        pickage_percen: { type: Number, default: 0 },

        stone: { type: Number, default: 0 },
        gold: { type: Number, default: 0 },
        diamond: { type: Number, default: 0 },

        box: { type: Number, default: 0 },
    },

    tools: {
        addPercen_amount: { type: Number, default: 0 },

        addRate_amount: { type: Number, default: 0 },
        addRate_Bool: { type: Boolean, default: false },
        addRate_percen: { type: Number, default: 0 },

        addDouble_amount: { type: Number, default: 0 },
        addDouble_Bool: { type: Boolean, default: false },
        addDouble_percen: { type: Number, default: 0 },

        fire_amount: { type: Number, default: 0 },
        fire_bool: { type: Number, default: 0 },
        fire_percen: { type: Number, default: 0 },

        zaz_amount: { type: Number, default: 0 },
        zaz_bool: { type: Number, default: 0 },
        zaz_percen: { type: Number, default: 0 },

        fire_luck: { type: Number, default: 0 },
        addrate_luck: { type: Number, default: 0 },
        mine_per: { type: Number, default: 10 },
    },

    levelSystem: {
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 0 },
        rateXp: { type: Number, default: 100 },
    },

    dailySystem: {
        Daily: { type: Date, default: '' },
        dailyStack: { type: Number, default: 1 },
    },

    workSystem: {
        job: { type: String, default: '' },
    },

    holder_item: {
        holder_item_bool: { type: Boolean, default: false },
        holder_item_equipe: { type: String, default: '' },
    },

    weapon: {
        weapon_equipe: { type: String, default: '' },

        mana_weapon: { type: Boolean, default: false },
        demage_weapon: { type: Boolean, default: false },
        critical_weapon: { type: Boolean, default: false },
        immortal_weapon: { type: Boolean, default: false },
        life_steal_weapon: { type: Boolean, default: false },
        defend_weapon: { type: Boolean, default: false },
    },

    gem: {
        hunt_Gem_equipe: { type: String, default: '' }, hunt_Gem_addAnimal: { type: Number, default: 1 }, hunt_Gem_percen: { type: Number, default: 0 },

        empowering_Gem_equipe: { type: String, default: '' }, empowering_Gem_timeAniaml: { type: Number, default: 1 }, empowering_Gem_percen: { type: Number, default: 0 },

        lucky_Gem_equipe: { type: String, default: '' }, lucky_Gem_addChance: { type: Number, default: 1 }, lucky_Gem_percen: { type: Number, default: 0 },

        '014': { type: Number, default: 0 },//TICKET
        'jjk': { type: Number, default: 0 },//TICKET JUJUTSU KAISEN
        'op': { type: Number, default: 0 },//TICKET ONE PIECE
        'opm': { type: Number, default: 0 },//TICKET ONE PUNCH MAN
        'ds': { type: Number, default: 0 },//TICKET DEMON SLAYER
        'cg': { type: Number, default: 0 },//TICKET COLLECTION GIRL
        'nt': { type: Number, default: 0 },//TICKET NARUTO
        'nm': { type: Number, default: 0 },//TICKET HANUMAN
        'ms': { type: Number, default: 0 },//TICKET MASHLE
        'cm': { type: Number, default: 0 },//TICKET CHAINSAW MAN
        'kn8': { type: Number, default: 0 },//TICKET KIAJU NO 8

        '050': { type: Number, default: 0 },//box
        'kof': { type: Number, default: 0 },//kof_box
        '100': { type: Number, default: 0 },//crate
        '999': { type: Number, default: 0 },//Weapon crate fabled
        '777': { type: Number, default: 0 },//Weapon crate legendary

        '051': { type: Number, default: 0 },//Common Hunting Gem
        '065': { type: Number, default: 0 },//Common Empowering Gem
        '072': { type: Number, default: 0 },//Common Lucky Gem

        '052': { type: Number, default: 0 },//Uncommon Hunting Gem
        '066': { type: Number, default: 0 },//Uncommon Empowering Gem
        '073': { type: Number, default: 0 },//Uncommon Lucky Gem

        '053': { type: Number, default: 0 },//Rare Hunting Gem
        '067': { type: Number, default: 0 },//Rare Empowering Gem
        '074': { type: Number, default: 0 },//Rare Lucky Gem

        '054': { type: Number, default: 0 },//Epic Hunting Gem
        '068': { type: Number, default: 0 },//Epic Empowering Gem
        '075': { type: Number, default: 0 },//Epic Lucky Gem

        '055': { type: Number, default: 0 },//Mythical Hunting Gem
        '069': { type: Number, default: 0 },//Mythical Empowering Gem
        '076': { type: Number, default: 0 },//Mythical Lucky Gem

        '056': { type: Number, default: 0 },//Legendary Hunting Gem
        '070': { type: Number, default: 0 },//Legendary Empowering Gem
        '077': { type: Number, default: 0 },//Legendary Lucky Gem

        '057': { type: Number, default: 0 },//Febled Hunting Gem
        '071': { type: Number, default: 0 },//Febled Empowering Gem
        '078': { type: Number, default: 0 },//Febled Lucky Gem
    },

    egg: {
        egg_amount: { type: Number, default: 0 },
        esen: { type: Number, default: 0 },

        Shiny: {
            Shiny_bool: { type: Boolean, default: false },
            Shiny_xp: { type: Number, default: 0 },
            Shiny_level: { type: Number, default: 0 },
            Shiny_ratelevel: { type: Number, default: 100 },
            Shiny_HP: { type: Number, default: 5000 },
            Shiny_power: { type: Number, default: 800 },
            Shiny_SM: { type: Number, default: 2000 },

            Shiny_skill1: { type: String, default: 'slow' },
            Shiny_skill2: { type: String, default: 'frezz' },
            Shiny_skill3: { type: String, default: 'vengeance' },
        },

        Sandshrew: {
            Sandshrew_bool: { type: Boolean, default: false },
            Sandshrew_xp: { type: Number, default: 0 },
            Sandshrew_level: { type: Number, default: 0 },
            Sandshrew_ratelevel: { type: Number, default: 100 },
            Sandshrew_HP: { type: Number, default: 1200 },
            Sandshrew_power: { type: Number, default: 300 },
            Sandshrew_SM: { type: Number, default: 700 },

            Sandshrew_skill1: { type: String, default: 'life steal' },
            Sandshrew_skill2: { type: String, default: 'demage' },
            Sandshrew_skill3: { type: String, default: 'defend' },
        },

        Metapod: {
            Metapod_bool: { type: Boolean, default: false },
            Metapod_xp: { type: Number, default: 0 },
            Metapod_level: { type: Number, default: 0 },
            Metapod_ratelevel: { type: Number, default: 100 },
            Metapod_HP: { type: Number, default: 200 },
            Metapod_power: { type: Number, default: 80 },
            Metapod_SM: { type: Number, default: 200 },

            Metapod_skill1: { type: String, default: 'life steal' },
            Metapod_skill2: { type: String, default: 'life steal' },
            Metapod_skill3: { type: String, default: 'life steal' },
        },

        Rutr: {
            Rutr_bool: { type: Boolean, default: false },
            Rutr_xp: { type: Number, default: 0 },
            Rutr_level: { type: Number, default: 0 },
            Rutr_ratelevel: { type: Number, default: 100 },
            Rutr_HP: { type: Number, default: 200 },
            Rutr_power: { type: Number, default: 50 },
            Rutr_SM: { type: Number, default: 200 },

            Rutr_skill1: { type: String, default: 'defend' },
            Rutr_skill2: { type: String, default: 'slow' },
            Rutr_skill3: { type: String, default: 'vengeance' },
        },

        Elekid: {
            Elekid_bool: { type: Boolean, default: false },
            Elekid_xp: { type: Number, default: 0 },
            Elekid_level: { type: Number, default: 0 },
            Elekid_ratelevel: { type: Number, default: 100 },
            Elekid_HP: { type: Number, default: 300 },
            Elekid_power: { type: Number, default: 150 },
            Elekid_SM: { type: Number, default: 250 },

            Elekid_skill1: { type: String, default: 'slow' },
            Elekid_skill2: { type: String, default: 'life steal' },
            Elekid_skill3: { type: String, default: 'vengeance' },
        },

        Bee: {
            Bee_bool: { type: Boolean, default: false },
            Bee_xp: { type: Number, default: 0 },
            Bee_level: { type: Number, default: 0 },
            Bee_ratelevel: { type: Number, default: 100 },
            Bee_HP: { type: Number, default: 300 },
            Bee_power: { type: Number, default: 150 },
            Bee_SM: { type: Number, default: 250 },

            Bee_skill1: { type: String, default: 'defend' },
            Bee_skill2: { type: String, default: 'life steal' },
            Bee_skill3: { type: String, default: 'vengeance' },
        },

        Furfrou: {
            Furfrou_bool: { type: Boolean, default: false },
            Furfrou_xp: { type: Number, default: 0 },
            Furfrou_level: { type: Number, default: 0 },
            Furfrou_ratelevel: { type: Number, default: 100 },
            Furfrou_HP: { type: Number, default: 200 },
            Furfrou_power: { type: Number, default: 100 },
            Furfrou_SM: { type: Number, default: 150 },

            Furfrou_skill1: { type: String, default: 'life steal' },
            Furfrou_skill2: { type: String, default: 'health' },
            Furfrou_skill3: { type: String, default: 'demage' },
        },

        Nicy: {
            Nicy_bool: { type: Boolean, default: false },
            Nicy_xp: { type: Number, default: 0 },
            Nicy_level: { type: Number, default: 0 },
            Nicy_ratelevel: { type: Number, default: 100 },
            Nicy_HP: { type: Number, default: 500 },
            Nicy_power: { type: Number, default: 100 },
            Nicy_SM: { type: Number, default: 500 },

            Nicy_skill1: { type: String, default: 'demage' },
            Nicy_skill2: { type: String, default: 'frezz' },
            Nicy_skill3: { type: String, default: 'health' },
        },

        Onix: {
            Onix_bool: { type: Boolean, default: false },
            Onix_xp: { type: Number, default: 0 },
            Onix_level: { type: Number, default: 0 },
            Onix_ratelevel: { type: Number, default: 100 },
            Onix_HP: { type: Number, default: 550 },
            Onix_power: { type: Number, default: 50 },
            Onix_SM: { type: Number, default: 500 },

            Onix_skill1: { type: String, default: 'vengeance' },
            Onix_skill2: { type: String, default: 'slow' },
            Onix_skill3: { type: String, default: 'defend' },
        },

        Megagengar: {
            Megagengar_bool: { type: Boolean, default: false },
            Megagengar_xp: { type: Number, default: 0 },
            Megagengar_level: { type: Number, default: 0 },
            Megagengar_ratelevel: { type: Number, default: 100 },
            Megagengar_HP: { type: Number, default: 1500 },
            Megagengar_power: { type: Number, default: 800 },
            Megagengar_SM: { type: Number, default: 1000 },

            Megagengar_skill1: { type: String, default: 'frezz' },
            Megagengar_skill2: { type: String, default: 'defend' },
            Megagengar_skill3: { type: String, default: 'slow' },
        },

        Fegar: {
            Fegar_bool: { type: Boolean, default: false },
            Fegar_xp: { type: Number, default: 0 },
            Fegar_level: { type: Number, default: 0 },
            Fegar_ratelevel: { type: Number, default: 100 },
            Fegar_HP: { type: Number, default: 2000 },
            Fegar_power: { type: Number, default: 300 },
            Fegar_SM: { type: Number, default: 1000 },

            Fegar_skill1: { type: String, default: 'life steal' },
            Fegar_skill2: { type: String, default: 'double demage' },
            Fegar_skill3: { type: String, default: 'critical' },
        },

        equipe: { type: String, default: '' },
        winstrack: { type: Number, default: 0 },
    },

    sat: {
        team: {
            streak: { type: Number, default: 0 },
            streak_two: { type: Number, default: 0 },
            higher_streak: { type: Number, default: 0 },
            higher_streak_two: { type: Number, default: 0 },
            team_name: { type: String, default: '' },

            setting_battle: { type: String, default: 'normal' },

            team_set: { type: Number, default: 1 },

            team_equipe1: { type: String, default: '' },
            team_equipe2: { type: String, default: '' },
            team_equipe3: { type: String, default: '' },

            postion1: { type: String, default: '' },
            postion2: { type: String, default: '' },
            postion3: { type: String, default: '' },

            postion4: { type: String, default: '' },
            postion5: { type: String, default: '' },
            postion6: { type: String, default: '' },
        },

        patreon: {
            patreon_bool: { type: Boolean, default: false },
            patreon_left: { type: Number, default: 0 },
            custom_patreon_left: { type: Number, default: 0 },
        },

        jujutsu_kaisen: {
            jjk_bool: { type: Boolean, default: false },
            jjk_hunt: { type: Number, default: 0 },
        },

        one_piece: {
            op_bool: { type: Boolean, default: false },
            op_hunt: { type: Number, default: 0 },
        },

        one_punch_man: {
            opm_bool: { type: Boolean, default: false },
            opm_hunt: { type: Number, default: 0 },
        },

        demon_slayer: {
            ds_bool: { type: Boolean, default: false },
            ds_hunt: { type: Number, default: 0 },
        },

        collection_girl: {
            cg_bool: { type: Boolean, default: false },
            cg_hunt: { type: Number, default: 0 },
        },

        naruto: {
            nt_bool: { type: Boolean, default: false },
            nt_hunt: { type: Number, default: 0 },
        },

        hanuman: {
            nm_bool: { type: Boolean, default: false },
            nm_hunt: { type: Number, default: 0 },
        },

        mashle: {
            ms_bool: { type: Boolean, default: false },
            ms_hunt: { type: Number, default: 0 },
        },

        chainsaw_man: {
            cm_bool: { type: Boolean, default: false },
            cm_hunt: { type: Number, default: 0 },
        },

        kaiju_no_8: {
            kn8_bool: { type: Boolean, default: false },
            kn8_hunt: { type: Number, default: 0 },
        },

        //COMMON
        sat_1_1: { type: Number, default: 0 }, sat_1_1_h: { type: Number, default: 0 }, sat_1_1_xp: { type: Number, default: 0 },
        sat_1_2: { type: Number, default: 0 }, sat_1_2_h: { type: Number, default: 0 }, sat_1_2_xp: { type: Number, default: 0 },
        sat_1_3: { type: Number, default: 0 }, sat_1_3_h: { type: Number, default: 0 }, sat_1_3_xp: { type: Number, default: 0 },
        sat_1_4: { type: Number, default: 0 }, sat_1_4_h: { type: Number, default: 0 }, sat_1_4_xp: { type: Number, default: 0 },
        sat_1_5: { type: Number, default: 0 }, sat_1_5_h: { type: Number, default: 0 }, sat_1_5_xp: { type: Number, default: 0 },

        //UNCOMMON
        sat_2_1: { type: Number, default: 0 }, sat_2_1_h: { type: Number, default: 0 }, sat_2_1_xp: { type: Number, default: 0 },
        sat_2_2: { type: Number, default: 0 }, sat_2_2_h: { type: Number, default: 0 }, sat_2_2_xp: { type: Number, default: 0 },
        sat_2_3: { type: Number, default: 0 }, sat_2_3_h: { type: Number, default: 0 }, sat_2_3_xp: { type: Number, default: 0 },
        sat_2_4: { type: Number, default: 0 }, sat_2_4_h: { type: Number, default: 0 }, sat_2_4_xp: { type: Number, default: 0 },
        sat_2_5: { type: Number, default: 0 }, sat_2_5_h: { type: Number, default: 0 }, sat_2_5_xp: { type: Number, default: 0 },

        //RARE
        sat_3_1: { type: Number, default: 0 }, sat_3_1_h: { type: Number, default: 0 }, sat_3_1_xp: { type: Number, default: 0 },
        sat_3_2: { type: Number, default: 0 }, sat_3_2_h: { type: Number, default: 0 }, sat_3_2_xp: { type: Number, default: 0 },
        sat_3_3: { type: Number, default: 0 }, sat_3_3_h: { type: Number, default: 0 }, sat_3_3_xp: { type: Number, default: 0 },
        sat_3_4: { type: Number, default: 0 }, sat_3_4_h: { type: Number, default: 0 }, sat_3_4_xp: { type: Number, default: 0 },
        sat_3_5: { type: Number, default: 0 }, sat_3_5_h: { type: Number, default: 0 }, sat_3_5_xp: { type: Number, default: 0 },

        //EPIC
        sat_4_1: { type: Number, default: 0 }, sat_4_1_h: { type: Number, default: 0 }, sat_4_1_xp: { type: Number, default: 0 },
        sat_4_2: { type: Number, default: 0 }, sat_4_2_h: { type: Number, default: 0 }, sat_4_2_xp: { type: Number, default: 0 },
        sat_4_3: { type: Number, default: 0 }, sat_4_3_h: { type: Number, default: 0 }, sat_4_3_xp: { type: Number, default: 0 },
        sat_4_4: { type: Number, default: 0 }, sat_4_4_h: { type: Number, default: 0 }, sat_4_4_xp: { type: Number, default: 0 },
        sat_4_5: { type: Number, default: 0 }, sat_4_5_h: { type: Number, default: 0 }, sat_4_5_xp: { type: Number, default: 0 },

        //MYTHICAL
        sat_5_1: { type: Number, default: 0 }, sat_5_1_h: { type: Number, default: 0 }, sat_5_1_xp: { type: Number, default: 0 },
        sat_5_2: { type: Number, default: 0 }, sat_5_2_h: { type: Number, default: 0 }, sat_5_2_xp: { type: Number, default: 0 },
        sat_5_3: { type: Number, default: 0 }, sat_5_3_h: { type: Number, default: 0 }, sat_5_3_xp: { type: Number, default: 0 },
        sat_5_4: { type: Number, default: 0 }, sat_5_4_h: { type: Number, default: 0 }, sat_5_4_xp: { type: Number, default: 0 },
        sat_5_5: { type: Number, default: 0 }, sat_5_5_h: { type: Number, default: 0 }, sat_5_5_xp: { type: Number, default: 0 },

        //LEGENDARY
        sat_6_1: { type: Number, default: 0 }, sat_6_1_h: { type: Number, default: 0 }, sat_6_1_xp: { type: Number, default: 0 },
        sat_6_2: { type: Number, default: 0 }, sat_6_2_h: { type: Number, default: 0 }, sat_6_2_xp: { type: Number, default: 0 },
        sat_6_3: { type: Number, default: 0 }, sat_6_3_h: { type: Number, default: 0 }, sat_6_3_xp: { type: Number, default: 0 },
        sat_6_4: { type: Number, default: 0 }, sat_6_4_h: { type: Number, default: 0 }, sat_6_4_xp: { type: Number, default: 0 },
        sat_6_5: { type: Number, default: 0 }, sat_6_5_h: { type: Number, default: 0 }, sat_6_5_xp: { type: Number, default: 0 },

        //GEM
        sat_7_1: { type: Number, default: 0 }, sat_7_1_h: { type: Number, default: 0 }, sat_7_1_xp: { type: Number, default: 0 },
        sat_7_2: { type: Number, default: 0 }, sat_7_2_h: { type: Number, default: 0 }, sat_7_2_xp: { type: Number, default: 0 },
        sat_7_3: { type: Number, default: 0 }, sat_7_3_h: { type: Number, default: 0 }, sat_7_3_xp: { type: Number, default: 0 },
        sat_7_4: { type: Number, default: 0 }, sat_7_4_h: { type: Number, default: 0 }, sat_7_4_xp: { type: Number, default: 0 },
        sat_7_5: { type: Number, default: 0 }, sat_7_5_h: { type: Number, default: 0 }, sat_7_5_xp: { type: Number, default: 0 },

        //FEBLED
        sat_8_1: { type: Number, default: 0 }, sat_8_1_h: { type: Number, default: 0 }, sat_8_1_xp: { type: Number, default: 0 },
        sat_8_2: { type: Number, default: 0 }, sat_8_2_h: { type: Number, default: 0 }, sat_8_2_xp: { type: Number, default: 0 },
        sat_8_3: { type: Number, default: 0 }, sat_8_3_h: { type: Number, default: 0 }, sat_8_3_xp: { type: Number, default: 0 },
        sat_8_4: { type: Number, default: 0 }, sat_8_4_h: { type: Number, default: 0 }, sat_8_4_xp: { type: Number, default: 0 },
        sat_8_5: { type: Number, default: 0 }, sat_8_5_h: { type: Number, default: 0 }, sat_8_5_xp: { type: Number, default: 0 },

        //SPECIAL
        sat_9_1: { type: Number, default: 0 }, sat_9_1_h: { type: Number, default: 0 }, sat_9_1_xp: { type: Number, default: 0 },
        sat_9_2: { type: Number, default: 0 }, sat_9_2_h: { type: Number, default: 0 }, sat_9_2_xp: { type: Number, default: 0 },
        sat_9_3: { type: Number, default: 0 }, sat_9_3_h: { type: Number, default: 0 }, sat_9_3_xp: { type: Number, default: 0 },
        sat_9_4: { type: Number, default: 0 }, sat_9_4_h: { type: Number, default: 0 }, sat_9_4_xp: { type: Number, default: 0 },
        sat_9_5: { type: Number, default: 0 }, sat_9_5_h: { type: Number, default: 0 }, sat_9_5_xp: { type: Number, default: 0 },

        sat_9_6: { type: Number, default: 0 }, sat_9_6_h: { type: Number, default: 0 }, sat_9_6_xp: { type: Number, default: 0 },
        sat_9_7: { type: Number, default: 0 }, sat_9_7_h: { type: Number, default: 0 }, sat_9_7_xp: { type: Number, default: 0 },
        sat_9_8: { type: Number, default: 0 }, sat_9_8_h: { type: Number, default: 0 }, sat_9_8_xp: { type: Number, default: 0 },
        sat_9_9: { type: Number, default: 0 }, sat_9_9_h: { type: Number, default: 0 }, sat_9_9_xp: { type: Number, default: 0 },
        sat_9_10: { type: Number, default: 0 }, sat_9_10_h: { type: Number, default: 0 }, sat_9_10_xp: { type: Number, default: 0 },

        //PETRON
        sat_11_1: { type: Number, default: 0 }, sat_11_1_h: { type: Number, default: 0 }, sat_11_1_xp: { type: Number, default: 0 },
        sat_11_2: { type: Number, default: 0 }, sat_11_2_h: { type: Number, default: 0 }, sat_11_2_xp: { type: Number, default: 0 },
        sat_11_3: { type: Number, default: 0 }, sat_11_3_h: { type: Number, default: 0 }, sat_11_3_xp: { type: Number, default: 0 },
        sat_11_4: { type: Number, default: 0 }, sat_11_4_h: { type: Number, default: 0 }, sat_11_4_xp: { type: Number, default: 0 },
        sat_11_5: { type: Number, default: 0 }, sat_11_5_h: { type: Number, default: 0 }, sat_11_5_xp: { type: Number, default: 0 },

        //CUSTOM PETRON
        //LINN
        sat_10_1: { type: Number, default: 0 }, sat_10_1_h: { type: Number, default: 0 }, sat_10_1_xp: { type: Number, default: 0 },
        sat_10_2: { type: Number, default: 0 }, sat_10_2_h: { type: Number, default: 0 }, sat_10_2_xp: { type: Number, default: 0 },
        sat_10_3: { type: Number, default: 0 }, sat_10_3_h: { type: Number, default: 0 }, sat_10_3_xp: { type: Number, default: 0 },
        sat_10_4: { type: Number, default: 0 }, sat_10_4_h: { type: Number, default: 0 }, sat_10_4_xp: { type: Number, default: 0 },
        sat_10_5: { type: Number, default: 0 }, sat_10_5_h: { type: Number, default: 0 }, sat_10_5_xp: { type: Number, default: 0 },
        //MO JI
        sat_10_6: { type: Number, default: 0 }, sat_10_6_h: { type: Number, default: 0 }, sat_10_6_xp: { type: Number, default: 0 },
        sat_10_7: { type: Number, default: 0 }, sat_10_7_h: { type: Number, default: 0 }, sat_10_7_xp: { type: Number, default: 0 },
        //MICKEY
        sat_10_8: { type: Number, default: 0 }, sat_10_8_h: { type: Number, default: 0 }, sat_10_8_xp: { type: Number, default: 0 },
        sat_10_9: { type: Number, default: 0 }, sat_10_9_h: { type: Number, default: 0 }, sat_10_9_xp: { type: Number, default: 0 },
        sat_10_10: { type: Number, default: 0 }, sat_10_10_h: { type: Number, default: 0 }, sat_10_10_xp: { type: Number, default: 0 },
        //swttie_jenis
        sat_10_11: { type: Number, default: 0 }, sat_10_11_h: { type: Number, default: 0 }, sat_10_11_xp: { type: Number, default: 0 },
        sat_10_12: { type: Number, default: 0 }, sat_10_12_h: { type: Number, default: 0 }, sat_10_12_xp: { type: Number, default: 0 },
        sat_10_13: { type: Number, default: 0 }, sat_10_13_h: { type: Number, default: 0 }, sat_10_13_xp: { type: Number, default: 0 },
        //passion_cream
        sat_10_14: { type: Number, default: 0 }, sat_10_14_h: { type: Number, default: 0 }, sat_10_14_xp: { type: Number, default: 0 },
        //jade
        sat_10_15: { type: Number, default: 0 }, sat_10_15_h: { type: Number, default: 0 }, sat_10_15_xp: { type: Number, default: 0 },
        sat_10_16: { type: Number, default: 0 }, sat_10_16_h: { type: Number, default: 0 }, sat_10_16_xp: { type: Number, default: 0 },
        sat_10_17: { type: Number, default: 0 }, sat_10_17_h: { type: Number, default: 0 }, sat_10_17_xp: { type: Number, default: 0 },
        //linn
        sat_10_18: { type: Number, default: 0 }, sat_10_18_h: { type: Number, default: 0 }, sat_10_18_xp: { type: Number, default: 0 },
        sat_10_19: { type: Number, default: 0 }, sat_10_19_h: { type: Number, default: 0 }, sat_10_19_xp: { type: Number, default: 0 },
        sat_10_20: { type: Number, default: 0 }, sat_10_20_h: { type: Number, default: 0 }, sat_10_20_xp: { type: Number, default: 0 },
        //moka
        sat_10_21: { type: Number, default: 0 }, sat_10_21_h: { type: Number, default: 0 }, sat_10_21_xp: { type: Number, default: 0 },
        sat_10_22: { type: Number, default: 0 }, sat_10_22_h: { type: Number, default: 0 }, sat_10_22_xp: { type: Number, default: 0 },
        sat_10_23: { type: Number, default: 0 }, sat_10_23_h: { type: Number, default: 0 }, sat_10_23_xp: { type: Number, default: 0 },


        //BOT
        sat_12_1: { type: Number, default: 0 }, sat_12_1_h: { type: Number, default: 0 }, sat_12_1_xp: { type: Number, default: 0 },
        sat_12_2: { type: Number, default: 0 }, sat_12_2_h: { type: Number, default: 0 }, sat_12_2_xp: { type: Number, default: 0 },
        sat_12_3: { type: Number, default: 0 }, sat_12_3_h: { type: Number, default: 0 }, sat_12_3_xp: { type: Number, default: 0 },
        sat_12_4: { type: Number, default: 0 }, sat_12_4_h: { type: Number, default: 0 }, sat_12_4_xp: { type: Number, default: 0 },
        sat_12_5: { type: Number, default: 0 }, sat_12_5_h: { type: Number, default: 0 }, sat_12_5_xp: { type: Number, default: 0 },

        //DISTORTED
        sat_13_1: { type: Number, default: 0 }, sat_13_1_h: { type: Number, default: 0 }, sat_13_1_xp: { type: Number, default: 0 },
        sat_13_2: { type: Number, default: 0 }, sat_13_2_h: { type: Number, default: 0 }, sat_13_2_xp: { type: Number, default: 0 },
        sat_13_3: { type: Number, default: 0 }, sat_13_3_h: { type: Number, default: 0 }, sat_13_3_xp: { type: Number, default: 0 },
        sat_13_4: { type: Number, default: 0 }, sat_13_4_h: { type: Number, default: 0 }, sat_13_4_xp: { type: Number, default: 0 },
        sat_13_5: { type: Number, default: 0 }, sat_13_5_h: { type: Number, default: 0 }, sat_13_5_xp: { type: Number, default: 0 },

        //HIDDEN
        sat_14_1: { type: Number, default: 0 }, sat_14_1_h: { type: Number, default: 0 }, sat_14_1_xp: { type: Number, default: 0 },
        sat_14_2: { type: Number, default: 0 }, sat_14_2_h: { type: Number, default: 0 }, sat_14_2_xp: { type: Number, default: 0 },
        sat_14_3: { type: Number, default: 0 }, sat_14_3_h: { type: Number, default: 0 }, sat_14_3_xp: { type: Number, default: 0 },
        sat_14_4: { type: Number, default: 0 }, sat_14_4_h: { type: Number, default: 0 }, sat_14_4_xp: { type: Number, default: 0 },
        sat_14_5: { type: Number, default: 0 }, sat_14_5_h: { type: Number, default: 0 }, sat_14_5_xp: { type: Number, default: 0 },

        //JUJUTSU KAISEN
        sat_15_1: { type: Number, default: 0 }, sat_15_1_h: { type: Number, default: 0 }, sat_15_1_xp: { type: Number, default: 0 },
        sat_15_2: { type: Number, default: 0 }, sat_15_2_h: { type: Number, default: 0 }, sat_15_2_xp: { type: Number, default: 0 },
        sat_15_3: { type: Number, default: 0 }, sat_15_3_h: { type: Number, default: 0 }, sat_15_3_xp: { type: Number, default: 0 },
        sat_15_4: { type: Number, default: 0 }, sat_15_4_h: { type: Number, default: 0 }, sat_15_4_xp: { type: Number, default: 0 },
        sat_15_5: { type: Number, default: 0 }, sat_15_5_h: { type: Number, default: 0 }, sat_15_5_xp: { type: Number, default: 0 },

        //ONE PIECE
        sat_16_1: { type: Number, default: 0 }, sat_16_1_h: { type: Number, default: 0 }, sat_16_1_xp: { type: Number, default: 0 },
        sat_16_2: { type: Number, default: 0 }, sat_16_2_h: { type: Number, default: 0 }, sat_16_2_xp: { type: Number, default: 0 },
        sat_16_3: { type: Number, default: 0 }, sat_16_3_h: { type: Number, default: 0 }, sat_16_3_xp: { type: Number, default: 0 },
        sat_16_4: { type: Number, default: 0 }, sat_16_4_h: { type: Number, default: 0 }, sat_16_4_xp: { type: Number, default: 0 },
        sat_16_5: { type: Number, default: 0 }, sat_16_5_h: { type: Number, default: 0 }, sat_16_5_xp: { type: Number, default: 0 },

        //ONE PUNCH MAN
        sat_17_1: { type: Number, default: 0 }, sat_17_1_h: { type: Number, default: 0 }, sat_17_1_xp: { type: Number, default: 0 },
        sat_17_2: { type: Number, default: 0 }, sat_17_2_h: { type: Number, default: 0 }, sat_17_2_xp: { type: Number, default: 0 },
        sat_17_3: { type: Number, default: 0 }, sat_17_3_h: { type: Number, default: 0 }, sat_17_3_xp: { type: Number, default: 0 },
        sat_17_4: { type: Number, default: 0 }, sat_17_4_h: { type: Number, default: 0 }, sat_17_4_xp: { type: Number, default: 0 },
        sat_17_5: { type: Number, default: 0 }, sat_17_5_h: { type: Number, default: 0 }, sat_17_5_xp: { type: Number, default: 0 },

        //MASHLE
        sat_18_1: { type: Number, default: 0 }, sat_18_1_h: { type: Number, default: 0 }, sat_18_1_xp: { type: Number, default: 0 },
        sat_18_2: { type: Number, default: 0 }, sat_18_2_h: { type: Number, default: 0 }, sat_18_2_xp: { type: Number, default: 0 },
        sat_18_3: { type: Number, default: 0 }, sat_18_3_h: { type: Number, default: 0 }, sat_18_3_xp: { type: Number, default: 0 },
        sat_18_4: { type: Number, default: 0 }, sat_18_4_h: { type: Number, default: 0 }, sat_18_4_xp: { type: Number, default: 0 },
        sat_18_5: { type: Number, default: 0 }, sat_18_5_h: { type: Number, default: 0 }, sat_18_5_xp: { type: Number, default: 0 },

        //DEMON SLAYER
        sat_19_1: { type: Number, default: 0 }, sat_19_1_h: { type: Number, default: 0 }, sat_19_1_xp: { type: Number, default: 0 },
        sat_19_2: { type: Number, default: 0 }, sat_19_2_h: { type: Number, default: 0 }, sat_19_2_xp: { type: Number, default: 0 },
        sat_19_3: { type: Number, default: 0 }, sat_19_3_h: { type: Number, default: 0 }, sat_19_3_xp: { type: Number, default: 0 },
        sat_19_4: { type: Number, default: 0 }, sat_19_4_h: { type: Number, default: 0 }, sat_19_4_xp: { type: Number, default: 0 },
        sat_19_5: { type: Number, default: 0 }, sat_19_5_h: { type: Number, default: 0 }, sat_19_5_xp: { type: Number, default: 0 },

        //COLLECTION GIRL
        sat_20_1: { type: Number, default: 0 }, sat_20_1_h: { type: Number, default: 0 }, sat_20_1_xp: { type: Number, default: 0 },
        sat_20_2: { type: Number, default: 0 }, sat_20_2_h: { type: Number, default: 0 }, sat_20_2_xp: { type: Number, default: 0 },
        sat_20_3: { type: Number, default: 0 }, sat_20_3_h: { type: Number, default: 0 }, sat_20_3_xp: { type: Number, default: 0 },
        sat_20_4: { type: Number, default: 0 }, sat_20_4_h: { type: Number, default: 0 }, sat_20_4_xp: { type: Number, default: 0 },
        sat_20_5: { type: Number, default: 0 }, sat_20_5_h: { type: Number, default: 0 }, sat_20_5_xp: { type: Number, default: 0 },

        //NARUTO
        sat_21_1: { type: Number, default: 0 }, sat_21_1_h: { type: Number, default: 0 }, sat_21_1_xp: { type: Number, default: 0 },
        sat_21_2: { type: Number, default: 0 }, sat_21_2_h: { type: Number, default: 0 }, sat_21_2_xp: { type: Number, default: 0 },
        sat_21_3: { type: Number, default: 0 }, sat_21_3_h: { type: Number, default: 0 }, sat_21_3_xp: { type: Number, default: 0 },
        sat_21_4: { type: Number, default: 0 }, sat_21_4_h: { type: Number, default: 0 }, sat_21_4_xp: { type: Number, default: 0 },
        sat_21_5: { type: Number, default: 0 }, sat_21_5_h: { type: Number, default: 0 }, sat_21_5_xp: { type: Number, default: 0 },

        //HANUMAN
        sat_22_1: { type: Number, default: 0 }, sat_22_1_h: { type: Number, default: 0 }, sat_22_1_xp: { type: Number, default: 0 },
        sat_22_2: { type: Number, default: 0 }, sat_22_2_h: { type: Number, default: 0 }, sat_22_2_xp: { type: Number, default: 0 },
        sat_22_3: { type: Number, default: 0 }, sat_22_3_h: { type: Number, default: 0 }, sat_22_3_xp: { type: Number, default: 0 },
        sat_22_4: { type: Number, default: 0 }, sat_22_4_h: { type: Number, default: 0 }, sat_22_4_xp: { type: Number, default: 0 },
        sat_22_5: { type: Number, default: 0 }, sat_22_5_h: { type: Number, default: 0 }, sat_22_5_xp: { type: Number, default: 0 },

        //CHAINSAW MAN
        sat_23_1: { type: Number, default: 0 }, sat_23_1_h: { type: Number, default: 0 }, sat_23_1_xp: { type: Number, default: 0 },
        sat_23_2: { type: Number, default: 0 }, sat_23_2_h: { type: Number, default: 0 }, sat_23_2_xp: { type: Number, default: 0 },
        sat_23_3: { type: Number, default: 0 }, sat_23_3_h: { type: Number, default: 0 }, sat_23_3_xp: { type: Number, default: 0 },
        sat_23_4: { type: Number, default: 0 }, sat_23_4_h: { type: Number, default: 0 }, sat_23_4_xp: { type: Number, default: 0 },
        sat_23_5: { type: Number, default: 0 }, sat_23_5_h: { type: Number, default: 0 }, sat_23_5_xp: { type: Number, default: 0 },

        //KOF
        sat_24_1: { type: Number, default: 0 }, sat_24_1_h: { type: Number, default: 0 }, sat_24_1_xp: { type: Number, default: 0 },
        sat_24_2: { type: Number, default: 0 }, sat_24_2_h: { type: Number, default: 0 }, sat_24_2_xp: { type: Number, default: 0 },
        sat_24_3: { type: Number, default: 0 }, sat_24_3_h: { type: Number, default: 0 }, sat_24_3_xp: { type: Number, default: 0 },
        sat_24_4: { type: Number, default: 0 }, sat_24_4_h: { type: Number, default: 0 }, sat_24_4_xp: { type: Number, default: 0 },
        sat_24_5: { type: Number, default: 0 }, sat_24_5_h: { type: Number, default: 0 }, sat_24_5_xp: { type: Number, default: 0 },

        //KAIJU NO 8
        sat_25_1: { type: Number, default: 0 }, sat_25_1_h: { type: Number, default: 0 }, sat_25_1_xp: { type: Number, default: 0 },
        sat_25_2: { type: Number, default: 0 }, sat_25_2_h: { type: Number, default: 0 }, sat_25_2_xp: { type: Number, default: 0 },
        sat_25_3: { type: Number, default: 0 }, sat_25_3_h: { type: Number, default: 0 }, sat_25_3_xp: { type: Number, default: 0 },
        sat_25_4: { type: Number, default: 0 }, sat_25_4_h: { type: Number, default: 0 }, sat_25_4_xp: { type: Number, default: 0 },
        sat_25_5: { type: Number, default: 0 }, sat_25_5_h: { type: Number, default: 0 }, sat_25_5_xp: { type: Number, default: 0 },

        //VERY COOL
        sat_26_1: { type: Number, default: 0 }, sat_26_1_h: { type: Number, default: 0 }, sat_26_1_xp: { type: Number, default: 0 },
        sat_26_2: { type: Number, default: 0 }, sat_26_2_h: { type: Number, default: 0 }, sat_26_2_xp: { type: Number, default: 0 },
        sat_26_3: { type: Number, default: 0 }, sat_26_3_h: { type: Number, default: 0 }, sat_26_3_xp: { type: Number, default: 0 },
        sat_26_4: { type: Number, default: 0 }, sat_26_4_h: { type: Number, default: 0 }, sat_26_4_xp: { type: Number, default: 0 },
        sat_26_5: { type: Number, default: 0 }, sat_26_5_h: { type: Number, default: 0 }, sat_26_5_xp: { type: Number, default: 0 },

        sat_26_6: { type: Number, default: 0 }, sat_26_6_h: { type: Number, default: 0 }, sat_26_6_xp: { type: Number, default: 0 },
        sat_26_7: { type: Number, default: 0 }, sat_26_7_h: { type: Number, default: 0 }, sat_26_7_xp: { type: Number, default: 0 },
        sat_26_8: { type: Number, default: 0 }, sat_26_8_h: { type: Number, default: 0 }, sat_26_8_xp: { type: Number, default: 0 },
        sat_26_9: { type: Number, default: 0 }, sat_26_9_h: { type: Number, default: 0 }, sat_26_9_xp: { type: Number, default: 0 },
        sat_26_10: { type: Number, default: 0 }, sat_26_10_h: { type: Number, default: 0 }, sat_26_10_xp: { type: Number, default: 0 },
    },

    sa: {
        land: {
            land_a: { type: Boolean, default: true },
            land_b: { type: Boolean, default: false },
            land_c: { type: Boolean, default: false },
            land_d: { type: Boolean, default: false },
            land_e: { type: Boolean, default: false },
            land_f: { type: Boolean, default: false },
        },
        base: {
            base_bool: { type: Boolean, default: false },
        },
        event: {
            revive_date: { type: Date, default: '' },
        },
        GUI: {
            Heart: { type: Number, default: 5 },
        },
        item: {
            resource: {
                rag: { type: Number, default: 0 },
                stack: { type: Number, default: 0 },
                flower: { type: Number, default: 0 },
                log: { type: Number, default: 0 },
                stone: { type: Number, default: 0 },
            },
            food: {
                chocolate_bar: { type: Number, default: 5 },
                flower_soup: { type: Number, default: 0 },
            },
            medical: {
                bandage: { type: Number, default: 0 },
            },
            melee: {
                knife: {
                    knife_bool: { type: Boolean, default: true },
                    knife_percen: { type: Number, default: 100 },
                },
                spear: {
                    spear_bool: { type: Boolean, default: false },
                    spear_percen: { type: Number, default: 0 },
                },
                axe: {
                    axe_bool: { type: Boolean, default: false },
                    axe_percen: { type: Number, default: 0 },
                },
            },
            gun: {
                gun1: {
                    gun1_bool: { type: Boolean, default: false },
                    gun1_percen: { type: Number, default: 0 },
                },
            },
            armor: {
                top: {
                    armor1: {
                        armor1_bool: { type: Boolean, default: false },
                        armor1_percen: { type: Number, default: 0 },
                    },
                },
            },
        },
    },
});

module.exports = { userSchema };