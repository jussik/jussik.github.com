(() => {
let sqlJsPromise;
function getSqlJs() {
    return sqlJsPromise || (sqlJsPromise = initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.3.0/dist/${file}`
    }));
}

Vue.component("game-view", {
    props: ["game"],
    template: "#gameViewTemplate",
    methods: {
        showDetails: function() {
            console.log(this.$props.game.title);
            console.log(JSON.parse(JSON.stringify(this.$props.game)));
            this.$emit("show-screenshots", this.$props.game.screenshots);
        }
    }
});

const PlatformVisibility = { Visible: 0, Hidden: 1, Excluded: 2 };

window.app = new Vue({
    el: "#app",
    data: {
        loading: false,
        games: [],
        platformVisibility: {},
        platformClasses: ["visible", "hide", "exclude"],
        filter: "",
        screenshots: [],
        npointId: null,
        index: null
    },
    components: {
        agile: VueAgile
    },
    computed: {
        platforms: function() {
            const plats = new Set();
            for (let game of this.games) {
                for (let plat of game.platforms) {
                    plats.add(plat);
                }
            }
            return Array.from(plats).sort();
        },
        filteredGames: function() {
            if (!this.filter)
                return null;
            
            let res;
            try {
                res = this.index.search(this.filter);
            } catch(err) {
                console.error(err);
                return [];
            }
            
            return res
                .sort((a, b) => b.score - a.score)
                .map(e => this.gamesById[e.ref]);
        }
    },
    watch: {
        games: function(games) {
            if (games && games.length)
                setTimeout(() => this.$refs.findInput.focus());
        }
    },
    created: function() {
        this.npointId = new URLSearchParams(location.search).get("npoint");
        if (this.npointId) {
            const self = this;
            this.loading = true;
            fetch(`https://api.npoint.io/${this.npointId}`)
                .then(r => r.json())
                .then(function(games) {
                    self.games = games;
                    self.prepareGames();
                    self.loading = false;
                });
        } else {
            function loadFromStorage(key) {
                let json = localStorage[key];
                if (json) {
                    try {
                        if (json[0] !== "[" && json[0] !== "{") {
                            json = LZString.decompressFromUTF16(json);
                            if (!json)
                                throw new Error("Failed to decompress " + key);
                        }
                        return JSON.parse(json);
                    } catch (err) {
                        console.error(`Error loading ${key} from localStorage`);
                        console.error(err);
                        localStorage.removeItem("ggdb_games");
                        return null;
                    }
                }
            }

            this.games = loadFromStorage("ggdb_games") || this.games;
            this.prepareGames();
        }
    },
    methods: {
        debouncedFilter: _.debounce(function(e) {
            this.filter = e.target.value;
        }, 200),
        prepareGames: function() {
            const games = this.games;
            this.index = lunr(function () {
                this.ref("gameId");
                
                this.field("title");
                this.field("genres");
                this.field("themes");
                this.field("summary");
                this.field("year");
                
                games.forEach(g => this.add(g));
            });
            this.gamesById = _.keyBy(this.games, "gameId");
            this.sortByName();
        },
        loadGfNow: async function() {
            const res = await fetch("https://static.nvidiagrid.net/supported-public-game-list/locales/gfnpc-en-US.json?JSON");
            const json = await res.json();
            console.log(`GFN returned ${json.length} entries`);
            const byName = {};
            const platMap = {
                "Steam": "steam",
                "Epic": "epic",
                "Ubisoft Connect": "uplay"
            }
            json.forEach(g => (byName[g.title.toLowerCase()] ||= []).push(platMap[g.store]));
            this.games.forEach(g => {
                const gfnPlats = byName[g.title.toLowerCase()];
                if (gfnPlats && !g.platforms.includes("zgfn") && g.platforms.some(p => gfnPlats.includes(p)))
                    g.platforms.push("zgfn");
            })
        },
        loadDbFile: function (ev) {
            if (!ev.dataTransfer)
                return;
            const file = ev.dataTransfer.files[0];
            if (!file || file.name !== 'galaxy-2.0.db')
                return;
            this.loading = true;
            const r = new FileReader();
            r.onload = () => {
                getSqlJs().then(sqlJs => {
                    setTimeout(() => {
                        // in a timeout to ensure loading text is visible
                        const db = new sqlJs.Database(new Uint8Array(r.result));
                        this.importGames(db);
                        this.loading = false;
                    });
                });
            };
            r.readAsArrayBuffer(file);
        },
        importGames: function (db) {
            function processTitles(type, obj) {
                if (type === "title")
                    return obj;
                for (let k in obj) {
                    if (k === "title") {
                        obj[type] = obj[k];
                        delete obj[k];
                        return obj;
                    }
                }
                return obj;
            }

            console.time("importing");
            const stmt = db.prepare(`
                select rp.gameid, p.releasekey, ifnull(pc.platform, 'gog') as platform, ppd.addeddate, t.type, p.value
                from GamePieces p
                join LibraryReleases lr on p.releasekey = lr.releasekey
                join ReleaseProperties rp on p.releasekey = rp.releasekey
                    and isvisibleinlibrary = 1
                join GamePieceTypes t on p.gamePieceTypeId = t.id
                left join PlatformConnections pc on p.releasekey like pc.platform || '_%'
                    and pc.connectionstate = 'Connected'
                left join ProductPurchaseDates ppd on ppd.gamereleasekey = p.releasekey
                left join SubscriptionReleases sub on sub.licenseid = lr.id
                where (pc.platform is not null or p.releasekey like 'gog_%');`);
            const gamesById = {};
            try {
                while(stmt.step()) {
                    const [gameId, releaseKey, platform, addedDate, type, json] = stmt.get();
                    const game = gamesById[gameId] || (gamesById[gameId] = { });
                    const release = game[releaseKey] || (game[releaseKey] = { gameId, platform, addedDate });
                    Object.assign(release, processTitles(type, JSON.parse(json)));
                }
            } finally {
                stmt.free();
            }

            const games = Object.values(gamesById)
                .map(rs => {
                    const sortedReleases = Object.values(rs)
                        // games without verticalCover are not visible in galaxy either
                        .filter(g => g.verticalCover)
                        // sort first by title length, then by platform name to get rid of "Windows 10 edition" and "Origin Key"
                        .sort((a, b) => (a.title.length - b.title.length) || a.platform.localeCompare(b.platform));
                    return sortedReleases.length ? {
                        ...sortedReleases[0],
                        otherPlatforms: sortedReleases.slice(1),
                        addedDate: sortedReleases
                            .map(r => r.addedDate)
                            .reduce((a, b) => a < b ? a : b, null)
                    } : null;
                })
                .filter(r => r)
                .map(g => {
                    const plats = new Set(g.otherPlatforms.map(r => r.platform));
                    plats.add(g.platform);
                    const steamRelease = g.releases.find(gr => gr.startsWith("steam_"));
                    let year = g.releaseDate && new Date(g.releaseDate * 1000).getFullYear();
                    if (!year || year <= 1970)
                        year = null;
                    const title = g.title || g.originalTitle;
                    const sortingTitle = g.sortingTitle || g.originalSortingTitle;
                    return {
                        gameId: g.gameId,
                        addedDate: g.addedDate || "",
                        steamAppId: steamRelease ? steamRelease.split("_")[1] : undefined,
                        title,
                        sortingTitle: title !== sortingTitle ? sortingTitle : undefined,
                        verticalCover: g.verticalCover,
                        genres: g.genres,
                        themes: g.themes,
                        summary: g.summary,
                        year: year,
                        platforms: Array.from(plats.values()).sort(),
                        screenshots: g.screenshots
                            ?  g.screenshots.map(f => f.replace("{formatter}", "").replace("{ext}", "jpg").replace("_.", "."))
                            : [],
                        score: g.criticsScore ? g.criticsScore.toFixed(0) : undefined
                    }
                });
            console.timeEnd("importing");

            this.games = games;
            this.saveGames();
            this.prepareGames();
        },
        toClipboard: function() {
            const elem = document.getElementById("exportElem");
            elem.value = "[" + this.games.map(JSON.stringify).join(",\n") + "]";
            elem.select();
            document.execCommand("copy");
            elem.value = "";
            if (!this.npointId) {
                alert("Data copied to clipboard");
            } else if(confirm("Data copied to clipboard - open npoint editor page?")){
                window.open(`https://www.npoint.io/docs/${this.npointId}`, "_blank");
            }
        },
        togglePlatform: function (plat) {
            Vue.set(this.platformVisibility, plat, ((this.platformVisibility[plat] || 0) + 1) % 3);
        },
        isGameVisible: function (game) {
            if (!game.platforms.some(p => (this.platformVisibility[p] || 0) === PlatformVisibility.Visible))
                return false;
            if (game.platforms.some(p => (this.platformVisibility[p] || 0) === PlatformVisibility.Excluded))
                return false;
            return true;
        },
        sortByName: function() {
            this.games.sort((a, b) => (a.sortingTitle || a.title).localeCompare(b.sortingTitle || b.title));
        },
        sortByYear: function() {
            this.games.sort((a, b) => {
                return (b.year || 0) - (a.year || 0)
                    // fall back to sorting by title if same score
                    || (a.sortingTitle || a.title).localeCompare(b.sortingTitle || b.title);
            });
        },
        sortByAdded: function() {
            this.games.sort((a, b) => b.addedDate.localeCompare(a.addedDate)
                || (a.sortingTitle || a.title).localeCompare(b.sortingTitle || b.title));
        },
        sortByScore: function() {
            this.games.sort((a, b) => (b.score || 0) - (a.score || 0)
                || (a.sortingTitle || a.title).localeCompare(b.sortingTitle || b.title));
        },
        shuffle: function() {
            const games = this.games;
            for (let i = games.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [games[i], games[j]] = [games[j], games[i]];
            }
            games.splice(); // notify Vue
        },
        showScreenshots: function (screenshots) {
            this.screenshots = screenshots;
        },
        saveImpl: function (caller, key, data) {
            console.time("saving " + key);
            const enableCompression = localStorage.ggdb_enableCompression === "true";
            try {
                // ignore private props like _textIndex
                let json = JSON.stringify(data, (k, v) => k[0] === "_" ? undefined : v);
                if (enableCompression)
                    json = LZString.compressToUTF16(json);
                localStorage[key] = json;
            } catch (err) {
                console.error("Failed to write to localStorage");
                console.error(err);
                if (!enableCompression) {
                    console.log("If insufficient storage space, try again using compression:");
                    console.log(`localStorage.ggdb_enableCompression = true; ${caller}();`);
                }
                localStorage.removeItem("key");
            }
            console.timeEnd("saving " + key);
        },
        saveGames: function () {
            this.saveImpl("saveGames", "ggdb_games", this.games);
        },
    }
});
})();
