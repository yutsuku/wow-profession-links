// add
// export NODE_ENV=development
// to your env before starting npm
const config = require('../config')[process.env.NODE_ENV];
console.log(`Running in ${process.env.NODE_ENV} environment`);

const Eris = require("eris");

var bot = new Eris(config.discord.token);
var channels = config.discord.channels;

var lastMessageTimestamp = Date.now();
const messageThrottle = config.messageThrottle; // in ms

const path = require("path");
const fs = require("fs");
const os = require("os");

// dalaran pvp event thing
const rp = require('request-promise');
const cheerio = require('cheerio');
const parseString = require('xml2js').parseString;
const tournamentEventOptions = {
    uri: "https://www.dalaran-wow.com/pvp/",
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'DNT': '1',
    },
    transform: function (body) {
        return cheerio.load(body);
    }
};
const commandPattern = "^(\[[A-Za-z]+\]: )?";

// Htrade:51306:450:450:140E7D:4//+s/2uSr++N5Tn/27fdRJOcCL9/fPAk/fh9bcBBHA47/3//Lwj3D|h
// Htrade:([0-9]+):([0-9]{1,3}):([0-9]{1,3}):([A-Fa-f0-9]+):([A-Za-z0-9\+\/]+)
//
// LEGEND
// <> argument required
// [] argument optional
//
// !professions add <player name> <partial profession link>
// !professions delete <player name>
// !professions find <player name>
// !jc [page number]
//

var professions = {
    "Jewelcrafting": {
        "aliases": ["!jc", "!jewel", "!jewelcrafting"],
        "links": [
            " |cffffd000|Htrade:51311:450:450:140E7D:8/7WuqMtJzjpuMHAABIwHAAAg/Bg/vBAufnhAA+BAAAA6////7//+f3//u37t/bvbX0e7s//9/////////////////////D|h[Jewelcrafting]|h|r Evion",
            " |cffffd000|Htrade:51311:450:450:14421F:8//Xu+Nt9zj5vOHI0RRwXIBYx/Zv//BAAAAAAg+1IAAA6/37v77e3/1eDjzTnzLFTHsYms5nTIC8/D8Pw/RcCeZ+fo80giD|h[Jewelcrafting]|h|r Stabolina",
            " |cffffd000|Htrade:51311:450:450:1325AE:8f6UsqMsJyjpmMHAAAAwHIAAg/Bg/vBAAAAAAA+BAAAA6/37v7re2f1eDjSWlhPBSnEYik9nEok+/D8P4/TAA+p6d48SBiC|h[Jewelcrafting]|h|r Sicck"
        ]
    },
    "Engineering": {
        "aliases": ["!engi", "!engineering"],
        "links": [
            " |cffffd000|Htrade:51306:450:450:1454C4:4//+svW+ir+/NbTn/2LfJRCOMAHCAAPAk/fg9bMBBDA45/3//Lwj3F|h[Engineering]|h|r Kaidi",
            " |cffffd000|Htrade:51306:450:450:140E7D:4//+s/2uSr++N5Tn/27fdRJOcCL9/fPAk/fh9bcBBHA47/3//Lwj3D|h[Engineering]|h|r Evion"
        ]
    },
    "Leatherworking": {
        "aliases": ["!lw", "!leatherworking"],
        "links": [
            " |cffffd000|Htrade:51302:450:450:1406FE:e+2vHPrvO/Z8tt3ZouAA+KhWLSMp76hAIAAAAAc+//AAABAAWAMFAAAAAIw8A4/vK5/////////////////HgAAw/3/D|h[Leatherworking]|h|r Saphyrah",
            " |cffffd000|Htrade:51302:450:450:1406EF:e+3FlPCtH/Z4/sfAo8AAeIJCDAMAr4hAIAAAAAc8//EcAIAAEFAAAAAAAAwsA4/vK5//////fz///////M/EgAAwI05D|h[Leatherworking]|h|r Varform",
            " |cffffd000|Htrade:51302:450:450:140934:e+WFFPCtCvZ4vsdEIYAAeIBABAAAAwxAIAAAAAcM/NYAAAAAEQTEAAAAAAwwA4/vK5//////////////PIFcgAAw/3ZD|h[Leatherworking]|h|r Oddbjorg"
        ]
    },
    "Alchemy": {
        "aliases": ["!alch", "!alchemy"],
        "links": [
            " |cffffd000|Htrade:51304:450:450:159849:WNtGyR/ndlc/PANABEADpCAA0kC/oAC/7/DAA8/v+//n|h[Alchemy]|h|r Hte",
            " |cffffd000|Htrade:51304:450:450:14702D:W9vvyB/X/VM/OgPAhEADhCAA+zJ/oAC/////D8/////v|h[Alchemy]|h|r Kaidyvaine",
            " |cffffd000|Htrade:51304:450:450:1420DB:WNtCwRvHdFc/OhMAAEADrCABx2K/oAC/7///L87v/3/n|h[Alchemy]|h|r Woggle"
        ]
    },
    "Enchanting": {
        "aliases": ["!ench", "!enchant", "!enchanting"],
        "links": [
            " |cffffd000|Htrade:51313:450:450:1406FF:4/+/b7a8f9Z7mszvvLtPBAAAwBGABsAA4XzC107v2JV/H+///sT|h[Enchanting]|h|r Kabyra",
            " |cffffd000|Htrade:51313:460:460:155D15:47Ofb6a8f5Z7msynvLJPAAAAwBGABsAA4XzC807/+Z3/H+///PT|h[Enchanting]|h|r Shadolina",
            " |cffffd000|Htrade:51313:450:450:13A1E7:4///7/f+f/b7nsyvvrJPAAAAwBGADsAA7XzC107v+bV/H+///lT|h[Enchanting]|h|r Pisvlek"
        ]
    },
    "Tailoring": {
        "aliases": ["!tailo", "!tailoring"],
        "links": [
            " |cffffd000|Htrade:51309:434:450:140E1E:4+/+rqpIy9jj5/PQ07CZtXDZ3X3nNzlLAKIAA4FR83MAAAAgAANACAYI+////CPW3Pw9/fwAAA|h[Tailoring]|h|r Magepwnage",
            " |cffffd000|Htrade:51309:450:450:1454C4:4+/+rqoIyfjD6/PQ07CRtXDIyd33NzlLIAAAA4Ef8PAEAAAAAAFACAAA+///fC/+z//9/fwAAB|h[Tailoring]|h|r Kaidi",
            " |cffffd000|Htrade:51309:450:450:1368DE:4//+vv6Lyfrn+/vx2/axt3nKyX33P39LKsAQA+FR8/YADAgxfAtAGgyo////fC/////9//0A8B|h[Tailoring]|h|r Skipopidid"
        ]
    },
    "Cooking": {
        "aliases": ["!cook", "!chief", "!cooking", "!sauce"],
        "links": [
            " |cffffd000|Htrade:51296:450:450:14421F:G0qcedHn9/5DH//7/e5///////g/XKA|h[Cooking]|h|r Stabolina",
            " |cffffd000|Htrade:51296:450:450:140E7D:Gkqd+dv3//9fv//7//v///////gDUKA|h[Cooking]|h|r Evion"
        ]
    },
    "Blacksmithing": {
        "aliases": ["!bs", "!blacksmith"],
        "links": [
            " |cffffd000|Htrade:51300:450:450:7652:2///d6nPreMA/Pob5///s+/dcjCAUECg/AQAAAAA8/DHAAQgAAT///7////AAJA////w////////////vBAw///H|h[Blacksmithing]|h|r Caydus",
            " |cffffd000|Htrade:51300:450:450:14FC67:2v22MAjCicMA/FoJ5zqyg+BMABAAUAAAfAAAAAAA8/DAAAQAgAS9XA6//DAAAAA////w/f8/////////LAAA0/7H|h[Blacksmithing]|h|r Mockingray",
            " |cffffd000|Htrade:51300:450:450:141DD8:2////r/PrfMA/X///3/+t+9f5zCAUMQgfAAAAAAA8//AgAw66xx7//////PAAAA////w////////////PAAw///H|h[Blacksmithing]|h|r Hornnee"
        ]
    },
    "Inscription": {
        "aliases": ["!insc", "!glyphs", "!inscription"],
        "links": [
            " |cffffd000|Htrade:45363:447:450:70DBD:g////7////3///////////////////////////////////////////////////////////////f|h[Inscription]|h|r Tylordian",
            " |cffffd000|Htrade:45363:442:450:127D93:g////7HLp9w////B8/Dx/Ph+/D+/Vy//A+/Rw/fC+////pIwTOghAB/////PgBYr4/LkT3CUGge|h[Inscription]|h|r Hollander",
            " |cffffd000|Htrade:45363:448:450:149F07:g////7/bt/w////q8/zz/fp//z//37/Pe//d5/vK+////dshP32993/////PHkfDT+DCKEUTChf|h[Inscription]|h|r Yamuna"
        ]
    },
};

function getProfessionLink(message) {
    for (const [profession, data] of Object.entries(professions)) {
        for (let alias of data.aliases) {
            alias = "^(\[[A-Za-z]+\]: )?" + alias + "$" // turn alias into regex
            if (message.match(alias)) {
                return data.links;
            }
        }
    }
}
 
bot.on("ready", async () => { // When the bot is ready
    console.log("Ready!"); // Log "Ready!"
});

async function downloadAnibe() {
    var response = {};
    try {
        return await rp({
            uri: "http://api.anidb.net:9001/httpapi?protover=1&request=randomrecommendation&clientver=" + config.anidb.version + "&client=" + config.anidb.client,
            transform: function (body) {
                return body;
            },
            gzip: true
        });
    }
    catch (err) {}
}

async function getTournamentStats() {
    const response = {
        alliance: {
            pvp: null,
            pve: null
        },
        horde: {
            pvp: null,
            pve: null
        },
        error: null
    };

    try {
        var $ = await rp(tournamentEventOptions);
        $(".sidebar-content > .leaderboard-content-block span[style]").each(function(i, element) {
            if (i === 0) {
                response.alliance.pve = $(this).text().trim();
            } else if (i === 1) {
                response.horde.pve = $(this).text().trim();
            } else if (i === 2) {
                response.alliance.pvp = $(this).text().trim();
            } else if (i === 3) {
                response.horde.pvp = $(this).text().trim();
            }
        });

        // pvp response must be a number
        response.alliance.pvp = +response.alliance.pvp;
        response.horde.pvp = +response.horde.pvp;

        if ( (typeof response.alliance.pvp === 'number' && !isNaN(response.alliance.pvp)) === false ) {
            response.error = true;
        }

        if ( (typeof response.horde.pvp === 'number' && !isNaN(response.horde.pvp)) === false ) {
            response.error = true;
        }

        Object.values(response.alliance).forEach(e => {
        if (e.length > 10) {
            response.error = true;
        }
        });

        Object.values(response.horde).forEach(e => {
            if (e.length > 10) {
                response.error = true;
            }
        });
    }
    catch (err) {
        console.log('HTTP Code: ' + err.statusCode);
        console.log('Error name: ' + err.name);
        console.log(err.error);
        response.error = true;
    }

    return response;
}

async function randomAnibe() {
    let file = path.resolve(__dirname, "anibe.xml");
    let lifetime = config.anidb.cache.lifetime;

    if (fs.existsSync(file)) {
        let stats = fs.statSync(file);
        let seconds = Math.floor((new Date().getTime() - stats.mtime) / 1000);
        if (seconds > lifetime) {
            // need new file
            console.log("file is old, need new one");
            let newdata = await downloadAnibe();
            fs.writeFileSync(file, newdata);
        }
    } else {
        // make one
        console.log("no file, make one");
        let newdata = await downloadAnibe();
        console.log(newdata);
        fs.writeFileSync(file, newdata);
    }
    

    const contents = await fs.readFileSync(path.resolve(__dirname, file), "utf8");
    const result = await new Promise((resolve, reject) => 
        parseString(contents, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        }
    ));

    let max = result.randomrecommendation.recommendation.length-1;
    let min = 0;
    let random = Math.floor(Math.random() * (max - min + 1)) + min;
    let anibe = result.randomrecommendation
        .recommendation[random]
        .anime[0];

    let title = anibe.title[0]._;
    let type = anibe.type[0];
    let eps = anibe.episodecount[0];
    let date = anibe.startdate[0];
    let rating = anibe.ratings[0].permanent[0]._;
    rating = rating.replace(/(\d)(?=(\d{2})+(?!\d))/g, '$1,');
    let votes = anibe.ratings[0].permanent[0].$.count;
    let id = anibe.$.id;
    let baseurl = "https://batterybox.ml/anidb/";

    return `${title} (${type}, ${eps}ep), rated ${rating} by ${votes} users - ${baseurl}${id}`;
}

 
bot.on("messageCreate", async (msg) => { // When a message is created
    let now = Date.now();

    // throttle the bot
    if ( (lastMessageTimestamp+messageThrottle) > now ) {
        return;
    }

    if (msg.content === "!debug" && msg.channel.id === config.discord.testchannel) {
    	bot.createMessage(msg.channel.id, "Yes!");
        lastMessageTimestamp = now;
        return;
    }

    if (!channels.includes(msg.channel.id)) {
    	return;
    }

    if (msg.content.match(commandPattern + "!anime")) {
        let anibe = await randomAnibe();
        bot.createMessage(msg.channel.id, anibe);
        lastMessageTimestamp = now;
        return;
    }

    if (msg.content.match(commandPattern + "Chaika\\?")) {
        bot.createMessage(msg.channel.id, "Chaika");
        lastMessageTimestamp = now;
        return;
    }

    if (msg.content.match(commandPattern + "Chaika$")) {
        bot.createMessage(msg.channel.id, "mwee");
        lastMessageTimestamp = now;
        return;
    }

    if (links = getProfessionLink(msg.content)) {
        for (let link of links) {
            bot.createMessage(msg.channel.id, link); 
        }
        lastMessageTimestamp = now;
        return;
    }

    if (msg.content.match(commandPattern + "!pvp")) {
        let stats = await getTournamentStats();
        if (!stats.error) {
            bot.createMessage(msg.channel.id, `Alliance ${stats.alliance.pvp}, Horde ${stats.horde.pvp}`);
        } else {
            bot.createMessage(msg.channel.id, "Shocking truth! Doesn't work! Stupid!");
        }
        lastMessageTimestamp = now;
        return;
    }

    if (msg.content.match(commandPattern + "!pve")) {
        let stats = await getTournamentStats();
        if (!stats.error) {
            bot.createMessage(msg.channel.id, `Alliance ${stats.alliance.pve}, Horde ${stats.horde.pve}`);
        } else {
            bot.createMessage(msg.channel.id, "Shocking truth! Doesn't work! Stupid!");
        }
        lastMessageTimestamp = now;
        return;
    }
});
 
bot.connect(); // Get the bot to connect to Discord
