/// <reference path="_refs.ts"/>
var Tesp;
(function (Tesp) {
    (function (ChangeReason) {
        ChangeReason[ChangeReason["None"] = 0] = "None";
        ChangeReason[ChangeReason["SourceChange"] = 1] = "SourceChange";
        ChangeReason[ChangeReason["DestinationChange"] = 2] = "DestinationChange";
        ChangeReason[ChangeReason["MarkChange"] = 4] = "MarkChange";
        ChangeReason[ChangeReason["ContextChange"] = 7] = "ContextChange";
        ChangeReason[ChangeReason["FeatureChange"] = 8] = "FeatureChange";
        ChangeReason[ChangeReason["PathUpdate"] = 16] = "PathUpdate";
        ChangeReason[ChangeReason["ClearMenus"] = 32] = "ClearMenus";
        ChangeReason[ChangeReason["Any"] = 63] = "Any";
    })(Tesp.ChangeReason || (Tesp.ChangeReason = {}));
    var ChangeReason = Tesp.ChangeReason;
    var ChangeListener = (function () {
        function ChangeListener(reasons, func) {
            this.reasons = reasons;
            this.func = func;
        }
        ChangeListener.prototype.trigger = function (reason, data) {
            if ((this.reasons & reason) !== 0) {
                this.func(reason, data);
            }
        };
        return ChangeListener;
    })();
    Tesp.ChangeListener = ChangeListener;
    var Application = (function () {
        function Application() {
            var _this = this;
            this.listeners = [];
            this.element = document.body;
            this.loaded = window.fetch("data/data.json")
                .then(function (res) { return res.json(); })
                .then(function (data) {
                _this.context = new Tesp.Context(_this);
                _this.features = Tesp.Features.init();
                _this.path = new Tesp.Path(_this);
                _this.world = new Tesp.World(_this, data);
                _this.map = new Tesp.Map(_this, document.getElementById("map"));
                _this.controls = new Tesp.Controls(_this, document.getElementById("controls"));
                _this.ctxMenu = new Tesp.ContextMenu(_this);
                document.body.onmousedown = document.body.oncontextmenu = function () { return _this.triggerChange(ChangeReason.ClearMenus); };
                document.body.onkeydown = function (ev) {
                    if (ev.which === 27)
                        _this.triggerChange(ChangeReason.ClearMenus);
                };
                _this.toggleBodyClass("loading", false);
                return _this;
            });
        }
        Application.prototype.addChangeListener = function (reasons, func) {
            var listener = new ChangeListener(reasons, func);
            this.listeners.push(listener);
            return listener;
        };
        Application.prototype.removeChangeListener = function (listener) {
            var ix = this.listeners.indexOf(listener);
            if (ix > -1)
                this.listeners.splice(ix, 1);
        };
        Application.prototype.triggerChange = function (reason, data) {
            this.listeners.forEach(function (l) { return l.trigger(reason, data); });
        };
        Application.prototype.toggleBodyClass = function (name, enabled) {
            if (enabled) {
                document.body.classList.add(name);
            }
            else {
                document.body.classList.remove(name);
            }
        };
        return Application;
    })();
    Tesp.Application = Application;
    Tesp.appInstance = new Application();
})(Tesp || (Tesp = {}));
var Tesp;
(function (Tesp) {
    var Vec2 = (function () {
        function Vec2(x, y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            this.x = x;
            this.y = y;
        }
        Vec2.distance = function (src, dst) {
            return Math.sqrt(((dst.x - src.x) * (dst.x - src.x)) + ((dst.y - src.y) * (dst.y - src.y)));
        };
        Vec2.fromCell = function (x, y) {
            return new Vec2(x * Cell.width + Cell.widthOffset, y * Cell.height + Cell.heightOffset);
        };
        return Vec2;
    })();
    Tesp.Vec2 = Vec2;
    var Node = (function () {
        function Node(name, longName, pos, type, permanent) {
            if (permanent === void 0) { permanent = false; }
            this.name = name;
            this.longName = longName;
            this.pos = pos;
            this.type = type;
            this.permanent = permanent;
            this.id = Node.identity++;
            this.edges = [];
        }
        Node.identity = 1;
        return Node;
    })();
    Tesp.Node = Node;
    var Edge = (function () {
        function Edge(srcNode, destNode, cost) {
            this.srcNode = srcNode;
            this.destNode = destNode;
            this.cost = cost;
        }
        return Edge;
    })();
    Tesp.Edge = Edge;
    var Cell = (function () {
        function Cell() {
        }
        Cell.fromPosition = function (pos) {
            return new Vec2((pos.x - Cell.widthOffset) / Cell.width, (pos.y - Cell.heightOffset) / Cell.height);
        };
        Cell.width = 44.5;
        Cell.height = 44.6;
        Cell.widthOffset = 12;
        Cell.heightOffset = 35;
        return Cell;
    })();
    Tesp.Cell = Cell;
    var CellRow = (function () {
        function CellRow(y, x1, x2) {
            this.y = y;
            this.x1 = x1;
            this.x2 = x2;
            this.width = x2 - x1 + 1;
        }
        return CellRow;
    })();
    Tesp.CellRow = CellRow;
    var Area = (function () {
        function Area(target, rows) {
            this.target = target;
            this.rows = rows;
            this.minY = rows[0].y;
            this.maxY = rows[rows.length - 1].y;
        }
        Area.prototype.containsCell = function (pos) {
            return Area.containsCell(this, pos);
        };
        Area.containsCell = function (area, pos) {
            if (pos.y >= area.minY && pos.y < area.maxY + 1) {
                var row = area.rows[Math.floor(pos.y) - area.minY];
                return pos.x >= row.x1 && pos.x < row.x2 + 1;
            }
            return false;
        };
        return Area;
    })();
    Tesp.Area = Area;
})(Tesp || (Tesp = {}));
/// <reference path="_refs.ts"/>
var Tesp;
(function (Tesp) {
    var Context = (function () {
        function Context(app) {
            var _this = this;
            this.app = app;
            this.app.addChangeListener(Tesp.ChangeReason.MarkChange, function () {
                _this.app.toggleBodyClass("has-mark", _this.markNode != null);
            });
        }
        Context.prototype.setContextLocation = function (context, pos) {
            var name = this.app.world.getLandmarkName(pos) || this.app.world.getRegionName(pos);
            if (context === "source") {
                name = name || "You";
                this.setContextNode(context, new Tesp.Node(name, name, pos, "source"));
            }
            else if (context === "destination") {
                name = name || "Your destination";
                this.setContextNode(context, new Tesp.Node(name, name, pos, "destination"));
            }
            else if (context === "mark") {
                this.markNode = new Tesp.Node(name, name, pos, "mark");
                this.app.triggerChange(Tesp.ChangeReason.MarkChange);
            }
        };
        Context.prototype.setContextNode = function (context, node) {
            if (context === "source") {
                this.sourceNode = node;
                this.app.triggerChange(Tesp.ChangeReason.SourceChange);
            }
            else if (context === "destination") {
                this.destNode = node;
                this.app.triggerChange(Tesp.ChangeReason.DestinationChange);
            }
            else if (context === "mark") {
                var pos = node.pos;
                this.markNode = new Tesp.Node(node.longName, node.longName, pos, "mark");
                this.markNode.referenceId = node.referenceId || node.id;
                this.app.triggerChange(Tesp.ChangeReason.MarkChange);
            }
        };
        Context.prototype.clearContext = function (context) {
            if (context === "source") {
                this.sourceNode = null;
                this.app.triggerChange(Tesp.ChangeReason.SourceChange);
            }
            else if (context === "destination") {
                this.destNode = null;
                this.app.triggerChange(Tesp.ChangeReason.DestinationChange);
            }
            else if (context === "mark") {
                this.markNode = null;
                this.app.triggerChange(Tesp.ChangeReason.MarkChange);
            }
        };
        return Context;
    })();
    Tesp.Context = Context;
})(Tesp || (Tesp = {}));
/// <reference path="_refs.ts"/>
var Tesp;
(function (Tesp) {
    var ContextMenu = (function () {
        function ContextMenu(app) {
            var _this = this;
            this.app = app;
            this.menu = new Tesp.Menu(app, false);
            this.links = [
                Tesp.MenuItem.separator,
                new Tesp.MenuItem("Navigate from here", function () { return _this.setContext("source"); }),
                new Tesp.MenuItem("Navigate to here", function () { return _this.setContext("destination"); }),
                new Tesp.MenuItem("Set Mark here", function () { return _this.setContext("mark"); })
            ];
            this.unmarkLink = new Tesp.MenuItem("Remove mark", function () { return _this.app.context.clearContext("mark"); });
        }
        ContextMenu.prototype.setContext = function (context) {
            if (this.node != null) {
                this.app.context.setContextNode(context, this.node);
            }
            else {
                this.app.context.setContextLocation(context, this.pos);
            }
        };
        ContextMenu.prototype.openNode = function (node) {
            this.open(node.pos, node);
        };
        ContextMenu.prototype.open = function (pos, node) {
            if (node != null && !node.permanent) {
                if (node.referenceId == null) {
                    node = null;
                }
                else {
                    node = this.app.world.findNodeById(node.referenceId);
                    if (node != null && !node.permanent) {
                        node = null;
                    }
                }
            }
            var lines = [];
            var landmark = this.app.world.getLandmarkName(pos);
            if (node != null) {
                var feat = this.app.features.byName[node.type];
                if (feat != null) {
                    lines.push(feat.location || feat.name);
                    lines.push(node.name);
                }
                else {
                    lines.push(node.longName);
                }
                if (landmark != null && landmark !== node.name) {
                    lines.push(landmark);
                }
                pos = node.pos;
            }
            else if (landmark != null) {
                lines.push(landmark);
            }
            var region = this.app.world.getRegionName(pos);
            if (region != null) {
                lines.push(region + " Region");
            }
            this.pos = pos;
            this.node = node;
            var items = lines.map(function (l) { return new Tesp.MenuItem(l); }).concat(this.links);
            if (this.app.context.markNode != null)
                items.push(this.unmarkLink);
            this.menu.setData(items);
            this.menu.open();
            this.menu.focus();
            var menuStyle = this.menu.getStyle();
            menuStyle.left = pos.x + "px";
            menuStyle.top = pos.y + "px";
            var scrollX = pageXOffset;
            var scrollY = pageYOffset;
            var rect = this.menu.element.getBoundingClientRect();
            if (rect.left < 10) {
                scrollX = pageXOffset + rect.left - 10;
            }
            else if (rect.right > innerWidth - 27) {
                scrollX = pageXOffset + rect.right - innerWidth + 27;
            }
            if (rect.top < 50) {
                scrollY = pageYOffset + rect.top - 50;
            }
            else if (rect.bottom > innerHeight - 27) {
                scrollY = pageYOffset + rect.bottom - innerHeight + 27;
            }
            if (scrollX !== pageXOffset || scrollY !== pageYOffset)
                scroll(scrollX, scrollY);
        };
        ContextMenu.prototype.hide = function () {
            this.menu.hide();
        };
        return ContextMenu;
    })();
    Tesp.ContextMenu = ContextMenu;
})(Tesp || (Tesp = {}));
/// <reference path="_refs.ts"/>
var Tesp;
(function (Tesp) {
    var Controls = (function () {
        function Controls(app, element) {
            var _this = this;
            this.app = app;
            this.element = element;
            this.app.addChangeListener(Tesp.ChangeReason.SourceChange, function () { return _this.updateNodeInfo(".control-source-info", _this.app.context.sourceNode); });
            this.app.addChangeListener(Tesp.ChangeReason.DestinationChange, function () { return _this.updateNodeInfo(".control-destination-info", _this.app.context.destNode); });
            this.app.addChangeListener(Tesp.ChangeReason.MarkChange, function () { return _this.updateNodeInfo(".control-mark-info", _this.app.context.markNode); });
            this.app.addChangeListener(Tesp.ChangeReason.PathUpdate, function (reason, pathNode) { return _this.updatePath(pathNode); });
            this.pathContainer = element.querySelector(".path-container");
            this.featuresContainer = element.querySelector(".features-container");
            this.searchInput = element.querySelector(".search-input");
            var overheadInput = element.querySelector(".feature-overhead input");
            overheadInput.value = Math.pow(app.features.nodeOverhead, 1 / 1.5) + "";
            overheadInput.oninput = function () {
                _this.app.features.nodeOverhead = Math.pow(+overheadInput.value, 1.5);
                _this.app.triggerChange(Tesp.ChangeReason.FeatureChange);
            };
            var featuresVisible = false;
            element.querySelector(".features-icon").onclick = function () {
                return _this.featuresContainer.style.display = (featuresVisible = !featuresVisible) ? "block" : "none";
            };
            this.initSearch();
        }
        Controls.prototype.initSearch = function () {
            var _this = this;
            var searchContainer = this.element.querySelector(".search-container");
            this.searchMenu = new Tesp.Menu(this.app, true);
            var menuStyle = this.searchMenu.getStyle();
            var input = this.searchInput.getBoundingClientRect();
            menuStyle.minWidth = "200px";
            menuStyle.top = (input.top + input.height) + "px";
            menuStyle.right = (searchContainer.clientWidth - input.right) + "px";
            function prepTerm(text) {
                return text != null ? text.toLowerCase().replace(/[^a-z]+/g, " ") : null;
            }
            var searchNodes = this.app.world.nodes
                .concat(this.app.world.landmarks.map(function (a) { return a.target; }))
                .map(function (n) {
                var feat = _this.app.features.byName[n.type];
                var featName = feat != null ? feat.location || feat.name : null;
                var terms = [n.name];
                if (featName != null)
                    terms.push(featName);
                var landmark = _this.app.world.getLandmarkName(n.pos);
                if (landmark && landmark !== n.name)
                    terms.push(landmark);
                return {
                    terms: terms,
                    searchTerms: terms.map(function (t) { return prepTerm(t); }),
                    node: n
                };
            })
                .sort(function (a, b) {
                var at = a.searchTerms, bt = b.searchTerms;
                var ml = Math.max(at.length, bt.length);
                for (var i = 0; i < ml; i++) {
                    var d = (at[i] || "").localeCompare(bt[i] || "");
                    if (d !== 0)
                        return d;
                }
                return 0;
            });
            this.drawFeatures();
            this.searchInput.onkeydown = function (ev) {
                if ((ev.which === 40 || ev.which === 38 || ev.which === 13) && _this.searchMenu.isOpen()) {
                    _this.searchMenu.focus(ev.which === 38 ? -1 : 0);
                    ev.stopPropagation();
                    return false;
                }
                return true;
            };
            this.searchInput.oninput = function () {
                var search = prepTerm(_this.searchInput.value);
                var starts = [];
                var terms = [];
                var alpha = false;
                for (var i = 0; i < search.length; i++) {
                    var c = search.charCodeAt(i);
                    if (c > 96 && c < 123) {
                        if (!alpha) {
                            starts.push(i);
                            alpha = true;
                        }
                    }
                    else if (alpha) {
                        terms = terms.concat(starts.map(function (s) { return search.substring(s, i); }));
                        alpha = false;
                    }
                }
                if (alpha) {
                    terms = terms.concat(starts.map(function (s) { return search.substring(s); }));
                }
                var results = searchNodes
                    .filter(function (n) {
                    var c = 0;
                    return terms.some(function (t) {
                        if (n.searchTerms.some(function (st) { return st.indexOf(t) === 0; }))
                            c++;
                        return c >= starts.length;
                    });
                });
                _this.searchMenu.setData(results.map(function (n) {
                    return new Tesp.MenuItem(n.terms.join(", "), function () {
                        _this.app.ctxMenu.openNode(n.node);
                        _this.clearSearch();
                    });
                }));
                _this.searchMenu.open();
            };
        };
        Controls.prototype.clearSearch = function () {
            this.searchInput.value = "";
            this.searchMenu.hide();
        };
        Controls.prototype.updateNodeInfo = function (selector, node) {
            var _this = this;
            var el = this.element.querySelector(selector);
            if (node != null) {
                el.textContent = node.longName;
                el.onclick = function () { return _this.app.ctxMenu.openNode(node); };
            }
            else {
                el.textContent = "";
                el.onclick = null;
            }
        };
        Controls.prototype.updatePath = function (pathNode) {
            var child;
            while ((child = this.pathContainer.firstElementChild)) {
                this.pathContainer.removeChild(child);
            }
            this.pathContainer.style.display = pathNode ? "block" : "none";
            while (pathNode) {
                this.pathContainer.insertBefore(this.drawPathNode(pathNode), this.pathContainer.firstElementChild);
                pathNode = pathNode.prev;
            }
        };
        Controls.prototype.drawPathNode = function (pathNode) {
            var _this = this;
            var el = document.createElement("div");
            var icon, text, linkText;
            var node = pathNode.node;
            var edge = pathNode.prevEdge;
            if (edge) {
                var action;
                if (edge.type === "walk") {
                    action = "Walk";
                    icon = "compass";
                }
                else {
                    var feat = this.app.features.byName[edge.type];
                    if (feat) {
                        action = feat.verb || feat.name;
                        icon = feat.icon;
                    }
                    else {
                        action = edge.type;
                        icon = "question";
                    }
                }
                text = " " + action + " to ";
                linkText = node.type === edge.type ? node.name : node.longName;
            }
            else {
                icon = "map-marker";
                text = " ";
                linkText = node.longName;
            }
            var i = document.createElement("i");
            i.classList.add("path-icon");
            i.classList.add("fa");
            i.classList.add("fa-" + icon);
            el.appendChild(i);
            el.appendChild(document.createTextNode(text));
            var a = document.createElement("a");
            a.textContent = linkText;
            a.onclick = function () { return _this.app.ctxMenu.openNode(node); };
            el.appendChild(a);
            return el;
        };
        Controls.prototype.drawFeatures = function () {
            var _this = this;
            this.app.features.forEach(function (f) {
                var el = document.createElement("div");
                el.className = "feature-row";
                el.textContent = f.name + ":";
                var container = document.createElement("div");
                container.className = "feature-toggle-container";
                el.appendChild(container);
                container.appendChild(_this.drawCheckbox(function (val) {
                    f.hidden = !val;
                    _this.app.triggerChange(Tesp.ChangeReason.FeatureChange);
                }, !f.hidden, "fa-eye", "fa-eye-slash"));
                if (!f.visualOnly) {
                    container.appendChild(_this.drawCheckbox(function (val) {
                        f.disabled = !val;
                        _this.app.triggerChange(Tesp.ChangeReason.FeatureChange);
                    }, !f.disabled, "fa-check-circle-o", "fa-circle-o"));
                }
                else {
                    var i = document.createElement("i");
                    i.className = "fa fa-icon fa-circle-o feature-toggle hidden";
                    container.appendChild(i);
                }
                _this.featuresContainer.appendChild(el);
            });
        };
        Controls.prototype.drawCheckbox = function (onchange, initial, classOn, classOff) {
            var checked = initial;
            var i = document.createElement("i");
            i.className = "fa fa-icon feature-toggle";
            i.classList.add(checked ? classOn : classOff);
            i.onclick = function (ev) {
                ev.stopPropagation();
                checked = !checked;
                if (checked) {
                    i.classList.remove(classOff);
                    i.classList.add(classOn);
                }
                else {
                    i.classList.remove(classOn);
                    i.classList.add(classOff);
                }
                onchange(checked);
            };
            return i;
        };
        return Controls;
    })();
    Tesp.Controls = Controls;
})(Tesp || (Tesp = {}));
/// <reference path="_refs.ts"/>
var Tesp;
(function (Tesp) {
    var Feature = (function () {
        function Feature() {
        }
        return Feature;
    })();
    Tesp.Feature = Feature;
    var Features = (function () {
        function Features() {
        }
        Features.init = function () {
            var features = [
                { name: "Mark/Recall", verb: "Recall", type: "mark", icon: "bolt" },
                { name: "Mages Guild", verb: "Guild Guide", type: "mages-guild", icon: "eye" },
                { name: "Silt Strider", verb: "Silt Strider", type: "silt-strider", icon: "bug" },
                { name: "Boat", location: "Docks", type: "boat", icon: "ship" },
                { name: "Holamayan Boat", location: "Docks", verb: "Boat", type: "holamayan", icon: "ship" },
                { name: "Propylon Chamber", type: "propylon", icon: "cog" },
                { name: "Gondola", type: "gondola", icon: "ship" },
                { name: "Divine Intervention", location: "Imperial Cult Shrine", type: "divine", icon: "bolt" },
                { name: "Almsivi Intervention", location: "Tribunal Temple", type: "almsivi", icon: "bolt" },
                { name: "Transport lines", type: "transport-edge", visualOnly: true },
                { name: "Locations", type: "node", visualOnly: true },
                { name: "Intervention area border", type: "area", visualOnly: true },
                { name: "Gridlines", type: "grid", visualOnly: true }
            ];
            features.nodeOverhead = 15;
            features.byName = {};
            var fIdx = features.byName;
            features.forEach(function (f) { return fIdx[f.type] = f; });
            fIdx["transport-edge"].hidden = fIdx["area"].hidden = fIdx["grid"].hidden = true;
            return features;
        };
        return Features;
    })();
    Tesp.Features = Features;
})(Tesp || (Tesp = {}));
/// <reference path="_refs.ts"/>
var Tesp;
(function (Tesp) {
    var Map = (function () {
        function Map(app, element) {
            var _this = this;
            this.app = app;
            this.element = element;
            this.app.addChangeListener(Tesp.ChangeReason.SourceChange, function () { return _this.renderSource(); });
            this.app.addChangeListener(Tesp.ChangeReason.DestinationChange, function () { return _this.renderDestination(); });
            this.app.addChangeListener(Tesp.ChangeReason.MarkChange, function () { return _this.renderMark(); });
            this.app.addChangeListener(Tesp.ChangeReason.PathUpdate, function (reason, pathNode) { return _this.renderPath(pathNode); });
            this.app.addChangeListener(Tesp.ChangeReason.FeatureChange, function () { return _this.updateFeatures(); });
            element.onclick = function (ev) {
                var node = _this.getEventNode(ev);
                if (node != null) {
                    _this.triggerContextMenu(ev, node);
                }
            };
            element.oncontextmenu = function (ev) {
                if (!ev.shiftKey) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    _this.triggerContextMenu(ev);
                }
            };
            this.renderNodes();
            this.renderMark();
            this.renderGrid();
            this.updateFeatures();
            this.initDragScroll();
        }
        Map.prototype.getEventNode = function (event) {
            var target = event.target;
            if (target.classList.contains("map-node")) {
                var id = target.getAttribute("data-node-id");
                if (id !== undefined) {
                    return this.app.world.findNodeById(+id);
                }
            }
            return null;
        };
        Map.prototype.triggerContextMenu = function (ev, node) {
            this.app.ctxMenu.open(new Tesp.Vec2(ev.pageX, ev.pageY), node || this.getEventNode(ev));
        };
        Map.prototype.initDragScroll = function () {
            var _this = this;
            var img = this.element.querySelector("img");
            var mousedown = false, prevX, prevY;
            var stop = function (ev) {
                mousedown = false;
                _this.app.toggleBodyClass("scrolling", false);
                ev.preventDefault();
            };
            var start = function (ev) {
                mousedown = true;
                prevX = ev.clientX;
                prevY = ev.clientY;
                _this.app.toggleBodyClass("scrolling", true);
                ev.preventDefault();
            };
            img.onmousedown = function (ev) {
                if (ev.button === 0 && ev.target === img) {
                    start(ev);
                }
            };
            img.onmouseup = function (ev) {
                if (mousedown) {
                    stop(ev);
                }
            };
            img.onmousemove = function (ev) {
                if (!mousedown && (ev.buttons & 1) > 0) {
                    start(ev);
                }
                if (mousedown) {
                    if (ev.which !== 1) {
                        stop(ev);
                    }
                    else {
                        scroll(pageXOffset + prevX - ev.clientX, pageYOffset + prevY - ev.clientY);
                        prevX = ev.clientX;
                        prevY = ev.clientY;
                        ev.preventDefault();
                    }
                }
            };
        };
        Map.prototype.renderNodes = function () {
            var _this = this;
            if (this.nodeContainer != null)
                this.nodeContainer.parentElement.removeChild(this.nodeContainer);
            this.nodeContainer = document.createElement("div");
            this.element.appendChild(this.nodeContainer);
            this.app.world.nodes
                .forEach(function (n) { return _this.nodeContainer.appendChild(_this.drawNode(n)); });
            if (this.edgeContainer != null)
                this.edgeContainer.parentElement.removeChild(this.edgeContainer);
            this.edgeContainer = document.createElement("div");
            this.element.appendChild(this.edgeContainer);
            this.app.world.edges.forEach(function (e) {
                return _this.edgeContainer.appendChild(_this.drawEdge(e.srcNode.pos, e.destNode.pos, e.srcNode.type, "map-transport-edge"));
            });
            if (this.areaContainer != null)
                this.areaContainer.parentElement.removeChild(this.areaContainer);
            this.areaContainer = document.createElement("div");
            this.element.appendChild(this.areaContainer);
            this.app.world.areas
                .forEach(function (a) {
                var type = a.target.type;
                var prev = null;
                for (var i = 0; i < a.rows.length; i++) {
                    var row = a.rows[i];
                    if (prev != null) {
                        if (row.x1 !== prev.x1) {
                            _this.areaContainer.appendChild(_this.drawCellEdge(row.x1, row.y, prev.x1, row.y, type));
                        }
                        if (row.x2 !== prev.x2) {
                            _this.areaContainer.appendChild(_this.drawCellEdge(row.x2 + 1, row.y, prev.x2 + 1, row.y, type));
                        }
                    }
                    else {
                        _this.areaContainer.appendChild(_this.drawCellEdge(row.x1, row.y, row.x2 + 1, row.y, type));
                    }
                    _this.areaContainer.appendChild(_this.drawCellEdge(row.x1, row.y, row.x1, row.y + 1, type));
                    _this.areaContainer.appendChild(_this.drawCellEdge(row.x2 + 1, row.y, row.x2 + 1, row.y + 1, type));
                    prev = row;
                }
                if (prev != null)
                    _this.areaContainer.appendChild(_this.drawCellEdge(prev.x1, prev.y + 1, prev.x2 + 1, prev.y + 1, type));
            });
        };
        Map.prototype.drawCellEdge = function (x1, y1, x2, y2, type) {
            return this.drawEdge(Tesp.Vec2.fromCell(x1, y1), Tesp.Vec2.fromCell(x2, y2), type, "map-area");
        };
        Map.prototype.renderPath = function (pathNode) {
            if (this.pathContainer != null)
                this.pathContainer.parentElement.removeChild(this.pathContainer);
            if (pathNode == null) {
                this.pathContainer = null;
                return;
            }
            this.pathContainer = document.createElement("div");
            this.element.appendChild(this.pathContainer);
            while (pathNode && pathNode.prev) {
                this.pathContainer.appendChild(this.drawEdge(pathNode.node.pos, pathNode.prev.node.pos, "path", "map-" + pathNode.prevEdge.type));
                pathNode = pathNode.prev;
            }
        };
        Map.prototype.renderMark = function () {
            this.markElem = this.addOrUpdateNodeElem(this.app.context.markNode, this.markElem);
        };
        Map.prototype.renderSource = function () {
            this.sourceElem = this.addOrUpdateNodeElem(this.app.context.sourceNode, this.sourceElem);
        };
        Map.prototype.renderDestination = function () {
            this.destElem = this.addOrUpdateNodeElem(this.app.context.destNode, this.destElem);
        };
        Map.prototype.addOrUpdateNodeElem = function (node, elem) {
            if (elem)
                elem.parentElement.removeChild(elem);
            return node != null
                ? this.element.appendChild(this.drawNode(node))
                : null;
        };
        Map.prototype.renderGrid = function () {
            if (!this.gridContainer) {
                this.gridContainer = document.createElement("div");
                this.element.appendChild(this.gridContainer);
                var i, el;
                for (i = 0; i < 37; i++) {
                    el = document.createElement("div");
                    el.classList.add("map-grid");
                    el.classList.add("map-grid-v");
                    el.style.left = (i * Tesp.Cell.width + Tesp.Cell.widthOffset) + "px";
                    this.gridContainer.appendChild(el);
                }
                for (i = 0; i < 42; i++) {
                    el = document.createElement("div");
                    el.classList.add("map-grid");
                    el.classList.add("map-grid-h");
                    el.style.top = (i * Tesp.Cell.height + Tesp.Cell.heightOffset) + "px";
                    this.gridContainer.appendChild(el);
                }
            }
        };
        Map.prototype.updateFeatures = function () {
            var _this = this;
            this.element.className = "";
            this.app.features.forEach(function (f) {
                if (f.hidden)
                    _this.element.classList.add("hide-" + f.type);
            });
        };
        Map.prototype.drawNode = function (node) {
            var element = document.createElement("div");
            element.classList.add("map-node");
            element.classList.add("map-" + node.type);
            element.style.left = node.pos.x + "px";
            element.style.top = node.pos.y + "px";
            element.setAttribute("data-node-id", (node.referenceId || node.id) + "");
            return element;
        };
        Map.prototype.drawEdge = function (n1, n2, type, subtype) {
            var element = document.createElement("div");
            element.classList.add("map-edge");
            element.classList.add("map-" + type);
            if (subtype)
                element.classList.add(subtype);
            var length = Tesp.Vec2.distance(n1, n2);
            element.style.left = ((n1.x + n2.x) / 2) - (length / 2) + "px";
            element.style.top = ((n1.y + n2.y) / 2) - 1 + "px";
            element.style.width = length + "px";
            element.style.transform = "rotate(" + Math.atan2(n1.y - n2.y, n1.x - n2.x) + "rad)";
            return element;
        };
        return Map;
    })();
    Tesp.Map = Map;
})(Tesp || (Tesp = {}));
/// <reference path="_refs.ts"/>
var Tesp;
(function (Tesp) {
    var MenuItem = (function () {
        function MenuItem(label, func) {
            this.label = label;
            this.func = func;
        }
        MenuItem.separator = new MenuItem("");
        return MenuItem;
    })();
    Tesp.MenuItem = MenuItem;
    var Menu = (function () {
        function Menu(app, fixed) {
            var _this = this;
            this.app = app;
            this.disposed = false;
            this.listener = this.app.addChangeListener(Tesp.ChangeReason.ClearMenus, function () { return _this.hide(); });
            this.element = document.createElement("ul");
            this.element.className = "menu";
            if (fixed)
                this.element.classList.add("fixed");
            this.element.onmousedown = function (ev) { return ev.stopPropagation(); };
            this.app.element.appendChild(this.element);
        }
        Menu.prototype.dispose = function () {
            if (this.disposed)
                return;
            this.app.removeChangeListener(this.listener);
            this.element.parentElement.removeChild(this.element);
            this.disposed = true;
        };
        Menu.prototype.getStyle = function () {
            return this.disposed ? null : this.element.style;
        };
        Menu.prototype.setData = function (items) {
            var _this = this;
            if (this.disposed)
                return;
            this.hide();
            var child;
            while ((child = this.element.firstElementChild) != null) {
                this.element.removeChild(child);
            }
            var links = this.links = [];
            items.forEach(function (item) {
                var li = document.createElement("li");
                _this.element.appendChild(li);
                if (item === MenuItem.separator) {
                    li.className = "separator";
                }
                else {
                    li.textContent = item.label;
                    if (item.func != null) {
                        li.className = "link";
                        var idx = li.tabIndex = links.push(li);
                        li.onmousedown = function (ev) {
                            ev.stopPropagation();
                            item.func();
                            _this.hide();
                        };
                        li.onkeydown = function (ev) {
                            if ((ev.which === 38 || ev.which === 40)) {
                                links[(idx + (ev.which === 40 ? 0 : -2) + links.length)
                                    % links.length].focus();
                            }
                            else if (ev.which === 13) {
                                item.func();
                                _this.hide();
                            }
                            else
                                return true;
                            ev.stopPropagation();
                            return false;
                        };
                        li.onmouseenter = function (ev) {
                            li.focus();
                        };
                        li.onmouseout = function (ev) {
                            if (li === document.activeElement) {
                                li.blur();
                            }
                        };
                    }
                }
            });
        };
        Menu.prototype.open = function () {
            if (this.disposed)
                return;
            this.app.triggerChange(Tesp.ChangeReason.ClearMenus);
            if (this.element.firstElementChild != null)
                this.element.style.display = "inherit";
        };
        Menu.prototype.hide = function () {
            if (this.disposed)
                return;
            this.element.style.display = "none";
        };
        Menu.prototype.isOpen = function () {
            return !this.disposed && this.element.style.display !== "none";
        };
        Menu.prototype.focus = function (index) {
            if (index === void 0) { index = 0; }
            if (this.disposed)
                return;
            var elem = this.element.querySelector(".link");
            if (elem != null) {
                var x = pageXOffset, y = pageYOffset;
                if (index === 0) {
                    elem.focus();
                }
                else {
                    var len = this.links.length;
                    var idx = ((index % len) + len) % len;
                    this.links[idx].focus();
                }
                scroll(x, y);
            }
        };
        return Menu;
    })();
    Tesp.Menu = Menu;
})(Tesp || (Tesp = {}));
/// <reference path="_refs.ts"/>
var Tesp;
(function (Tesp) {
    var Path = (function () {
        function Path(app) {
            var _this = this;
            this.app = app;
            this.app.addChangeListener(Tesp.ChangeReason.ContextChange | Tesp.ChangeReason.MarkChange | Tesp.ChangeReason.FeatureChange, function () {
                _this.findPath();
            });
        }
        Path.prototype.findPath = function () {
            var _this = this;
            if (this.queue) {
                return this.queue;
            }
            if (this.working) {
                return this.queue = this.working.then(function () { return _this.findPath(); });
            }
            var context = this.app.context;
            var source = context.sourceNode;
            var destination = context.destNode;
            if (source == null || destination == null || source === destination) {
                this.app.triggerChange(Tesp.ChangeReason.PathUpdate);
                return Promise.reject(new Error("Invalid source and destination configuration"));
            }
            var world = this.app.world;
            var data = {
                nodes: world.nodes,
                areas: world.areas,
                source: source,
                destination: destination,
                mark: context.markNode,
                features: this.app.features
            };
            return this.working = new Promise(function (resolve, reject) {
                if (_this.worker == null) {
                    _this.worker = new Worker("js/path.worker.js");
                }
                _this.worker.onmessage = function (ev) {
                    _this.queue = _this.working = null;
                    _this.app.triggerChange(Tesp.ChangeReason.PathUpdate, ev.data);
                    resolve(ev.data);
                };
                _this.worker.onerror = function (ev) {
                    _this.queue = _this.working = null;
                    _this.app.triggerChange(Tesp.ChangeReason.PathUpdate);
                    reject(ev);
                };
                _this.worker.postMessage(data);
            });
        };
        return Path;
    })();
    Tesp.Path = Path;
})(Tesp || (Tesp = {}));
/// <reference path="_refs.ts"/>
var Tesp;
(function (Tesp) {
    var World = (function () {
        function World(app, data) {
            var _this = this;
            this.app = app;
            this.nodesById = {};
            this.nodes = [];
            this.edges = [];
            this.areas = [];
            Object.getOwnPropertyNames(data.transport).forEach(function (k) { return _this.loadTransport(data.transport, k); });
            this.regions = data.regions.map(function (a) { return World.makeArea(new Tesp.Node(a.name, a.name, new Tesp.Vec2(0, 0), "region"), a); });
            this.landmarks = data.landmarks.map(function (a) {
                var node = new Tesp.Node(a.name, a.name, new Tesp.Vec2(0, 0), "landmark");
                var area = World.makeArea(node, a);
                var sumX = 0;
                var sumY = 0;
                var count = 0;
                area.rows.forEach(function (r) {
                    sumX += (r.x1 + r.width / 2) * r.width;
                    sumY += (r.y + 0.5) * r.width;
                    count += r.width;
                });
                node.pos = Tesp.Vec2.fromCell(sumX / count, sumY / count);
                return area;
            });
            this.nodesById = {};
            this.nodes.forEach(function (n) { return _this.nodesById[n.id] = n; });
        }
        World.prototype.loadTransport = function (data, type) {
            var _this = this;
            var array = data[type];
            var feat = this.app.features.byName[type];
            var typeName = feat.location || feat.name;
            var nodes = array.map(function (n) { return new Tesp.Node(n.name, typeName + ", " + n.name, new Tesp.Vec2(n.x, n.y), type, true); });
            this.nodes = this.nodes.concat(nodes);
            var cost = World.transportCost;
            array.forEach(function (n, i1) {
                var n1 = nodes[i1];
                if (n.edges) {
                    n.edges.forEach(function (i2) {
                        var n2 = nodes[i2];
                        var edge = new Tesp.Edge(n1, n2, cost);
                        n1.edges.push(edge);
                        n2.edges.push(edge);
                        _this.edges.push(edge);
                    });
                }
                if (n.oneWayEdges) {
                    n.oneWayEdges.forEach(function (i2) {
                        var edge = new Tesp.Edge(n1, nodes[i2], cost);
                        n1.edges.push(edge);
                        _this.edges.push(edge);
                    });
                }
                if (n.cells) {
                    _this.areas.push(World.makeArea(n1, n));
                }
            });
        };
        World.makeArea = function (node, data) {
            var y = data.top || 0;
            var rows = data.cells.map(function (c) { return new Tesp.CellRow(y++, c[0], c[1]); });
            return new Tesp.Area(node, rows);
        };
        World.prototype.findNodeById = function (id) {
            return this.nodesById[id] || null;
        };
        World.prototype.getRegionName = function (pos) {
            var area = World.getAreaByCell(this.regions, Tesp.Cell.fromPosition(pos));
            return area != null ? area.target.name : null;
        };
        World.prototype.getLandmarkName = function (pos) {
            var area = World.getAreaByCell(this.landmarks, Tesp.Cell.fromPosition(pos));
            return area != null ? area.target.name : null;
        };
        World.getAreaByCell = function (source, cell) {
            var area;
            if (source.some(function (r) { return Tesp.Area.containsCell(r, cell) && (area = r) != null; }))
                return area;
            return null;
        };
        World.transportCost = 10;
        return World;
    })();
    Tesp.World = World;
})(Tesp || (Tesp = {}));
/// <reference path="d/es6-promise/es6-promise.d.ts"/>
/// <reference path="d/whatwg-fetch/whatwg-fetch.d.ts"/>
/// <reference path="app.ts"/>
/// <reference path="common.ts"/>
/// <reference path="context.ts"/>
/// <reference path="contextmenu.ts"/>
/// <reference path="controls.ts"/>
/// <reference path="features.ts"/>
/// <reference path="map.ts"/>
/// <reference path="menu.ts"/>
/// <reference path="path.ts"/>
/// <reference path="world.ts"/> 

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC50cyIsImNvbW1vbi50cyIsImNvbnRleHQudHMiLCJjb250ZXh0bWVudS50cyIsImNvbnRyb2xzLnRzIiwiZmVhdHVyZXMudHMiLCJtYXAudHMiLCJtZW51LnRzIiwicGF0aC50cyIsIndvcmxkLnRzIiwiX3JlZnMudHMiXSwibmFtZXMiOlsiVGVzcCIsIlRlc3AuQ2hhbmdlUmVhc29uIiwiVGVzcC5DaGFuZ2VMaXN0ZW5lciIsIlRlc3AuQ2hhbmdlTGlzdGVuZXIuY29uc3RydWN0b3IiLCJUZXNwLkNoYW5nZUxpc3RlbmVyLnRyaWdnZXIiLCJUZXNwLkFwcGxpY2F0aW9uIiwiVGVzcC5BcHBsaWNhdGlvbi5jb25zdHJ1Y3RvciIsIlRlc3AuQXBwbGljYXRpb24uYWRkQ2hhbmdlTGlzdGVuZXIiLCJUZXNwLkFwcGxpY2F0aW9uLnJlbW92ZUNoYW5nZUxpc3RlbmVyIiwiVGVzcC5BcHBsaWNhdGlvbi50cmlnZ2VyQ2hhbmdlIiwiVGVzcC5BcHBsaWNhdGlvbi50b2dnbGVCb2R5Q2xhc3MiLCJUZXNwLlZlYzIiLCJUZXNwLlZlYzIuY29uc3RydWN0b3IiLCJUZXNwLlZlYzIuZGlzdGFuY2UiLCJUZXNwLlZlYzIuZnJvbUNlbGwiLCJUZXNwLk5vZGUiLCJUZXNwLk5vZGUuY29uc3RydWN0b3IiLCJUZXNwLkVkZ2UiLCJUZXNwLkVkZ2UuY29uc3RydWN0b3IiLCJUZXNwLkNlbGwiLCJUZXNwLkNlbGwuY29uc3RydWN0b3IiLCJUZXNwLkNlbGwuZnJvbVBvc2l0aW9uIiwiVGVzcC5DZWxsUm93IiwiVGVzcC5DZWxsUm93LmNvbnN0cnVjdG9yIiwiVGVzcC5BcmVhIiwiVGVzcC5BcmVhLmNvbnN0cnVjdG9yIiwiVGVzcC5BcmVhLmNvbnRhaW5zQ2VsbCIsIlRlc3AuQ29udGV4dCIsIlRlc3AuQ29udGV4dC5jb25zdHJ1Y3RvciIsIlRlc3AuQ29udGV4dC5zZXRDb250ZXh0TG9jYXRpb24iLCJUZXNwLkNvbnRleHQuc2V0Q29udGV4dE5vZGUiLCJUZXNwLkNvbnRleHQuY2xlYXJDb250ZXh0IiwiVGVzcC5Db250ZXh0TWVudSIsIlRlc3AuQ29udGV4dE1lbnUuY29uc3RydWN0b3IiLCJUZXNwLkNvbnRleHRNZW51LnNldENvbnRleHQiLCJUZXNwLkNvbnRleHRNZW51Lm9wZW5Ob2RlIiwiVGVzcC5Db250ZXh0TWVudS5vcGVuIiwiVGVzcC5Db250ZXh0TWVudS5oaWRlIiwiVGVzcC5Db250cm9scyIsIlRlc3AuQ29udHJvbHMuY29uc3RydWN0b3IiLCJUZXNwLkNvbnRyb2xzLmluaXRTZWFyY2giLCJUZXNwLkNvbnRyb2xzLmluaXRTZWFyY2gucHJlcFRlcm0iLCJUZXNwLkNvbnRyb2xzLmNsZWFyU2VhcmNoIiwiVGVzcC5Db250cm9scy51cGRhdGVOb2RlSW5mbyIsIlRlc3AuQ29udHJvbHMudXBkYXRlUGF0aCIsIlRlc3AuQ29udHJvbHMuZHJhd1BhdGhOb2RlIiwiVGVzcC5Db250cm9scy5kcmF3RmVhdHVyZXMiLCJUZXNwLkNvbnRyb2xzLmRyYXdDaGVja2JveCIsIlRlc3AuRmVhdHVyZSIsIlRlc3AuRmVhdHVyZS5jb25zdHJ1Y3RvciIsIlRlc3AuRmVhdHVyZXMiLCJUZXNwLkZlYXR1cmVzLmNvbnN0cnVjdG9yIiwiVGVzcC5GZWF0dXJlcy5pbml0IiwiVGVzcC5NYXAiLCJUZXNwLk1hcC5jb25zdHJ1Y3RvciIsIlRlc3AuTWFwLmdldEV2ZW50Tm9kZSIsIlRlc3AuTWFwLnRyaWdnZXJDb250ZXh0TWVudSIsIlRlc3AuTWFwLmluaXREcmFnU2Nyb2xsIiwiVGVzcC5NYXAucmVuZGVyTm9kZXMiLCJUZXNwLk1hcC5kcmF3Q2VsbEVkZ2UiLCJUZXNwLk1hcC5yZW5kZXJQYXRoIiwiVGVzcC5NYXAucmVuZGVyTWFyayIsIlRlc3AuTWFwLnJlbmRlclNvdXJjZSIsIlRlc3AuTWFwLnJlbmRlckRlc3RpbmF0aW9uIiwiVGVzcC5NYXAuYWRkT3JVcGRhdGVOb2RlRWxlbSIsIlRlc3AuTWFwLnJlbmRlckdyaWQiLCJUZXNwLk1hcC51cGRhdGVGZWF0dXJlcyIsIlRlc3AuTWFwLmRyYXdOb2RlIiwiVGVzcC5NYXAuZHJhd0VkZ2UiLCJUZXNwLk1lbnVJdGVtIiwiVGVzcC5NZW51SXRlbS5jb25zdHJ1Y3RvciIsIlRlc3AuTWVudSIsIlRlc3AuTWVudS5jb25zdHJ1Y3RvciIsIlRlc3AuTWVudS5kaXNwb3NlIiwiVGVzcC5NZW51LmdldFN0eWxlIiwiVGVzcC5NZW51LnNldERhdGEiLCJUZXNwLk1lbnUub3BlbiIsIlRlc3AuTWVudS5oaWRlIiwiVGVzcC5NZW51LmlzT3BlbiIsIlRlc3AuTWVudS5mb2N1cyIsIlRlc3AuUGF0aCIsIlRlc3AuUGF0aC5jb25zdHJ1Y3RvciIsIlRlc3AuUGF0aC5maW5kUGF0aCIsIlRlc3AuV29ybGQiLCJUZXNwLldvcmxkLmNvbnN0cnVjdG9yIiwiVGVzcC5Xb3JsZC5sb2FkVHJhbnNwb3J0IiwiVGVzcC5Xb3JsZC5tYWtlQXJlYSIsIlRlc3AuV29ybGQuZmluZE5vZGVCeUlkIiwiVGVzcC5Xb3JsZC5nZXRSZWdpb25OYW1lIiwiVGVzcC5Xb3JsZC5nZXRMYW5kbWFya05hbWUiLCJUZXNwLldvcmxkLmdldEFyZWFCeUNlbGwiXSwibWFwcGluZ3MiOiJBQUFBLEFBQ0EsZ0NBRGdDO0FBQ2hDLElBQU8sSUFBSSxDQWdHVjtBQWhHRCxXQUFPLElBQUksRUFBQyxDQUFDO0lBRVRBLFdBQVlBLFlBQVlBO1FBQ3BCQywrQ0FBVUEsQ0FBQUE7UUFFVkEsK0RBQWtCQSxDQUFBQTtRQUVsQkEseUVBQXVCQSxDQUFBQTtRQUV2QkEsMkRBQWdCQSxDQUFBQTtRQUVoQkEsaUVBQTZEQSxDQUFBQTtRQUU3REEsaUVBQW1CQSxDQUFBQTtRQUVuQkEsNERBQWlCQSxDQUFBQTtRQUVqQkEsNERBQWlCQSxDQUFBQTtRQUNqQkEsOENBQVVBLENBQUFBO0lBQ2RBLENBQUNBLEVBakJXRCxpQkFBWUEsS0FBWkEsaUJBQVlBLFFBaUJ2QkE7SUFqQkRBLElBQVlBLFlBQVlBLEdBQVpBLGlCQWlCWEEsQ0FBQUE7SUFDREE7UUFDSUUsd0JBQW1CQSxPQUFxQkEs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QUFDQSxDQUFDQSxJQUFJQSxJQUFJQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDbENBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBO29CQUNoQkEsQ0FBQ0E7Z0JBQ0xBLENBQUNBO1lBQ0xBLENBQUNBO1lBRURBLElBQUlBLEtBQUtBLEdBQWFBLEVBQUVBLENBQUNBO1lBQ3pCQSxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxlQUFlQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNuREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2ZBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLFFBQVFBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO2dCQUMvQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2ZBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO29CQUN2Q0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQzFCQSxDQUFDQTtnQkFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7b0JBQ0pBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO2dCQUM5QkEsQ0FBQ0E7Z0JBQ0RBLEVBQUVBLENBQUNBLENBQUNBLFFBQVFBLElBQUlBLElBQUlBLElBQUlBLFFBQVFBLEtBQUtBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO29CQUM3Q0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FB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LENBQUNBLENBQUNBO2dCQUN4Q0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsRUFBRUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7b0JBQzFCQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxDQUFDQSxhQUFhQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxDQUFDQTtvQkFDakRBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO3dCQUNSQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDakJBLENBQUNBO2dCQUNEQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNiQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUVQQSxJQUFJQSxDQUFDQSxZQUFZQSxFQUFFQSxDQUFDQTtZQUVwQkEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsU0FBU0EsR0FBR0EsVUFBQ0EsRUFBRUE7Z0JBQzVCQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxLQUFLQSxLQUFLQSxFQUFFQSxJQUFJQSxFQUFFQSxDQUFDQSxLQUFLQSxLQUFLQSxFQUFFQSxJQUFJQSxFQUFFQSxDQUFDQSxLQUFLQSxLQUFLQSxFQUFFQSxDQUFDQSxJQUFJQSxLQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDdEZBLEtBQUlBLENBQUNBLFVBQVVBLENBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEtBQUtBLEtBQUtBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO29CQUNoREEsRUFBRUEsQ0FBQ0EsZUFBZUEsRUFBRUEsQ0FBQ0E7b0JBQ3JCQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQTtnQkFDakJBLENB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Q0FBQ0EsQ0FBQ0E7Z0JBQ1BBLElBQUlBLE1BQWNBLENBQUNBO2dCQUNuQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsS0FBS0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3ZCQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQTtvQkFDaEJBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBO2dCQUNyQkEsQ0FBQ0E7Z0JBQUNBLElBQUlBLENBQUNBLENBQUNBO29CQUNKQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtvQkFDL0NBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO3dCQUNQQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQTt3QkFDaENBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLENBQUNBO29CQUNyQkEsQ0FBQ0E7b0JBQUNBLElBQUlBLENBQUNBLENBQUNBO3dCQUNKQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQTt3QkFDbkJBLElBQUlBLEdBQUdBLFVBQVVBLENBQUNBO29CQUN0QkEsQ0FBQ0E7Z0JBQ0xBLENBQUNBO2dCQUVEQSxJQUFJQSxHQUFHQSxNQUFJQSxNQUFNQSxTQUFNQSxDQUFDQTtnQkFDeEJBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLEtBQUtBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBO1lBQ25FQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDSkEsSUFBSUEsR0FBR0EsWUFBWUEsQ0FBQ0E7Z0JBQ3BCQSxJQUFJQSxHQUFHQSxHQUFHQSxDQUFDQTtnQkFDWEEsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7WUFDN0JBLENBQUNBO1lBRURBLElBQUlBLENBQUNBLEdBQUdBLFFBQVFBLENBQUNBLGFBQWFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3BDQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtZQUM3QkEsQ0FBQ0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLENBQUNBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBO1lBQzlCQSxFQUFFQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUVsQkEsRUFBRUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFFOUNBLElBQUlBLENBQUNBLEdBQUdBLFFBQVFBLENBQUNBLGFBQWFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3BDQSxDQUFDQSxDQUFDQSxXQUFXQSxHQUFHQSxRQUFRQSxDQUFDQTtZQUN6QkEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsR0FBR0EsY0FBTUEsT0FBQUEsS0FBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBL0JBLENBQStCQSxDQUFDQTtZQUNsREEsRUFBRUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFFbEJBLE1BQU1BLENBQUNBLEVBQUVBLENBQUNBO1FBQ2RBLENBQUNBO1FBRU9QLCtCQUFZQSxHQUFwQkE7WUFBQVEsaUJBMkJDQTtZQTFCR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQUEsQ0FBQ0E7Z0JBQ3ZCQSxJQUFJQSxFQUFFQSxHQUFHQSxRQUFRQSxDQUFDQSxhQUFhQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtnQkFDdkNBLEVBQUVBLENBQUNBLFNBQVNBLEdBQUdBLGFBQWFBLENBQUNBO2dCQUM3QkEsRUFBRUEsQ0FBQ0EsV0FBV0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0E7Z0JBRTlCQSxJQUFJQSxTQUFTQSxHQUFHQSxRQUFRQSxDQUFDQSxhQUFhQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtnQkFDOUNBLFNBQVNBLENBQUNBLFNBQVNBLEdBQUdBLDBCQUEwQkEsQ0FBQ0E7Z0JBQ2pEQSxFQUFFQSxDQUFDQSxXQUFXQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtnQkFFMUJBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLEtBQUlBLENBQUNBLFlBQVlBLENBQUNBLFVBQUFBLEdBQUdBO29CQUN2Q0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7b0JBQ2hCQSxLQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxhQUFhQSxDQUFDQSxpQkFBWUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3ZEQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxFQUFFQSxRQUFRQSxFQUFFQSxjQUFjQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDekNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBO29CQUNoQkEsU0FBU0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBSUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsVUFBQUEsR0FBR0E7d0JBQ3ZDQSxDQUFDQSxDQUFDQSxRQUFRQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQTt3QkFDbEJBLEtBQUlBLENBQUNBLEdBQUdBLENBQUNBLGFBQWFBLENBQUNBLGlCQUFZQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQTtvQkFDdkRBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLFFBQVFBLEVBQUVBLG1CQUFtQkEsRUFBRUEsYUFBYUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3pEQSxDQUFDQTtnQkFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7b0JBQ0pBLElBQUlBLENBQUNBLEdBQUdBLFFBQVFBLENBQUNBLGFBQWFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO29CQUNwQ0EsQ0FBQ0EsQ0FBQ0EsU0FBU0EsR0FBR0EsOENBQThDQSxDQUFDQTtvQkFDN0RBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUM3QkEsQ0FBQ0E7Z0JBRURBLEtBQUlBLENBQUNBLGlCQUFpQkEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFDM0NBLENBQUNBLENBQUNBLENBQUNBO1FBQ1BBLENBQUNBO1FBRU9SLCtCQUFZQSxHQUFwQkEsVUFBcUJBLFFBQWtDQSxFQUFFQSxPQUFnQkEsRUFBRUEsT0FBZUEsRUFBRUEsUUFBZ0JBO1lBQ3hHUyxJQUFJQSxPQUFPQSxHQUFHQSxPQUFPQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsR0FBR0EsUUFBUUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDcENBLENBQUNBLENBQUNBLFNBQVNBLEdBQUdBLDJCQUEyQkEsQ0FBQ0E7WUFDMUNBLENBQUNBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLE9BQU9BLEdBQUdBLE9BQU9BLEdBQUdBLFFBQVFBLENBQUNBLENBQUNBO1lBQzlDQSxDQUFDQSxDQUFDQSxPQUFPQSxHQUFHQSxVQUFBQSxFQUFFQTtnQkFDVkEsRUFBRUEsQ0FBQ0EsZUFBZUEsRUFBRUEsQ0FBQ0E7Z0JBQ3JCQSxPQUFPQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQTtnQkFDbkJBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBO29CQUNWQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtvQkFDN0JBLENBQUNBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO2dCQUM3QkEsQ0FBQ0E7Z0JBQUNBLElBQUlBLENBQUNBLENBQUNBO29CQUNKQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtvQkFDNUJBLENBQUNBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO2dCQUM5QkEsQ0FBQ0E7Z0JBQ0RBLFFBQVFBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1lBQ3RCQSxDQUFDQSxDQUFBQTtZQUNEQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNiQSxDQUFDQTtRQUNMVCxlQUFDQTtJQUFEQSxDQXRQQXRDLEFBc1BDc0MsSUFBQXRDO0lBdFBZQSxhQUFRQSxXQXNQcEJBLENBQUFBO0FBQ0xBLENBQUNBLEVBelBNLElBQUksS0FBSixJQUFJLFFBeVBWO0FDMVBELEFBQ0EsZ0NBRGdDO0FBQ2hDLElBQU8sSUFBSSxDQXlDVjtBQXpDRCxXQUFPLElBQUksRUFBQyxDQUFDO0lBQ1RBO1FBQUFnRDtRQVNBQyxDQUFDQTtRQUFERCxjQUFDQTtJQUFEQSxDQVRBaEQsQUFTQ2dELElBQUFoRDtJQVRZQSxZQUFPQSxVQVNuQkEsQ0FBQUE7SUFNREE7UUFBQWtEO1FBd0JBQyxDQUFDQTtRQXZCVUQsYUFBSUEsR0FBWEE7WUFDSUUsSUFBSUEsUUFBUUEsR0FBaUJBO2dCQUN6QkEsRUFBRUEsSUFBSUEsRUFBRUEsYUFBYUEsRUFBRUEsSUFBSUEsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUEsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUE7Z0JBQ25FQSxFQUFFQSxJQUFJQSxFQUFFQSxhQUFhQSxFQUFFQSxJQUFJQSxFQUFFQSxhQUFhQSxFQUFFQSxJQUFJQSxFQUFFQSxhQUFhQSxFQUFFQSxJQUFJQSxFQUFFQSxLQUFLQSxFQUFFQTtnQkFDOUVBLEVBQUVBLElBQUlBLEVBQUVBLGNBQWNBLEVBQUVBLElBQUlBLEVBQUVBLGNBQWNBLEVBQUVBLElBQUlBLEVBQUVBLGNBQWNBLEVBQUVBLElBQUlBLEVBQUVBLEtBQUtBLEVBQUVBO2dCQUNqRkEsRUFBRUEsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUEsUUFBUUEsRUFBRUEsT0FBT0EsRUFBRUEsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUEsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUE7Z0JBQy9EQSxFQUFFQSxJQUFJQSxFQUFFQSxnQkFBZ0JBLEVBQUVBLFFBQVFBLEVBQUVBLE9BQU9BLEVBQUVBLElBQUlBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLEVBQUVBLFdBQVdBLEVBQUVBLElBQUlBLEVBQUVBLE1BQU1BLEVBQUVBO2dCQUM1RkEsRUFBRUEsSUFBSUEsRUFBRUEsa0JBQWtCQSxFQUFFQSxJQUFJQSxFQUFFQSxVQUFVQSxFQUFFQSxJQUFJQSxFQUFFQSxLQUFLQSxFQUFFQTtnQkFDM0RBLEVBQUVBLElBQUlBLEVBQUVBLFNBQVNBLEVBQUVBLElBQUlBLEVBQUVBLFNBQVNBLEVBQUVBLElBQUlBLEVBQUVBLE1BQU1BLEVBQUVBO2dCQUNsREEsRUFBRUEsSUFBSUEsRUFBRUEscUJBQXFCQSxFQUFFQSxRQUFRQSxFQUFFQSxzQkFBc0JBLEVBQUVBLElBQUlBLEVBQUVBLFFBQVFBLEVBQUVBLElBQUlBLEVBQUVBLE1BQU1BLEVBQUVBO2dCQUMvRkEsRUFBRUEsSUFBSUEsRUFBRUEsc0JBQXNCQSxFQUFFQSxRQUFRQSxFQUFFQSxpQkFBaUJBLEVBQUVBLElBQUlBLEVBQUVBLFNBQVNBLEVBQUVBLElBQUlBLEVBQUVBLE1BQU1BLEVBQUVBO2dCQUM1RkEsRUFBRUEsSUFBSUEsRUFBRUEsaUJBQWlCQSxFQUFFQSxJQUFJQSxFQUFFQSxnQkFBZ0JBLEVBQUVBLFVBQVVBLEVBQUVBLElBQUlBLEVBQUVBO2dCQUNyRUEsRUFBRUEsSUFBSUEsRUFBRUEsV0FBV0EsRUFBRUEsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUEsVUFBVUEsRUFBRUEsSUFBSUEsRUFBRUE7Z0JBQ3JEQSxFQUFFQSxJQUFJQSxFQUFFQSwwQkFBMEJBLEVBQUVBLElBQUlBLEVBQUVBLE1BQU1BLEVBQUVBLFVBQVVBLEVBQUVBLElBQUlBLEVBQUVBO2dCQUNwRUEsRUFBRUEsSUFBSUEsRUFBRUEsV0FBV0EsRUFBRUEsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUEsVUFBVUEsRUFBRUEsSUFBSUEsRUFBRUE7YUFDeERBLENBQUNBO1lBQ0ZBLFFBQVFBLENBQUNBLFlBQVlBLEdBQUdBLEVBQUVBLENBQUNBO1lBQzNCQSxRQUFRQSxDQUFDQSxNQUFNQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUNyQkEsSUFBSUEsSUFBSUEsR0FBR0EsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFDM0JBLFFBQVFBLENBQUNBLE9BQU9BLENBQUNBLFVBQUFBLENBQUNBLElBQUlBLE9BQUFBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEVBQWhCQSxDQUFnQkEsQ0FBQ0EsQ0FBQ0E7WUFDeENBLElBQUlBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0E7WUFDakZBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBO1FBQ3BCQSxDQUFDQTtRQUNMRixlQUFDQTtJQUFEQSxDQXhCQWxELEFBd0JDa0QsSUFBQWxEO0lBeEJZQSxhQUFRQSxXQXdCcEJBLENBQUFBO0FBQ0xBLENBQUNBLEVBekNNLElBQUksS0FBSixJQUFJLFFBeUNWO0FDMUNELEFBQ0EsZ0NBRGdDO0FBQ2hDLElBQU8sSUFBSSxDQTZQVjtBQTdQRCxXQUFPLElBQUksRUFBQyxDQUFDO0lBRVRBO1FBVUlxRCxhQUFvQkEsR0FBZ0JBLEVBQVVBLE9BQW9CQTtZQVZ0RUMsaUJBMFBDQTtZQWhQdUJBLFFBQUdBLEdBQUhBLEdBQUdBLENBQWFBO1lBQVVBLFlBQU9BLEdBQVBBLE9BQU9BLENBQWFBO1lBQzlEQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxpQkFBaUJBLENBQUNBLGlCQUFZQSxDQUFDQSxZQUFZQSxFQUFFQSxjQUFNQSxPQUFBQSxLQUFJQSxDQUFDQSxZQUFZQSxFQUFFQSxFQUFuQkEsQ0FBbUJBLENBQUNBLENBQUNBO1lBQ2pGQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxpQkFBaUJBLENBQUNBLGlCQUFZQSxDQUFDQSxpQkFBaUJBLEVBQUVBLGNBQU1BLE9BQUFBLEtBQUlBLENBQUNBLGlCQUFpQkEsRUFBRUEsRUFBeEJBLENBQXdCQSxDQUFDQSxDQUFDQTtZQUMzRkEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxpQkFBWUEsQ0FBQ0EsVUFBVUEsRUFBRUEsY0FBTUEsT0FBQUEsS0FBSUEsQ0FBQ0EsVUFBVUEsRUFBRUEsRUFBakJBLENBQWlCQSxDQUFDQSxDQUFDQTtZQUM3RUEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxpQkFBWUEsQ0FBQ0EsVUFBVUEsRUFBRUEsVUFBQ0EsTUFBTUEsRUFBRUEsUUFBUUEsSUFBS0EsT0FBQUEsS0FBSUEsQ0FBQ0EsVUFBVUEsQ0FBWUEsUUFBUUEsQ0FBQ0EsRUFBcENBLENBQW9DQSxDQUFDQSxDQUFDQTtZQUNoSEEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxpQkFBWUEsQ0FBQ0EsYUFBYUEsRUFBRUEsY0FBTUEsT0FBQUEsS0FBSUEsQ0FBQ0EsY0FBY0EsRUFBRUEsRUFBckJBLENBQXFCQSxDQUFDQSxDQUFDQTtZQUVwRkEsT0FBT0EsQ0FBQ0EsT0FBT0EsR0FBR0EsVUFBQUEsRUFBRUE7Z0JBQ2hCQSxJQUFJQSxJQUFJQSxHQUFHQSxLQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtnQkFDakNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLElBQUlBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO29CQUNmQSxLQUFJQSxDQUFDQSxrQkFBa0JBLENBQUNBLEVBQUVBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO2dCQUN0Q0EsQ0FBQ0E7WUFDTEEsQ0FBQ0EsQ0FBQ0E7WUFFRkEsT0FBT0EsQ0FBQ0EsYUFBYUEsR0FBR0EsVUFBQUEsRUFBRUE7Z0JBQ3RCQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDZkEsRUFBRUEsQ0FBQ0EsY0FBY0EsRUFBRUEsQ0FBQ0E7b0JBQ3BCQSxFQUFFQSxDQUFDQSxlQUFlQSxFQUFFQSxDQUFDQTtvQkFDckJBLEtBQUlBLENBQUNBLGtCQUFrQkEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2hDQSxDQUFDQTtZQUNMQSxDQUFDQSxDQUFBQTtZQUVEQSxJQUFJQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQTtZQUNuQkEsSUFBSUEsQ0FBQ0EsVUFBVUEsRUFBRUEsQ0FBQ0E7WUFDbEJBLElBQUlBLENBQUNBLFVBQVVBLEVBQUVBLENBQUNBO1lBQ2xCQSxJQUFJQSxDQUFDQSxjQUFjQSxFQUFFQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsY0FBY0EsRUFBRUEsQ0FBQ0E7UUFDMUJBLENBQUNBO1FBRU9ELDBCQUFZQSxHQUFwQkEsVUFBcUJBLEtBQWlCQTtZQUNsQ0UsSUFBSUEsTUFBTUEsR0FBZ0JBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBO1lBQ3ZDQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxTQUFTQSxDQUFDQSxRQUFRQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDeENBLElBQUlBLEVBQUVBLEdBQUdBLE1BQU1BLENBQUNBLFlBQVlBLENBQUNBLGNBQWNBLENBQUNBLENBQUNBO2dCQUM3Q0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsS0FBS0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ25CQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtnQkFDNUNBLENBQUNBO1lBQ0xBLENBQUNBO1lBQ0RBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO1FBQ2hCQSxDQUFDQTtRQUVPRixnQ0FBa0JBLEdBQTFCQSxVQUEyQkEsRUFBY0EsRUFBRUEsSUFBV0E7WUFDbERHLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLFNBQUlBLENBQUNBLEVBQUVBLENBQUNBLEtBQUtBLEVBQUVBLEVBQUVBLENBQUNBLEtBQUtBLENBQUNBLEVBQUVBLElBQUlBLElBQUlBLElBQUlBLENBQUNBLFlBQVlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1FBQ3ZGQSxDQUFDQTtRQUVPSCw0QkFBY0EsR0FBdEJBO1lBQUFJLGlCQXdDQ0E7WUF2Q0dBLElBQUlBLEdBQUdBLEdBQWdCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxhQUFhQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtZQUN6REEsSUFBSUEsU0FBU0EsR0FBR0EsS0FBS0EsRUFBRUEsS0FBYUEsRUFBRUEsS0FBYUEsQ0FBQ0E7WUFDcERBLElBQUlBLElBQUlBLEdBQUdBLFVBQUNBLEVBQWNBO2dCQUN0QkEsU0FBU0EsR0FBR0EsS0FBS0EsQ0FBQ0E7Z0JBQ2xCQSxLQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxlQUFlQSxDQUFDQSxXQUFXQSxFQUFFQSxLQUFLQSxDQUFDQSxDQUFDQTtnQkFDN0NBLEVBQUVBLENBQUNBLGNBQWNBLEVBQUVBLENBQUNBO1lBQ3hCQSxDQUFDQSxDQUFDQTtZQUNGQSxJQUFJQSxLQUFLQSxHQUFHQSxVQUFDQSxFQUFjQTtnQkFDdkJBLFNBQVNBLEdBQUdBLElBQUlBLENBQUNBO2dCQUNqQkEsS0FBS0EsR0FBR0EsRUFBRUEsQ0FBQ0EsT0FBT0EsQ0FBQ0E7Z0JBQ25CQSxLQUFLQSxHQUFHQSxFQUFFQSxDQUFDQSxPQUFPQSxDQUFDQTtnQkFDbkJBLEtBQUlBLENBQUNBLEdBQUdBLENBQUNBLGVBQWVBLENBQUNBLFdBQVdBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO2dCQUM1Q0EsRUFBRUEsQ0FBQ0EsY0FBY0EsRUFBRUEsQ0FBQ0E7WUFDeEJBLENBQUNBLENBQUFBO1lBQ0RBLEdBQUdBLENBQUNBLFdBQVdBLEdBQUdBLFVBQUFBLEVBQUVBO2dCQUNoQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsTUFBTUEsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsTUFBTUEsS0FBS0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3ZDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtnQkFDZEEsQ0FBQ0E7WUFDTEEsQ0FBQ0EsQ0FBQ0E7WUFDRkEsR0FBR0EsQ0FBQ0EsU0FBU0EsR0FBR0EsVUFBQUEsRUFBRUE7Z0JBQ2RBLEVBQUVBLENBQUNBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBO29CQUNaQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtnQkFDYkEsQ0FBQ0E7WUFDTEEsQ0FBQ0EsQ0FBQUE7WUFDREEsR0FBR0EsQ0FBQ0EsV0FBV0EsR0FBR0EsVUFBQUEsRUFBRUE7Z0JBQ2hCQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxTQUFTQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxPQUFPQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDckNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO2dCQUNkQSxDQUFDQTtnQkFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ1pBLEVBQUVBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO3dCQUNqQkEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7b0JBQ2JBLENBQUNBO29CQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTt3QkFDSkEsTUFBTUEsQ0FBQ0EsV0FBV0EsR0FBR0EsS0FBS0EsR0FBR0EsRUFBRUEsQ0FBQ0EsT0FBT0EsRUFBRUEsV0FBV0EsR0FBR0EsS0FBS0EsR0FBR0EsRUFBRUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7d0JBQzNFQSxLQUFLQSxHQUFHQSxFQUFFQSxDQUFDQSxPQUFPQSxDQUFDQTt3QkFDbkJBLEtBQUtBLEdBQUdBLEVBQUVBLENBQUNBLE9BQU9BLENBQUNBO3dCQUNuQkEsRUFBRUEsQ0FBQ0EsY0FBY0EsRUFBRUEsQ0FBQ0E7b0JBQ3hCQSxDQUFDQTtnQkFDTEEsQ0FBQ0E7WUFDTEEsQ0FBQ0EsQ0FBQ0E7UUFDTkEsQ0FBQ0E7UUFFT0oseUJBQVdBLEdBQW5CQTtZQUFBSyxpQkE2Q0NBO1lBNUNHQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxhQUFhQSxJQUFJQSxJQUFJQSxDQUFDQTtnQkFDM0JBLElBQUlBLENBQUNBLGFBQWFBLENBQUNBLGFBQWFBLENBQUNBLFdBQVdBLENBQUNBLElBQUlBLENBQUNBLGFBQWFBLENBQUNBLENBQUNBO1lBQ3JFQSxJQUFJQSxDQUFDQSxhQUFhQSxHQUFHQSxRQUFRQSxDQUFDQSxhQUFhQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0E7WUFDN0NBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBO2lCQUVmQSxPQUFPQSxDQUFDQSxVQUFBQSxDQUFDQSxJQUFJQSxPQUFBQSxLQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFoREEsQ0FBZ0RBLENBQUNBLENBQUNBO1lBRXBFQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxhQUFhQSxJQUFJQSxJQUFJQSxDQUFDQTtnQkFDM0JBLElBQUlBLENBQUNBLGFBQWFBLENBQUNBLGFBQWFBLENBQUNBLFdBQVdBLENBQUNBLElBQUlBLENBQUNBLGFBQWFBLENBQUNBLENBQUNBO1lBQ3JFQSxJQUFJQSxDQUFDQSxhQUFhQSxHQUFHQSxRQUFRQSxDQUFDQSxhQUFhQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0E7WUFDN0NBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLFVBQUFBLENBQUNBO3VCQUMxQkEsS0FBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsRUFBRUEsb0JBQW9CQSxDQUFDQSxDQUFDQTtZQUFsSEEsQ0FBa0hBLENBQUNBLENBQUNBO1lBRXhIQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxhQUFhQSxJQUFJQSxJQUFJQSxDQUFDQTtnQkFDM0JBLElBQUlBLENBQUNBLGFBQWFBLENBQUNBLGFBQWFBLENBQUNBLFdBQVdBLENBQUNBLElBQUlBLENBQUNBLGFBQWFBLENBQUNBLENBQUNBO1lBQ3JFQSxJQUFJQSxDQUFDQSxhQUFhQSxHQUFHQSxRQUFRQSxDQUFDQSxhQUFhQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0E7WUFDN0NBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBO2lCQUdmQSxPQUFPQSxDQUFDQSxVQUFBQSxDQUFDQTtnQkFDTkEsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7Z0JBQ3pCQSxJQUFJQSxJQUFJQSxHQUFZQSxJQUFJQSxDQUFDQTtnQkFDekJBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO29CQUNyQ0EsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3BCQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxJQUFJQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDZkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsS0FBS0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQ3JCQSxLQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQSxFQUFFQSxJQUFJQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDM0ZBLENBQUNBO3dCQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxLQUFLQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDckJBLEtBQUlBLENBQUNBLGFBQWFBLENBQUNBLFdBQVdBLENBQUNBLEtBQUlBLENBQUNBLFlBQVlBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO3dCQUNuR0EsQ0FBQ0E7b0JBQ0xBLENBQUNBO29CQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTt3QkFDSkEsS0FBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBSUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQzlGQSxDQUFDQTtvQkFDREEsS0FBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBSUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQzFGQSxLQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbEdBLElBQUlBLEdBQUdBLEdBQUdBLENBQUNBO2dCQUNmQSxDQUFDQTtnQkFDREEsRUFBRUEsQ0FBQUEsQ0FBQ0EsSUFBSUEsSUFBSUEsSUFBSUEsQ0FBQ0E7b0JBQ1pBLEtBQUlBLENBQUNBLGFBQWFBLENBQUNBLFdBQVdBLENBQUNBLEtBQUlBLENBQUNBLFlBQVlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO1lBQzlHQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNYQSxDQUFDQTtRQUVPTCwwQkFBWUEsR0FBcEJBLFVBQXFCQSxFQUFVQSxFQUFFQSxFQUFVQSxFQUFFQSxFQUFVQSxFQUFFQSxFQUFVQSxFQUFFQSxJQUFZQTtZQUM3RU0sTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsU0FBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0EsRUFBRUEsU0FBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0E7UUFDekZBLENBQUNBO1FBRU9OLHdCQUFVQSxHQUFsQkEsVUFBbUJBLFFBQW1CQTtZQUNsQ08sRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsYUFBYUEsSUFBSUEsSUFBSUEsQ0FBQ0E7Z0JBQzNCQSxJQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxhQUFhQSxDQUFDQSxXQUFXQSxDQUFDQSxJQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQTtZQUVyRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ25CQSxJQUFJQSxDQUFDQSxhQUFhQSxHQUFHQSxJQUFJQSxDQUFDQTtnQkFDMUJBLE1BQU1BLENBQUNBO1lBQ1hBLENBQUNBO1lBRURBLElBQUlBLENBQUNBLGFBQWFBLEdBQUdBLFFBQVFBLENBQUNBLGFBQWFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxXQUFXQSxDQUFDQSxJQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQTtZQUM3Q0EsT0FBT0EsUUFBUUEsSUFBSUEsUUFBUUEsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7Z0JBQy9CQSxJQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxXQUFXQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxFQUFFQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxFQUFFQSxNQUFNQSxFQUFFQSxNQUFNQSxHQUFHQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDbElBLFFBQVFBLEdBQUdBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBO1lBQzdCQSxDQUFDQTtRQUNMQSxDQUFDQTtRQUVPUCx3QkFBVUEsR0FBbEJBO1lBQ0lRLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLG1CQUFtQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7UUFDdkZBLENBQUNBO1FBQ09SLDBCQUFZQSxHQUFwQkE7WUFDSVMsSUFBSUEsQ0FBQ0EsVUFBVUEsR0FBR0EsSUFBSUEsQ0FBQ0EsbUJBQW1CQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFVQSxFQUFFQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtRQUM3RkEsQ0FBQ0E7UUFDT1QsK0JBQWlCQSxHQUF6QkE7WUFDSVUsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsbUJBQW1CQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxFQUFFQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtRQUN2RkEsQ0FBQ0E7UUFFT1YsaUNBQW1CQSxHQUEzQkEsVUFBNEJBLElBQVdBLEVBQUVBLElBQWlCQTtZQUN0RFcsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0E7Z0JBQ0xBLElBQUlBLENBQUNBLGFBQWFBLENBQUNBLFdBQVdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ3pDQSxNQUFNQSxDQUFDQSxJQUFJQSxJQUFJQSxJQUFJQTtrQkFDQUEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7a0JBQzFEQSxJQUFJQSxDQUFDQTtRQUNmQSxDQUFDQTtRQUVPWCx3QkFBVUEsR0FBbEJBO1lBQ0lZLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGFBQWFBLENBQUNBLENBQUNBLENBQUNBO2dCQUN0QkEsSUFBSUEsQ0FBQ0EsYUFBYUEsR0FBR0EsUUFBUUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ25EQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxXQUFXQSxDQUFDQSxJQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQTtnQkFDN0NBLElBQUlBLENBQVNBLEVBQUVBLEVBQWtCQSxDQUFDQTtnQkFDbENBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEVBQUVBLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO29CQUN0QkEsRUFBRUEsR0FBR0EsUUFBUUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7b0JBQ25DQSxFQUFFQSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtvQkFDN0JBLEVBQUVBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLFlBQVlBLENBQUNBLENBQUNBO29CQUMvQkEsRUFBRUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsU0FBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsU0FBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0E7b0JBQzNEQSxJQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxXQUFXQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtnQkFDdkNBLENBQUNBO2dCQUNEQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxFQUFFQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtvQkFDdEJBLEVBQUVBLEdBQUdBLFFBQVFBLENBQUNBLGFBQWFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO29CQUNuQ0EsRUFBRUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7b0JBQzdCQSxFQUFFQSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQTtvQkFDL0JBLEVBQUVBLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLFNBQUlBLENBQUNBLE1BQU1BLEdBQUdBLFNBQUlBLENBQUNBLFlBQVlBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBO29CQUM1REEsSUFBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3ZDQSxDQUFDQTtZQWdCTEEsQ0FBQ0E7UUFDTEEsQ0FBQ0E7UUFFT1osNEJBQWNBLEdBQXRCQTtZQUFBYSxpQkFNQ0E7WUFMR0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsU0FBU0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDNUJBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLFFBQVFBLENBQUNBLE9BQU9BLENBQUNBLFVBQUFBLENBQUNBO2dCQUN2QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7b0JBQ1RBLEtBQUlBLENBQUNBLE9BQU9BLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLE9BQU9BLEdBQUdBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ3JEQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNQQSxDQUFDQTtRQUVPYixzQkFBUUEsR0FBaEJBLFVBQWlCQSxJQUFXQTtZQUN4QmMsSUFBSUEsT0FBT0EsR0FBR0EsUUFBUUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFDNUNBLE9BQU9BLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1lBQ2xDQSxPQUFPQSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUMxQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0E7WUFDdkNBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBO1lBQ3RDQSxPQUFPQSxDQUFDQSxZQUFZQSxDQUFDQSxjQUFjQSxFQUFFQSxDQUFDQSxJQUFJQSxDQUFDQSxXQUFXQSxJQUFJQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUN6RUEsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0E7UUFDbkJBLENBQUNBO1FBRU9kLHNCQUFRQSxHQUFoQkEsVUFBaUJBLEVBQVNBLEVBQUVBLEVBQVNBLEVBQUVBLElBQVlBLEVBQUVBLE9BQWdCQTtZQUNqRWUsSUFBSUEsT0FBT0EsR0FBR0EsUUFBUUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFDNUNBLE9BQU9BLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1lBQ2xDQSxPQUFPQSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNyQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0E7Z0JBQ1JBLE9BQU9BLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1lBQ25DQSxJQUFJQSxNQUFNQSxHQUFHQSxTQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUNuQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0E7WUFDL0RBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBO1lBQ25EQSxPQUFPQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxHQUFHQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUNwQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsU0FBU0EsR0FBR0EsWUFBVUEsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsU0FBTUEsQ0FBQ0E7WUFDL0VBLE1BQU1BLENBQUNBLE9BQU9BLENBQUNBO1FBQ25CQSxDQUFDQTtRQUNMZixVQUFDQTtJQUFEQSxDQTFQQXJELEFBMFBDcUQsSUFBQXJE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Q0EsYUFBYUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsRUFBckNBLENBQXFDQSxDQUFDQSxDQUFDQTtZQUMvRkEsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBQUEsQ0FBQ0EsSUFBSUEsT0FBQUEsS0FBS0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsU0FBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsU0FBSUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsUUFBUUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsRUFBckVBLENBQXFFQSxDQUFDQSxDQUFDQTtZQUM1R0EsSUFBSUEsQ0FBQ0EsU0FBU0EsR0FBR0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBQUEsQ0FBQ0E7Z0JBQ2pDQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxTQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxTQUFJQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQTtnQkFDaEVBLElBQUlBLElBQUlBLEdBQUdBLEtBQUtBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO2dCQUVuQ0EsSUFBSUEsSUFBSUEsR0FBV0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JCQSxJQUFJQSxJQUFJQSxHQUFXQSxDQUFDQSxDQUFDQTtnQkFDckJBLElBQUlBLEtBQUtBLEdBQVdBLENBQUNBLENBQUNBO2dCQUN0QkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQUEsQ0FBQ0E7b0JBQ2ZBLElBQUlBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBO29CQUN2Q0EsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0E7b0JBQzlCQSxLQUFLQSxJQUFJQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQTtnQkFDckJBLENBQUNBLENBQUNBLENBQUNBO2dCQUNIQSxJQUFJQSxDQUFDQSxHQUFHQSxHQUFHQSxTQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxHQUFHQSxLQUFLQSxFQUFFQSxJQUFJQSxHQUFHQSxLQUFLQSxDQUFDQSxDQUFDQTtnQkFDckRBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO1lBQ2hCQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUdIQSxJQUFJQSxDQUFDQSxTQUFTQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUNwQkEsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQUEsQ0FBQ0EsSUFBSUEsT0FBQUEsS0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBeEJBLENBQXdCQSxDQUFDQSxDQUFDQTtRQUN0REEsQ0FBQ0E7UUFFREQsNkJBQWFBLEdBQWJBLFVBQWNBLElBQXFCQSxFQUFFQSxJQUFZQTtZQUFqREUsaUJBNkJDQTtZQTVCR0EsSUFBSUEsS0FBS0EsR0FBa0JBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ3RDQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUMxQ0EsSUFBSUEsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsUUFBUUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7WUFDMUNBLElBQUlBLEtBQUtBLEdBQVdBLEtBQUtBLENBQUNBLEdBQUdBLENBQUNBLFVBQUFBLENBQUNBLElBQUlBLE9BQUFBLElBQUlBLFNBQUlBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLEVBQUtBLFFBQVFBLFVBQUtBLENBQUNBLENBQUNBLElBQU1BLEVBQUVBLElBQUlBLFNBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLEVBQUVBLElBQUlBLENBQUNBLEVBQTFFQSxDQUEwRUEsQ0FBQ0EsQ0FBQ0E7WUFDL0dBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1lBQ3RDQSxJQUFJQSxJQUFJQSxHQUFHQSxLQUFLQSxDQUFDQSxhQUFhQSxDQUFDQTtZQUMvQkEsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQ0EsQ0FBQ0EsRUFBRUEsRUFBRUE7Z0JBQ2hCQSxJQUFJQSxFQUFFQSxHQUFHQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtnQkFDbkJBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO29CQUNWQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFBQSxFQUFFQTt3QkFDZEEsSUFBSUEsRUFBRUEsR0FBR0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7d0JBQ25CQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxTQUFJQSxDQUFDQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTt3QkFDbENBLEVBQUVBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO3dCQUNwQkEsRUFBRUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7d0JBQ3BCQSxLQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtvQkFDMUJBLENBQUNBLENBQUNBLENBQUNBO2dCQUNQQSxDQUFDQTtnQkFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2hCQSxDQUFDQSxDQUFDQSxXQUFXQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFBQSxFQUFFQTt3QkFDcEJBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLFNBQUlBLENBQUNBLEVBQUVBLEVBQUVBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO3dCQUN6Q0EsRUFBRUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7d0JBQ3BCQSxLQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtvQkFDMUJBLENBQUNBLENBQUNBLENBQUNBO2dCQUNQQSxDQUFDQTtnQkFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ1ZBLEtBQUlBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLFFBQVFBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUMzQ0EsQ0FBQ0E7WUFDTEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDUEEsQ0FBQ0E7UUFFY0YsY0FBUUEsR0FBdkJBLFVBQXdCQSxJQUFVQSxFQUFFQSxJQUFpQkE7WUFDakRHLElBQUlBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxDQUFDQSxVQUFBQSxDQUFDQSxJQUFJQSxPQUFBQSxJQUFJQSxZQUFPQSxDQUFDQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUE1QkEsQ0FBNEJBLENBQUNBLENBQUNBO1lBQzdEQSxNQUFNQSxDQUFDQSxJQUFJQSxTQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNoQ0EsQ0FBQ0E7UUFFREgsNEJBQVlBLEdBQVpBLFVBQWFBLEVBQVVBO1lBQ25CSSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQTtRQUN0Q0EsQ0FBQ0E7UUFFREosNkJBQWFBLEdBQWJBLFVBQWNBLEdBQVVBO1lBQ3BCSyxJQUFJQSxJQUFJQSxHQUFHQSxLQUFLQSxDQUFDQSxhQUFhQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxFQUFFQSxTQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNyRUEsTUFBTUEsQ0FBQ0EsSUFBSUEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDbERBLENBQUNBO1FBQ0RMLCtCQUFlQSxHQUFmQSxVQUFnQkEsR0FBVUE7WUFDdEJNLElBQUlBLElBQUlBLEdBQUdBLEtBQUtBLENBQUNBLGFBQWFBLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLEVBQUVBLFNBQUlBLENBQUNBLFlBQVlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO1lBQ3ZFQSxNQUFNQSxDQUFDQSxJQUFJQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUNsREEsQ0FBQ0E7UUFDY04sbUJBQWFBLEdBQTVCQSxVQUE2QkEsTUFBY0EsRUFBRUEsSUFBV0E7WUFDcERPLElBQUlBLElBQVVBLENBQUNBO1lBQ2ZBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFVBQUFBLENBQUNBLElBQUlBLE9BQUFBLFNBQUlBLENBQUNBLFlBQVlBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLENBQUNBLENBQUNBLElBQUlBLElBQUlBLEVBQWhEQSxDQUFnREEsQ0FBQ0EsQ0FBQ0E7Z0JBQ25FQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtZQUNoQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLENBQUNBO1FBcEZjUCxtQkFBYUEsR0FBV0EsRUFBRUEsQ0FBQ0E7UUFxRjlDQSxZQUFDQTtJQUFEQSxDQTdGQW5GLEFBNkZDbUYsSUFBQW5GO0lBN0ZZQSxVQUFLQSxRQTZGakJBLENBQUFBO0FBQ0xBLENBQUNBLEVBaEhNLElBQUksS0FBSixJQUFJLFFBZ0hWO0FDakhELHNEQUFzRDtBQUN0RCx3REFBd0Q7QUFDeEQsOEJBQThCO0FBQzlCLGlDQUFpQztBQUNqQyxrQ0FBa0M7QUFDbEMsc0NBQXNDO0FBQ3RDLG1DQUFtQztBQUNuQyxtQ0FBbUM7QUFDbkMsOEJBQThCO0FBQzlCLCtCQUErQjtBQUMvQiwrQkFBK0I7QUFDL0IsZ0NBQWdDIiwiZmlsZSI6InRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIl9yZWZzLnRzXCIvPlxyXG5tb2R1bGUgVGVzcCB7XHJcbiAgICBleHBvcnQgdHlwZSBDaGFuZ2VMaXN0ZW5lckZ1bmMgPSAocmVhc29uOiBDaGFuZ2VSZWFzb24sIGRhdGE6IGFueSkgPT4gdm9pZDtcclxuICAgIGV4cG9ydCBlbnVtIENoYW5nZVJlYXNvbiB7XHJcbiAgICAgICAgTm9uZSA9IDB4MCxcclxuICAgICAgICAvKiogVGhlIHNlbGVjdGVkIHNvdXJjZSBub2RlIGhhcyBjaGFuZ2VkICovXHJcbiAgICAgICAgU291cmNlQ2hhbmdlID0gMHgxLFxyXG4gICAgICAgIC8qKiBUaGUgc2VsZWN0ZWQgZGVzdGluYXRpb24gbm9kZSBoYXMgY2hhbmdlZCAqL1xyXG4gICAgICAgIERlc3RpbmF0aW9uQ2hhbmdlID0gMHgyLFxyXG4gICAgICAgIC8qKiBUaGUgbWFyayBub2RlIGxvY2F0aW9uIGhhcyBjaGFuZ2VkICovXHJcbiAgICAgICAgTWFya0NoYW5nZSA9IDB4NCxcclxuICAgICAgICAvKiogVGhlIGVpdGhlciB0aGUgc291cmNlLCBkZXN0aW5hdGlvbiBvciBtYXJrIGxvY2F0aW9uIGhhcyBjaGFuZ2VkICovXHJcbiAgICAgICAgQ29udGV4dENoYW5nZSA9IFNvdXJjZUNoYW5nZSB8IERlc3RpbmF0aW9uQ2hhbmdlIHwgTWFya0NoYW5nZSxcclxuICAgICAgICAvKiogVGhlIGVuYWJsZWQgc3RhdGUgb3IgdmlzaWJpbGl0eSBvZiBhIGZlYXR1cmUgaGFzIGNoYW5nZWQgKi9cclxuICAgICAgICBGZWF0dXJlQ2hhbmdlID0gMHg4LFxyXG4gICAgICAgIC8qKiBBIG5ldyBwYXRoIGhhcyBiZWVuIGNhbGN1bGF0ZWQgKi9cclxuICAgICAgICBQYXRoVXBkYXRlID0gMHgxMCxcclxuICAgICAgICAvKiogQW4gaW5wdXQgZXZlbnQgaGFzIHRyaWdnZXJlZCBtZW51cyB0byBjbG9zZSAqL1xyXG4gICAgICAgIENsZWFyTWVudXMgPSAweDIwLFxyXG4gICAgICAgIEFueSA9IDB4M2ZcclxuICAgIH1cclxuICAgIGV4cG9ydCBjbGFzcyBDaGFuZ2VMaXN0ZW5lciB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIHJlYXNvbnM6IENoYW5nZVJlYXNvbiwgcHVibGljIGZ1bmM6IENoYW5nZUxpc3RlbmVyRnVuYykgeyB9XHJcblxyXG4gICAgICAgIHRyaWdnZXIocmVhc29uOiBDaGFuZ2VSZWFzb24sIGRhdGE6IGFueSkge1xyXG4gICAgICAgICAgICBpZiAoKHRoaXMucmVhc29ucyAmIHJlYXNvbikgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZnVuYyhyZWFzb24sIGRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKiBDb3JlIFRFU1BhdGhmaW5kZXIgYXBwbGljYXRpb24gKi9cclxuICAgIGV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvbiB7XHJcbiAgICAgICAgbG9hZGVkOiBQcm9taXNlPEFwcGxpY2F0aW9uPjtcclxuICAgICAgICBlbGVtZW50OiBIVE1MRWxlbWVudDtcclxuICAgICAgICBjb250ZXh0OiBDb250ZXh0O1xyXG4gICAgICAgIGZlYXR1cmVzOiBJRmVhdHVyZUxpc3Q7XHJcbiAgICAgICAgcGF0aDogUGF0aDtcclxuICAgICAgICB3b3JsZDogV29ybGQ7XHJcbiAgICAgICAgY29udHJvbHM6IENvbnRyb2xzO1xyXG4gICAgICAgIG1hcDogTWFwO1xyXG4gICAgICAgIGN0eE1lbnU6IENvbnRleHRNZW51O1xyXG5cclxuICAgICAgICBwcml2YXRlIGxpc3RlbmVyczogQ2hhbmdlTGlzdGVuZXJbXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcclxuICAgICAgICAgICAgdGhpcy5sb2FkZWQgPSB3aW5kb3cuZmV0Y2goXCJkYXRhL2RhdGEuanNvblwiKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpXHJcbiAgICAgICAgICAgICAgICAudGhlbihkYXRhID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBuZXcgQ29udGV4dCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZlYXR1cmVzID0gRmVhdHVyZXMuaW5pdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGF0aCA9IG5ldyBQYXRoKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud29ybGQgPSBuZXcgV29ybGQodGhpcywgPElXb3JsZFNvdXJjZT48YW55PmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFwID0gbmV3IE1hcCh0aGlzLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1hcFwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250cm9scyA9IG5ldyBDb250cm9scyh0aGlzLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRyb2xzXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN0eE1lbnUgPSBuZXcgQ29udGV4dE1lbnUodGhpcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkub25tb3VzZWRvd24gPSBkb2N1bWVudC5ib2R5Lm9uY29udGV4dG1lbnUgPSAoKSA9PiB0aGlzLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLkNsZWFyTWVudXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkub25rZXlkb3duID0gZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXYud2hpY2ggPT09IDI3KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5DbGVhck1lbnVzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVCb2R5Q2xhc3MoXCJsb2FkaW5nXCIsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIExpc3RlbiBmb3IgYXBwbGljYXRpb24gbGV2ZWwgY2hhbmdlcyAqL1xyXG4gICAgICAgIGFkZENoYW5nZUxpc3RlbmVyKHJlYXNvbnM6IENoYW5nZVJlYXNvbiwgZnVuYzogQ2hhbmdlTGlzdGVuZXJGdW5jKTogQ2hhbmdlTGlzdGVuZXIge1xyXG4gICAgICAgICAgICB2YXIgbGlzdGVuZXIgPSBuZXcgQ2hhbmdlTGlzdGVuZXIocmVhc29ucywgZnVuYyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gbGlzdGVuZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qKiBSZW1vdmUgYSBwcmV2aW91c2x5IGFkZGVkIGxpc3RlbmVyICovXHJcbiAgICAgICAgcmVtb3ZlQ2hhbmdlTGlzdGVuZXIobGlzdGVuZXI6IENoYW5nZUxpc3RlbmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBpeCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xyXG4gICAgICAgICAgICBpZiAoaXggPiAtMSlcclxuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLnNwbGljZShpeCwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qKiBJbmZvcm0gYWxsIGxpc3RlbmVycyBhYm91dCBhIG5ldyBjaGFuZ2UgKi9cclxuICAgICAgICB0cmlnZ2VyQ2hhbmdlKHJlYXNvbjogQ2hhbmdlUmVhc29uLCBkYXRhPzogYW55KSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2gobCA9PiBsLnRyaWdnZXIocmVhc29uLCBkYXRhKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogVG9nZ2xlIGEgY2xhc3MgYXR0cmlidXRlIG5hbWUgaW4gdGhlIGRvY3VtZW50IGJvZHkgKi9cclxuICAgICAgICB0b2dnbGVCb2R5Q2xhc3MobmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQobmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUobmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBhcHBsaWNhdGlvbiwgZm9yIGRlYnVnZ2luZyBwdXJwb3NlcyBvbmx5ICovXHJcbiAgICBleHBvcnQgdmFyIGFwcEluc3RhbmNlID0gbmV3IEFwcGxpY2F0aW9uKCk7XHJcbn0iLCJtb2R1bGUgVGVzcCB7XHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElWZWMyIHtcclxuICAgICAgICB4OiBudW1iZXI7XHJcbiAgICAgICAgeTogbnVtYmVyO1xyXG4gICAgfVxyXG4gICAgLyoqIDItZGltZW5zaW9uYWwgZmxvYXRpbmcgcG9pbnQgdmVjdG9yICovXHJcbiAgICBleHBvcnQgY2xhc3MgVmVjMiBpbXBsZW1lbnRzIElWZWMyIHtcclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgeDogbnVtYmVyID0gMCwgcHVibGljIHk6IG51bWJlciA9IDApIHsgfVxyXG5cclxuICAgICAgICAvKiogQ2FsY3VsYXRlIHRoZSBldWNsaWRlYW4gZGlzdGFuY2UgYmV0d2VlbiB0aGlzIHZlY3RvciBhbmQgYW5vdGhlciAqL1xyXG4gICAgICAgIHN0YXRpYyBkaXN0YW5jZShzcmM6IElWZWMyLCBkc3Q6IElWZWMyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnNxcnQoKChkc3QueCAtIHNyYy54KSAqIChkc3QueCAtIHNyYy54KSkgKyAoKGRzdC55IC0gc3JjLnkpICogKGRzdC55IC0gc3JjLnkpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogQ2FsY3VsYXRlIHRoZSB0b3AtbGVmdCBjb3JuZXIgb2YgYSBjZWxsIGFzIGEgcG9zaXRpb24gdmVjdG9yICovXHJcbiAgICAgICAgc3RhdGljIGZyb21DZWxsKHg6IG51bWJlciwgeTogbnVtYmVyKTogVmVjMiB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgVmVjMih4ICogQ2VsbC53aWR0aCArIENlbGwud2lkdGhPZmZzZXQsIHkgKiBDZWxsLmhlaWdodCArIENlbGwuaGVpZ2h0T2Zmc2V0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJTm9kZSB7XHJcbiAgICAgICAgaWQ6IG51bWJlcjtcclxuICAgICAgICByZWZlcmVuY2VJZDogbnVtYmVyO1xyXG4gICAgICAgIGVkZ2VzOiBFZGdlW107XHJcbiAgICAgICAgbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIGxvbmdOYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgcG9zOiBJVmVjMjtcclxuICAgICAgICB0eXBlOiBzdHJpbmc7XHJcbiAgICAgICAgcGVybWFuZW50OiBib29sZWFuO1xyXG4gICAgfVxyXG4gICAgLyoqIEEgc2luZ2xlIHNpZ25pZmljYW50IHBvaW50IGluIHRoZSB3b3JsZCAqL1xyXG4gICAgZXhwb3J0IGNsYXNzIE5vZGUgaW1wbGVtZW50cyBJTm9kZSB7XHJcbiAgICAgICAgLyoqIEdsb2JhbGx5IHVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGlzIG5vZGUgKi9cclxuICAgICAgICBpZDogbnVtYmVyO1xyXG4gICAgICAgIC8qKiBUaGUgaWQgb2YgYSBub2RlIHRoaXMgbm9kZSB3YXMgY3JlYXRlZCBvbiAqL1xyXG4gICAgICAgIHJlZmVyZW5jZUlkOiBudW1iZXI7XHJcbiAgICAgICAgZWRnZXM6IEVkZ2VbXTtcclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgaWRlbnRpdHk6IG51bWJlciA9IDE7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIGxvbmdOYW1lOiBzdHJpbmcsIHB1YmxpYyBwb3M6IElWZWMyLCBwdWJsaWMgdHlwZTogc3RyaW5nLCBwdWJsaWMgcGVybWFuZW50OiBib29sZWFuID0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdGhpcy5pZCA9IE5vZGUuaWRlbnRpdHkrKztcclxuICAgICAgICAgICAgdGhpcy5lZGdlcyA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKiogQSBsaW5rIGJldHdlZW4gdHdvIG5vZGVzICovXHJcbiAgICBleHBvcnQgY2xhc3MgRWRnZSB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIHNyY05vZGU6IE5vZGUsIHB1YmxpYyBkZXN0Tm9kZTogTm9kZSwgcHVibGljIGNvc3Q6IG51bWJlcikgeyB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIEEgbGFyZ2UgYXJlYSBpbiB0aGUgd29ybGQgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBDZWxsIHtcclxuICAgICAgICBzdGF0aWMgd2lkdGg6IG51bWJlciA9IDQ0LjU7XHJcbiAgICAgICAgc3RhdGljIGhlaWdodDogbnVtYmVyID0gNDQuNjtcclxuICAgICAgICBzdGF0aWMgd2lkdGhPZmZzZXQ6IG51bWJlciA9IDEyO1xyXG4gICAgICAgIHN0YXRpYyBoZWlnaHRPZmZzZXQ6IG51bWJlciA9IDM1O1xyXG4gICAgICAgIHN0YXRpYyBmcm9tUG9zaXRpb24ocG9zOiBJVmVjMik6IFZlYzIge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFZlYzIoKHBvcy54IC0gQ2VsbC53aWR0aE9mZnNldCkgLyBDZWxsLndpZHRoLCAocG9zLnkgLSBDZWxsLmhlaWdodE9mZnNldCkgLyBDZWxsLmhlaWdodCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSUNlbGxSb3cge1xyXG4gICAgICAgIHk6IG51bWJlcjtcclxuICAgICAgICB4MTogbnVtYmVyO1xyXG4gICAgICAgIHgyOiBudW1iZXI7XHJcbiAgICAgICAgd2lkdGg6IG51bWJlcjtcclxuICAgIH1cclxuICAgIC8qKiBBIHNpbmdsZSByb3cgb2YgY2VsbHMgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBDZWxsUm93IHtcclxuICAgICAgICB3aWR0aDogbnVtYmVyO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgeTogbnVtYmVyLCBwdWJsaWMgeDE6IG51bWJlciwgcHVibGljIHgyOiBudW1iZXIpIHtcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IHgyIC0geDEgKyAxO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElBcmVhIHtcclxuICAgICAgICB0YXJnZXQ6IElOb2RlO1xyXG4gICAgICAgIHJvd3M6IElDZWxsUm93W107XHJcbiAgICAgICAgbWluWTogbnVtYmVyO1xyXG4gICAgICAgIG1heFk6IG51bWJlcjtcclxuICAgIH1cclxuICAgIC8qKiBBbiBhcmVhIG9mIG9uZSBvciBtb3JlIGNlbGxzICovXHJcbiAgICBleHBvcnQgY2xhc3MgQXJlYSBpbXBsZW1lbnRzIElBcmVhIHtcclxuICAgICAgICBtaW5ZOiBudW1iZXI7XHJcbiAgICAgICAgbWF4WTogbnVtYmVyO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgdGFyZ2V0OiBOb2RlLCBwdWJsaWMgcm93czogSUNlbGxSb3dbXSkge1xyXG4gICAgICAgICAgICB0aGlzLm1pblkgPSByb3dzWzBdLnk7XHJcbiAgICAgICAgICAgIHRoaXMubWF4WSA9IHJvd3Nbcm93cy5sZW5ndGggLSAxXS55O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIENoZWNrIGlmIHRoaXMgY2VsbCBjb250YWlucyB0aGUgc3VwcGxpZWQgY29vcmRpbmF0ZXMgKi9cclxuICAgICAgICBjb250YWluc0NlbGwocG9zOiBJVmVjMik6IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICByZXR1cm4gQXJlYS5jb250YWluc0NlbGwodGhpcywgcG9zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhdGljIGNvbnRhaW5zQ2VsbChhcmVhOiBJQXJlYSwgcG9zOiBJVmVjMikge1xyXG4gICAgICAgICAgICBpZiAocG9zLnkgPj0gYXJlYS5taW5ZICYmIHBvcy55IDwgYXJlYS5tYXhZICsgMSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJvdyA9IGFyZWEucm93c1tNYXRoLmZsb29yKHBvcy55KSAtIGFyZWEubWluWV07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcG9zLnggPj0gcm93LngxICYmIHBvcy54IDwgcm93LngyICsgMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIl9yZWZzLnRzXCIvPlxyXG5tb2R1bGUgVGVzcCB7XHJcbiAgICAvKiogVGhlIGN1cnJlbnQgbXV0YWJsZSBzdGF0ZSBvZiB0aGUgYXBwbGljYXRpb24gKi9cclxuICAgIGV4cG9ydCBjbGFzcyBDb250ZXh0IHtcclxuICAgICAgICBzb3VyY2VOb2RlOiBJTm9kZTtcclxuICAgICAgICBkZXN0Tm9kZTogSU5vZGU7XHJcbiAgICAgICAgbWFya05vZGU6IElOb2RlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwbGljYXRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLk1hcmtDaGFuZ2UsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRvZ2dsZUJvZHlDbGFzcyhcImhhcy1tYXJrXCIsIHRoaXMubWFya05vZGUgIT0gbnVsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0Q29udGV4dExvY2F0aW9uKGNvbnRleHQ6IHN0cmluZywgcG9zOiBJVmVjMikge1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IHRoaXMuYXBwLndvcmxkLmdldExhbmRtYXJrTmFtZShwb3MpIHx8IHRoaXMuYXBwLndvcmxkLmdldFJlZ2lvbk5hbWUocG9zKTtcclxuICAgICAgICAgICAgaWYgKGNvbnRleHQgPT09IFwic291cmNlXCIpIHtcclxuICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lIHx8IFwiWW91XCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldENvbnRleHROb2RlKGNvbnRleHQsIG5ldyBOb2RlKG5hbWUsIG5hbWUsIHBvcywgXCJzb3VyY2VcIikpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbnRleHQgPT09IFwiZGVzdGluYXRpb25cIikge1xyXG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUgfHwgXCJZb3VyIGRlc3RpbmF0aW9uXCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldENvbnRleHROb2RlKGNvbnRleHQsIG5ldyBOb2RlKG5hbWUsIG5hbWUsIHBvcywgXCJkZXN0aW5hdGlvblwiKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29udGV4dCA9PT0gXCJtYXJrXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFya05vZGUgPSBuZXcgTm9kZShuYW1lLCBuYW1lLCBwb3MsIFwibWFya1wiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLk1hcmtDaGFuZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNldENvbnRleHROb2RlKGNvbnRleHQ6IHN0cmluZywgbm9kZTogSU5vZGUpIHtcclxuICAgICAgICAgICAgaWYgKGNvbnRleHQgPT09IFwic291cmNlXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc291cmNlTm9kZSA9IG5vZGU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5Tb3VyY2VDaGFuZ2UpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbnRleHQgPT09IFwiZGVzdGluYXRpb25cIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kZXN0Tm9kZSA9IG5vZGU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5EZXN0aW5hdGlvbkNoYW5nZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29udGV4dCA9PT0gXCJtYXJrXCIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwb3MgPSBub2RlLnBvcztcclxuICAgICAgICAgICAgICAgIHRoaXMubWFya05vZGUgPSBuZXcgTm9kZShub2RlLmxvbmdOYW1lLCBub2RlLmxvbmdOYW1lLCBwb3MsIFwibWFya1wiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFya05vZGUucmVmZXJlbmNlSWQgPSBub2RlLnJlZmVyZW5jZUlkIHx8IG5vZGUuaWQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5NYXJrQ2hhbmdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjbGVhckNvbnRleHQoY29udGV4dDogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIGlmIChjb250ZXh0ID09PSBcInNvdXJjZVwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZU5vZGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uU291cmNlQ2hhbmdlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb250ZXh0ID09PSBcImRlc3RpbmF0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGVzdE5vZGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uRGVzdGluYXRpb25DaGFuZ2UpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbnRleHQgPT09IFwibWFya1wiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1hcmtOb2RlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLk1hcmtDaGFuZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIl9yZWZzLnRzXCIvPlxyXG5tb2R1bGUgVGVzcCB7XHJcbiAgICAvKiogTWFuYWdlcyB0aGUgY29udGV4dCBtZW51IG9mIHRoZSBtYXAgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBDb250ZXh0TWVudSB7XHJcbiAgICAgICAgcHJpdmF0ZSBtZW51OiBNZW51O1xyXG4gICAgICAgIHByaXZhdGUgbGlua3M6IE1lbnVJdGVtW107XHJcbiAgICAgICAgcHJpdmF0ZSB1bm1hcmtMaW5rOiBNZW51SXRlbTtcclxuXHJcbiAgICAgICAgcHJpdmF0ZSBwb3M6IElWZWMyO1xyXG4gICAgICAgIHByaXZhdGUgbm9kZTogSU5vZGU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXBwOiBBcHBsaWNhdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLm1lbnUgPSBuZXcgTWVudShhcHAsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlua3MgPSBbXHJcbiAgICAgICAgICAgICAgICBNZW51SXRlbS5zZXBhcmF0b3IsXHJcbiAgICAgICAgICAgICAgICBuZXcgTWVudUl0ZW0oXCJOYXZpZ2F0ZSBmcm9tIGhlcmVcIiwgKCkgPT4gdGhpcy5zZXRDb250ZXh0KFwic291cmNlXCIpKSxcclxuICAgICAgICAgICAgICAgIG5ldyBNZW51SXRlbShcIk5hdmlnYXRlIHRvIGhlcmVcIiwgKCkgPT4gdGhpcy5zZXRDb250ZXh0KFwiZGVzdGluYXRpb25cIikpLFxyXG4gICAgICAgICAgICAgICAgbmV3IE1lbnVJdGVtKFwiU2V0IE1hcmsgaGVyZVwiLCAoKSA9PiB0aGlzLnNldENvbnRleHQoXCJtYXJrXCIpKVxyXG4gICAgICAgICAgICBdO1xyXG4gICAgICAgICAgICB0aGlzLnVubWFya0xpbmsgPSBuZXcgTWVudUl0ZW0oXCJSZW1vdmUgbWFya1wiLCAoKSA9PiB0aGlzLmFwcC5jb250ZXh0LmNsZWFyQ29udGV4dChcIm1hcmtcIikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzZXRDb250ZXh0KGNvbnRleHQ6IHN0cmluZykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5ub2RlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLmNvbnRleHQuc2V0Q29udGV4dE5vZGUoY29udGV4dCwgdGhpcy5ub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLmNvbnRleHQuc2V0Q29udGV4dExvY2F0aW9uKGNvbnRleHQsIHRoaXMucG9zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb3Blbk5vZGUobm9kZTogSU5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5vcGVuKG5vZGUucG9zLCBub2RlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgb3Blbihwb3M6IElWZWMyLCBub2RlOiBJTm9kZSkge1xyXG4gICAgICAgICAgICAvLyByZW1vdmUgbm9kZSBpZiBuZWl0aGVyIGl0IG9yIGl0cyByZWZlcmVuY2UgYXJlIHBlcm1hbmVudFxyXG4gICAgICAgICAgICBpZiAobm9kZSAhPSBudWxsICYmICFub2RlLnBlcm1hbmVudCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUucmVmZXJlbmNlSWQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBub2RlID0gdGhpcy5hcHAud29ybGQuZmluZE5vZGVCeUlkKG5vZGUucmVmZXJlbmNlSWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlICE9IG51bGwgJiYgIW5vZGUucGVybWFuZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgbGFuZG1hcmsgPSB0aGlzLmFwcC53b3JsZC5nZXRMYW5kbWFya05hbWUocG9zKTtcclxuICAgICAgICAgICAgaWYgKG5vZGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZlYXQgPSB0aGlzLmFwcC5mZWF0dXJlcy5ieU5hbWVbbm9kZS50eXBlXTtcclxuICAgICAgICAgICAgICAgIGlmIChmZWF0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKGZlYXQubG9jYXRpb24gfHwgZmVhdC5uYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKG5vZGUubmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVzLnB1c2gobm9kZS5sb25nTmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobGFuZG1hcmsgIT0gbnVsbCAmJiBsYW5kbWFyayAhPT0gbm9kZS5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZXMucHVzaChsYW5kbWFyayk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBwb3MgPSBub2RlLnBvcztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChsYW5kbWFyayAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKGxhbmRtYXJrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcmVnaW9uID0gdGhpcy5hcHAud29ybGQuZ2V0UmVnaW9uTmFtZShwb3MpO1xyXG4gICAgICAgICAgICBpZiAocmVnaW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGxpbmVzLnB1c2gocmVnaW9uICsgXCIgUmVnaW9uXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBvcyA9IHBvcztcclxuICAgICAgICAgICAgdGhpcy5ub2RlID0gbm9kZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBpdGVtcyA9IGxpbmVzLm1hcChsID0+IG5ldyBNZW51SXRlbShsKSkuY29uY2F0KHRoaXMubGlua3MpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hcHAuY29udGV4dC5tYXJrTm9kZSAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgaXRlbXMucHVzaCh0aGlzLnVubWFya0xpbmspO1xyXG4gICAgICAgICAgICB0aGlzLm1lbnUuc2V0RGF0YShpdGVtcyk7XHJcbiAgICAgICAgICAgIHRoaXMubWVudS5vcGVuKCk7XHJcbiAgICAgICAgICAgIHRoaXMubWVudS5mb2N1cygpO1xyXG5cclxuICAgICAgICAgICAgdmFyIG1lbnVTdHlsZSA9IHRoaXMubWVudS5nZXRTdHlsZSgpO1xyXG4gICAgICAgICAgICBtZW51U3R5bGUubGVmdCA9IHBvcy54ICsgXCJweFwiO1xyXG4gICAgICAgICAgICBtZW51U3R5bGUudG9wID0gcG9zLnkgKyBcInB4XCI7XHJcblxyXG4gICAgICAgICAgICB2YXIgc2Nyb2xsWCA9IHBhZ2VYT2Zmc2V0O1xyXG4gICAgICAgICAgICB2YXIgc2Nyb2xsWSA9IHBhZ2VZT2Zmc2V0O1xyXG4gICAgICAgICAgICB2YXIgcmVjdCA9IHRoaXMubWVudS5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgICAgICBpZiAocmVjdC5sZWZ0IDwgMTApIHtcclxuICAgICAgICAgICAgICAgIHNjcm9sbFggPSBwYWdlWE9mZnNldCArIHJlY3QubGVmdCAtIDEwO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlY3QucmlnaHQgPiBpbm5lcldpZHRoIC0gMjcpIHtcclxuICAgICAgICAgICAgICAgIHNjcm9sbFggPSBwYWdlWE9mZnNldCArIHJlY3QucmlnaHQgLSBpbm5lcldpZHRoICsgMjc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZWN0LnRvcCA8IDUwKSB7XHJcbiAgICAgICAgICAgICAgICBzY3JvbGxZID0gcGFnZVlPZmZzZXQgKyByZWN0LnRvcCAtIDUwO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlY3QuYm90dG9tID4gaW5uZXJIZWlnaHQgLSAyNykge1xyXG4gICAgICAgICAgICAgICAgc2Nyb2xsWSA9IHBhZ2VZT2Zmc2V0ICsgcmVjdC5ib3R0b20gLSBpbm5lckhlaWdodCArIDI3O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc2Nyb2xsWCAhPT0gcGFnZVhPZmZzZXQgfHwgc2Nyb2xsWSAhPT0gcGFnZVlPZmZzZXQpXHJcbiAgICAgICAgICAgICAgICBzY3JvbGwoc2Nyb2xsWCwgc2Nyb2xsWSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGhpZGUoKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWVudS5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIl9yZWZzLnRzXCIvPlxyXG5tb2R1bGUgVGVzcCB7XHJcbiAgICAvKiogVUkgY29udHJvbHMgZm9yIHNlYXJjaCBhbmQgbmF2aWdhdGlvbiAqL1xyXG4gICAgZXhwb3J0IGNsYXNzIENvbnRyb2xzIHtcclxuICAgICAgICBwcml2YXRlIHBhdGhDb250YWluZXI6IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIHByaXZhdGUgZmVhdHVyZXNDb250YWluZXI6IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIHByaXZhdGUgc2VhcmNoSW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBzZWFyY2hCb3g6IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIHByaXZhdGUgc2VhcmNoTWVudTogTWVudTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcGxpY2F0aW9uLCBwcml2YXRlIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmFkZENoYW5nZUxpc3RlbmVyKENoYW5nZVJlYXNvbi5Tb3VyY2VDaGFuZ2UsICgpID0+IHRoaXMudXBkYXRlTm9kZUluZm8oXCIuY29udHJvbC1zb3VyY2UtaW5mb1wiLCB0aGlzLmFwcC5jb250ZXh0LnNvdXJjZU5vZGUpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLkRlc3RpbmF0aW9uQ2hhbmdlLCAoKSA9PiB0aGlzLnVwZGF0ZU5vZGVJbmZvKFwiLmNvbnRyb2wtZGVzdGluYXRpb24taW5mb1wiLCB0aGlzLmFwcC5jb250ZXh0LmRlc3ROb2RlKSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmFkZENoYW5nZUxpc3RlbmVyKENoYW5nZVJlYXNvbi5NYXJrQ2hhbmdlLCAoKSA9PiB0aGlzLnVwZGF0ZU5vZGVJbmZvKFwiLmNvbnRyb2wtbWFyay1pbmZvXCIsIHRoaXMuYXBwLmNvbnRleHQubWFya05vZGUpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLlBhdGhVcGRhdGUsIChyZWFzb24sIHBhdGhOb2RlKSA9PiB0aGlzLnVwZGF0ZVBhdGgoPElQYXRoTm9kZT5wYXRoTm9kZSkpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wYXRoQ29udGFpbmVyID0gPEhUTUxFbGVtZW50PmVsZW1lbnQucXVlcnlTZWxlY3RvcihcIi5wYXRoLWNvbnRhaW5lclwiKTtcclxuICAgICAgICAgICAgdGhpcy5mZWF0dXJlc0NvbnRhaW5lciA9IDxIVE1MRWxlbWVudD5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZmVhdHVyZXMtY29udGFpbmVyXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaElucHV0ID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZWxlbWVudC5xdWVyeVNlbGVjdG9yKFwiLnNlYXJjaC1pbnB1dFwiKTtcclxuICAgICAgICAgICAgdmFyIG92ZXJoZWFkSW5wdXQgPSA8SFRNTElucHV0RWxlbWVudD5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZmVhdHVyZS1vdmVyaGVhZCBpbnB1dFwiKTtcclxuICAgICAgICAgICAgb3ZlcmhlYWRJbnB1dC52YWx1ZSA9IE1hdGgucG93KGFwcC5mZWF0dXJlcy5ub2RlT3ZlcmhlYWQsIDEgLyAxLjUpICsgXCJcIjtcclxuICAgICAgICAgICAgb3ZlcmhlYWRJbnB1dC5vbmlucHV0ID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuZmVhdHVyZXMubm9kZU92ZXJoZWFkID0gTWF0aC5wb3coK292ZXJoZWFkSW5wdXQudmFsdWUsIDEuNSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5GZWF0dXJlQ2hhbmdlKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHZhciBmZWF0dXJlc1Zpc2libGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgKDxIVE1MRWxlbWVudD5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZmVhdHVyZXMtaWNvblwiKSkub25jbGljayA9ICgpID0+IFxyXG4gICAgICAgICAgICAgICAgdGhpcy5mZWF0dXJlc0NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gKGZlYXR1cmVzVmlzaWJsZSA9ICFmZWF0dXJlc1Zpc2libGUpID8gXCJibG9ja1wiIDogXCJub25lXCI7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluaXRTZWFyY2goKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluaXRTZWFyY2goKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWFyY2hDb250YWluZXIgPSA8SFRNTElucHV0RWxlbWVudD50aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcihcIi5zZWFyY2gtY29udGFpbmVyXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaE1lbnUgPSBuZXcgTWVudSh0aGlzLmFwcCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHZhciBtZW51U3R5bGUgPSB0aGlzLnNlYXJjaE1lbnUuZ2V0U3R5bGUoKTtcclxuICAgICAgICAgICAgdmFyIGlucHV0ID0gdGhpcy5zZWFyY2hJbnB1dC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgICAgICAgbWVudVN0eWxlLm1pbldpZHRoID0gXCIyMDBweFwiO1xyXG4gICAgICAgICAgICBtZW51U3R5bGUudG9wID0gKGlucHV0LnRvcCArIGlucHV0LmhlaWdodCkgKyBcInB4XCI7XHJcbiAgICAgICAgICAgIG1lbnVTdHlsZS5yaWdodCA9IChzZWFyY2hDb250YWluZXIuY2xpZW50V2lkdGggLSBpbnB1dC5yaWdodCkgKyBcInB4XCI7XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiBwcmVwVGVybSh0ZXh0OiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0ZXh0ICE9IG51bGwgPyB0ZXh0LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15hLXpdKy9nLCBcIiBcIikgOiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgc2VhcmNoTm9kZXMgPSB0aGlzLmFwcC53b3JsZC5ub2Rlc1xyXG4gICAgICAgICAgICAgICAgLmNvbmNhdCh0aGlzLmFwcC53b3JsZC5sYW5kbWFya3MubWFwKGEgPT4gYS50YXJnZXQpKVxyXG4gICAgICAgICAgICAgICAgLm1hcChuID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmVhdCA9IHRoaXMuYXBwLmZlYXR1cmVzLmJ5TmFtZVtuLnR5cGVdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmZWF0TmFtZSA9IGZlYXQgIT0gbnVsbCA/IGZlYXQubG9jYXRpb24gfHwgZmVhdC5uYW1lIDogbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGVybXMgPSBbbi5uYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmVhdE5hbWUgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGVybXMucHVzaChmZWF0TmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhbmRtYXJrID0gdGhpcy5hcHAud29ybGQuZ2V0TGFuZG1hcmtOYW1lKG4ucG9zKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGFuZG1hcmsgJiYgbGFuZG1hcmsgIT09IG4ubmFtZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGVybXMucHVzaChsYW5kbWFyayk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlcm1zOiB0ZXJtcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoVGVybXM6IHRlcm1zLm1hcCh0ID0+IHByZXBUZXJtKHQpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZTogblxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXQgPSBhLnNlYXJjaFRlcm1zLCBidCA9IGIuc2VhcmNoVGVybXM7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1sID0gTWF0aC5tYXgoYXQubGVuZ3RoLCBidC5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWw7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZCA9IChhdFtpXSB8fCBcIlwiKS5sb2NhbGVDb21wYXJlKGJ0W2ldIHx8IFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZCAhPT0gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5kcmF3RmVhdHVyZXMoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoSW5wdXQub25rZXlkb3duID0gKGV2KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoKGV2LndoaWNoID09PSA0MCB8fCBldi53aGljaCA9PT0gMzggfHwgZXYud2hpY2ggPT09IDEzKSAmJiB0aGlzLnNlYXJjaE1lbnUuaXNPcGVuKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaE1lbnUuZm9jdXMoZXYud2hpY2ggPT09IDM4ID8gLTEgOiAwKTtcclxuICAgICAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgdGhpcy5zZWFyY2hJbnB1dC5vbmlucHV0ID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNlYXJjaCA9IHByZXBUZXJtKHRoaXMuc2VhcmNoSW5wdXQudmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBzdGFydHM6IG51bWJlcltdID0gW107XHJcbiAgICAgICAgICAgICAgICB2YXIgdGVybXM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgICAgICAgICB2YXIgYWxwaGEgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VhcmNoLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBzZWFyY2guY2hhckNvZGVBdChpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYyA+IDk2ICYmIGMgPCAxMjMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhbHBoYSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRzLnB1c2goaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbHBoYSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFscGhhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlcm1zID0gdGVybXMuY29uY2F0KHN0YXJ0cy5tYXAocyA9PiBzZWFyY2guc3Vic3RyaW5nKHMsIGkpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFscGhhID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGFscGhhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGVybXMgPSB0ZXJtcy5jb25jYXQoc3RhcnRzLm1hcChzID0+IHNlYXJjaC5zdWJzdHJpbmcocykpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0cyA9IHNlYXJjaE5vZGVzXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihuID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGVybXMuc29tZSh0ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuLnNlYXJjaFRlcm1zLnNvbWUoc3QgPT4gc3QuaW5kZXhPZih0KSA9PT0gMCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYysrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMgPj0gc3RhcnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWFyY2hNZW51LnNldERhdGEocmVzdWx0cy5tYXAobiA9PlxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBNZW51SXRlbShuLnRlcm1zLmpvaW4oXCIsIFwiKSwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcC5jdHhNZW51Lm9wZW5Ob2RlKG4ubm9kZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJTZWFyY2goKTtcclxuICAgICAgICAgICAgICAgICAgICB9KSkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWFyY2hNZW51Lm9wZW4oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjbGVhclNlYXJjaCgpIHtcclxuICAgICAgICAgICAgdGhpcy5zZWFyY2hJbnB1dC52YWx1ZSA9IFwiXCI7XHJcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoTWVudS5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHVwZGF0ZU5vZGVJbmZvKHNlbGVjdG9yOiBzdHJpbmcsIG5vZGU6IE5vZGUpIHtcclxuICAgICAgICAgICAgdmFyIGVsID0gPEhUTUxFbGVtZW50PnRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKG5vZGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZWwudGV4dENvbnRlbnQgPSBub2RlLmxvbmdOYW1lO1xyXG4gICAgICAgICAgICAgICAgZWwub25jbGljayA9ICgpID0+IHRoaXMuYXBwLmN0eE1lbnUub3Blbk5vZGUobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBlbC50ZXh0Q29udGVudCA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICBlbC5vbmNsaWNrID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSB1cGRhdGVQYXRoKHBhdGhOb2RlOiBJUGF0aE5vZGUpIHtcclxuICAgICAgICAgICAgdmFyIGNoaWxkOiBFbGVtZW50O1xyXG4gICAgICAgICAgICB3aGlsZSAoKGNoaWxkID0gdGhpcy5wYXRoQ29udGFpbmVyLmZpcnN0RWxlbWVudENoaWxkKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXRoQ29udGFpbmVyLnJlbW92ZUNoaWxkKGNoaWxkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5wYXRoQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBwYXRoTm9kZSA/IFwiYmxvY2tcIiA6IFwibm9uZVwiO1xyXG4gICAgICAgICAgICB3aGlsZSAocGF0aE5vZGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGF0aENvbnRhaW5lci5pbnNlcnRCZWZvcmUodGhpcy5kcmF3UGF0aE5vZGUocGF0aE5vZGUpLCB0aGlzLnBhdGhDb250YWluZXIuZmlyc3RFbGVtZW50Q2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgcGF0aE5vZGUgPSBwYXRoTm9kZS5wcmV2O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBkcmF3UGF0aE5vZGUocGF0aE5vZGU6IElQYXRoTm9kZSk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBpY29uOiBzdHJpbmcsIHRleHQ6IHN0cmluZywgbGlua1RleHQ6IHN0cmluZztcclxuICAgICAgICAgICAgdmFyIG5vZGUgPSBwYXRoTm9kZS5ub2RlO1xyXG4gICAgICAgICAgICB2YXIgZWRnZSA9IHBhdGhOb2RlLnByZXZFZGdlO1xyXG4gICAgICAgICAgICBpZiAoZWRnZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbjogc3RyaW5nO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVkZ2UudHlwZSA9PT0gXCJ3YWxrXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBcIldhbGtcIjtcclxuICAgICAgICAgICAgICAgICAgICBpY29uID0gXCJjb21wYXNzXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmZWF0ID0gdGhpcy5hcHAuZmVhdHVyZXMuYnlOYW1lW2VkZ2UudHlwZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZlYXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gZmVhdC52ZXJiIHx8IGZlYXQubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbiA9IGZlYXQuaWNvbjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBlZGdlLnR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb24gPSBcInF1ZXN0aW9uXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRleHQgPSBgICR7YWN0aW9ufSB0byBgO1xyXG4gICAgICAgICAgICAgICAgbGlua1RleHQgPSBub2RlLnR5cGUgPT09IGVkZ2UudHlwZSA/IG5vZGUubmFtZSA6IG5vZGUubG9uZ05hbWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpY29uID0gXCJtYXAtbWFya2VyXCI7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gXCIgXCI7XHJcbiAgICAgICAgICAgICAgICBsaW5rVGV4dCA9IG5vZGUubG9uZ05hbWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlcIik7XHJcbiAgICAgICAgICAgIGkuY2xhc3NMaXN0LmFkZChcInBhdGgtaWNvblwiKTtcclxuICAgICAgICAgICAgaS5jbGFzc0xpc3QuYWRkKFwiZmFcIik7XHJcbiAgICAgICAgICAgIGkuY2xhc3NMaXN0LmFkZChcImZhLVwiICsgaWNvbik7XHJcbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKGkpO1xyXG5cclxuICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dCkpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICAgICAgYS50ZXh0Q29udGVudCA9IGxpbmtUZXh0O1xyXG4gICAgICAgICAgICBhLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmFwcC5jdHhNZW51Lm9wZW5Ob2RlKG5vZGUpO1xyXG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChhKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBlbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgZHJhd0ZlYXR1cmVzKCkge1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5mZWF0dXJlcy5mb3JFYWNoKGYgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IFwiZmVhdHVyZS1yb3dcIjtcclxuICAgICAgICAgICAgICAgIGVsLnRleHRDb250ZW50ID0gZi5uYW1lICsgXCI6XCI7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gXCJmZWF0dXJlLXRvZ2dsZS1jb250YWluZXJcIjtcclxuICAgICAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XHJcblxyXG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZHJhd0NoZWNrYm94KHZhbCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZi5oaWRkZW4gPSAhdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLkZlYXR1cmVDaGFuZ2UpO1xyXG4gICAgICAgICAgICAgICAgfSwgIWYuaGlkZGVuLCBcImZhLWV5ZVwiLCBcImZhLWV5ZS1zbGFzaFwiKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWYudmlzdWFsT25seSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdDaGVja2JveCh2YWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmLmRpc2FibGVkID0gIXZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uRmVhdHVyZUNoYW5nZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgIWYuZGlzYWJsZWQsIFwiZmEtY2hlY2stY2lyY2xlLW9cIiwgXCJmYS1jaXJjbGUtb1wiKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgaS5jbGFzc05hbWUgPSBcImZhIGZhLWljb24gZmEtY2lyY2xlLW8gZmVhdHVyZS10b2dnbGUgaGlkZGVuXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuZmVhdHVyZXNDb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgZHJhd0NoZWNrYm94KG9uY2hhbmdlOiAodmFsdWU6IGJvb2xlYW4pID0+IHZvaWQsIGluaXRpYWw6IGJvb2xlYW4sIGNsYXNzT246IHN0cmluZywgY2xhc3NPZmY6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICAgICAgdmFyIGNoZWNrZWQgPSBpbml0aWFsO1xyXG4gICAgICAgICAgICB2YXIgaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpXCIpO1xyXG4gICAgICAgICAgICBpLmNsYXNzTmFtZSA9IFwiZmEgZmEtaWNvbiBmZWF0dXJlLXRvZ2dsZVwiO1xyXG4gICAgICAgICAgICBpLmNsYXNzTGlzdC5hZGQoY2hlY2tlZCA/IGNsYXNzT24gOiBjbGFzc09mZik7XHJcbiAgICAgICAgICAgIGkub25jbGljayA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA9ICFjaGVja2VkO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpLmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NPZmYpO1xyXG4gICAgICAgICAgICAgICAgICAgIGkuY2xhc3NMaXN0LmFkZChjbGFzc09uKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaS5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzT24pO1xyXG4gICAgICAgICAgICAgICAgICAgIGkuY2xhc3NMaXN0LmFkZChjbGFzc09mZik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBvbmNoYW5nZShjaGVja2VkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiX3JlZnMudHNcIi8+XHJcbm1vZHVsZSBUZXNwIHtcclxuICAgIGV4cG9ydCBjbGFzcyBGZWF0dXJlIHtcclxuICAgICAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgdmVyYjogc3RyaW5nO1xyXG4gICAgICAgIGxvY2F0aW9uOiBzdHJpbmc7XHJcbiAgICAgICAgdHlwZTogc3RyaW5nO1xyXG4gICAgICAgIGljb246IHN0cmluZztcclxuICAgICAgICBkaXNhYmxlZDogYm9vbGVhbjtcclxuICAgICAgICBoaWRkZW46IGJvb2xlYW47XHJcbiAgICAgICAgdmlzdWFsT25seTogYm9vbGVhbjtcclxuICAgIH1cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSUZlYXR1cmVMaXN0IGV4dGVuZHMgQXJyYXk8RmVhdHVyZT4ge1xyXG4gICAgICAgIG5vZGVPdmVyaGVhZDogbnVtYmVyO1xyXG4gICAgICAgIGJ5TmFtZTogeyBba2V5OiBzdHJpbmddOiBGZWF0dXJlIH07XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEZlYXR1cmVzIHtcclxuICAgICAgICBzdGF0aWMgaW5pdCgpOiBJRmVhdHVyZUxpc3Qge1xyXG4gICAgICAgICAgICB2YXIgZmVhdHVyZXMgPSA8SUZlYXR1cmVMaXN0PltcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJNYXJrL1JlY2FsbFwiLCB2ZXJiOiBcIlJlY2FsbFwiLCB0eXBlOiBcIm1hcmtcIiwgaWNvbjogXCJib2x0XCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJNYWdlcyBHdWlsZFwiLCB2ZXJiOiBcIkd1aWxkIEd1aWRlXCIsIHR5cGU6IFwibWFnZXMtZ3VpbGRcIiwgaWNvbjogXCJleWVcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIlNpbHQgU3RyaWRlclwiLCB2ZXJiOiBcIlNpbHQgU3RyaWRlclwiLCB0eXBlOiBcInNpbHQtc3RyaWRlclwiLCBpY29uOiBcImJ1Z1wiIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiQm9hdFwiLCBsb2NhdGlvbjogXCJEb2Nrc1wiLCB0eXBlOiBcImJvYXRcIiwgaWNvbjogXCJzaGlwXCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJIb2xhbWF5YW4gQm9hdFwiLCBsb2NhdGlvbjogXCJEb2Nrc1wiLCB2ZXJiOiBcIkJvYXRcIiwgdHlwZTogXCJob2xhbWF5YW5cIiwgaWNvbjogXCJzaGlwXCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJQcm9weWxvbiBDaGFtYmVyXCIsIHR5cGU6IFwicHJvcHlsb25cIiwgaWNvbjogXCJjb2dcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIkdvbmRvbGFcIiwgdHlwZTogXCJnb25kb2xhXCIsIGljb246IFwic2hpcFwiIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiRGl2aW5lIEludGVydmVudGlvblwiLCBsb2NhdGlvbjogXCJJbXBlcmlhbCBDdWx0IFNocmluZVwiLCB0eXBlOiBcImRpdmluZVwiLCBpY29uOiBcImJvbHRcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIkFsbXNpdmkgSW50ZXJ2ZW50aW9uXCIsIGxvY2F0aW9uOiBcIlRyaWJ1bmFsIFRlbXBsZVwiLCB0eXBlOiBcImFsbXNpdmlcIiwgaWNvbjogXCJib2x0XCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJUcmFuc3BvcnQgbGluZXNcIiwgdHlwZTogXCJ0cmFuc3BvcnQtZWRnZVwiLCB2aXN1YWxPbmx5OiB0cnVlIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiTG9jYXRpb25zXCIsIHR5cGU6IFwibm9kZVwiLCB2aXN1YWxPbmx5OiB0cnVlIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiSW50ZXJ2ZW50aW9uIGFyZWEgYm9yZGVyXCIsIHR5cGU6IFwiYXJlYVwiLCB2aXN1YWxPbmx5OiB0cnVlIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiR3JpZGxpbmVzXCIsIHR5cGU6IFwiZ3JpZFwiLCB2aXN1YWxPbmx5OiB0cnVlIH1cclxuICAgICAgICAgICAgXTtcclxuICAgICAgICAgICAgZmVhdHVyZXMubm9kZU92ZXJoZWFkID0gMTU7XHJcbiAgICAgICAgICAgIGZlYXR1cmVzLmJ5TmFtZSA9IHt9O1xyXG4gICAgICAgICAgICB2YXIgZklkeCA9IGZlYXR1cmVzLmJ5TmFtZTtcclxuICAgICAgICAgICAgZmVhdHVyZXMuZm9yRWFjaChmID0+IGZJZHhbZi50eXBlXSA9IGYpO1xyXG4gICAgICAgICAgICBmSWR4W1widHJhbnNwb3J0LWVkZ2VcIl0uaGlkZGVuID0gZklkeFtcImFyZWFcIl0uaGlkZGVuID0gZklkeFtcImdyaWRcIl0uaGlkZGVuID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIGZlYXR1cmVzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJfcmVmcy50c1wiLz5cclxubW9kdWxlIFRlc3Age1xyXG4gICAgLyoqIFRoZSBtYXAgVUkgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBNYXAge1xyXG4gICAgICAgIHByaXZhdGUgZWRnZUNvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBub2RlQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcclxuICAgICAgICBwcml2YXRlIGFyZWFDb250YWluZXI6IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIHByaXZhdGUgcGF0aENvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBncmlkQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcclxuICAgICAgICBwcml2YXRlIHNvdXJjZUVsZW06IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIHByaXZhdGUgZGVzdEVsZW06IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIHByaXZhdGUgbWFya0VsZW06IEhUTUxFbGVtZW50O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwbGljYXRpb24sIHByaXZhdGUgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLlNvdXJjZUNoYW5nZSwgKCkgPT4gdGhpcy5yZW5kZXJTb3VyY2UoKSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmFkZENoYW5nZUxpc3RlbmVyKENoYW5nZVJlYXNvbi5EZXN0aW5hdGlvbkNoYW5nZSwgKCkgPT4gdGhpcy5yZW5kZXJEZXN0aW5hdGlvbigpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLk1hcmtDaGFuZ2UsICgpID0+IHRoaXMucmVuZGVyTWFyaygpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLlBhdGhVcGRhdGUsIChyZWFzb24sIHBhdGhOb2RlKSA9PiB0aGlzLnJlbmRlclBhdGgoPElQYXRoTm9kZT5wYXRoTm9kZSkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uRmVhdHVyZUNoYW5nZSwgKCkgPT4gdGhpcy51cGRhdGVGZWF0dXJlcygpKTtcclxuXHJcbiAgICAgICAgICAgIGVsZW1lbnQub25jbGljayA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5nZXRFdmVudE5vZGUoZXYpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlckNvbnRleHRNZW51KGV2LCBub2RlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGVsZW1lbnQub25jb250ZXh0bWVudSA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghZXYuc2hpZnRLZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlckNvbnRleHRNZW51KGV2KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJOb2RlcygpO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlck1hcmsoKTtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRmVhdHVyZXMoKTtcclxuICAgICAgICAgICAgdGhpcy5pbml0RHJhZ1Njcm9sbCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBnZXRFdmVudE5vZGUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IDxIVE1MRWxlbWVudD5ldmVudC50YXJnZXQ7XHJcbiAgICAgICAgICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwibWFwLW5vZGVcIikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZCA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoXCJkYXRhLW5vZGUtaWRcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAoaWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFwcC53b3JsZC5maW5kTm9kZUJ5SWQoK2lkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgdHJpZ2dlckNvbnRleHRNZW51KGV2OiBNb3VzZUV2ZW50LCBub2RlPzogTm9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5jdHhNZW51Lm9wZW4obmV3IFZlYzIoZXYucGFnZVgsIGV2LnBhZ2VZKSwgbm9kZSB8fCB0aGlzLmdldEV2ZW50Tm9kZShldikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBpbml0RHJhZ1Njcm9sbCgpIHtcclxuICAgICAgICAgICAgdmFyIGltZyA9IDxIVE1MRWxlbWVudD50aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcihcImltZ1wiKTtcclxuICAgICAgICAgICAgdmFyIG1vdXNlZG93biA9IGZhbHNlLCBwcmV2WDogbnVtYmVyLCBwcmV2WTogbnVtYmVyO1xyXG4gICAgICAgICAgICB2YXIgc3RvcCA9IChldjogTW91c2VFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbW91c2Vkb3duID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC50b2dnbGVCb2R5Q2xhc3MoXCJzY3JvbGxpbmdcIiwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgdmFyIHN0YXJ0ID0gKGV2OiBNb3VzZUV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBtb3VzZWRvd24gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgcHJldlggPSBldi5jbGllbnRYO1xyXG4gICAgICAgICAgICAgICAgcHJldlkgPSBldi5jbGllbnRZO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudG9nZ2xlQm9keUNsYXNzKFwic2Nyb2xsaW5nXCIsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpbWcub25tb3VzZWRvd24gPSBldiA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXYuYnV0dG9uID09PSAwICYmIGV2LnRhcmdldCA9PT0gaW1nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQoZXYpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpbWcub25tb3VzZXVwID0gZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKG1vdXNlZG93bikge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0b3AoZXYpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGltZy5vbm1vdXNlbW92ZSA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghbW91c2Vkb3duICYmIChldi5idXR0b25zICYgMSkgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQoZXYpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKG1vdXNlZG93bikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChldi53aGljaCAhPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9wKGV2KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGwocGFnZVhPZmZzZXQgKyBwcmV2WCAtIGV2LmNsaWVudFgsIHBhZ2VZT2Zmc2V0ICsgcHJldlkgLSBldi5jbGllbnRZKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldlggPSBldi5jbGllbnRYO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2WSA9IGV2LmNsaWVudFk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSByZW5kZXJOb2RlcygpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubm9kZUNvbnRhaW5lciAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5ub2RlQ29udGFpbmVyLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5ub2RlQ29udGFpbmVyKTtcclxuICAgICAgICAgICAgdGhpcy5ub2RlQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMubm9kZUNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLndvcmxkLm5vZGVzXHJcbiAgICAgICAgICAgICAgICAvLy5jb25jYXQodGhpcy5hcHAud29ybGQubGFuZG1hcmtzLm1hcChsID0+IGwudGFyZ2V0KSlcclxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKG4gPT4gdGhpcy5ub2RlQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZHJhd05vZGUobikpKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmVkZ2VDb250YWluZXIgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHRoaXMuZWRnZUNvbnRhaW5lci5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuZWRnZUNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgIHRoaXMuZWRnZUNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmVkZ2VDb250YWluZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC53b3JsZC5lZGdlcy5mb3JFYWNoKGUgPT5cclxuICAgICAgICAgICAgICAgIHRoaXMuZWRnZUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdFZGdlKGUuc3JjTm9kZS5wb3MsIGUuZGVzdE5vZGUucG9zLCBlLnNyY05vZGUudHlwZSwgXCJtYXAtdHJhbnNwb3J0LWVkZ2VcIikpKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFyZWFDb250YWluZXIgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHRoaXMuYXJlYUNvbnRhaW5lci5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuYXJlYUNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgIHRoaXMuYXJlYUNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmFyZWFDb250YWluZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC53b3JsZC5hcmVhc1xyXG4gICAgICAgICAgICAgICAgLy8uY29uY2F0KHRoaXMuYXBwLndvcmxkLnJlZ2lvbnMpXHJcbiAgICAgICAgICAgICAgICAvLy5jb25jYXQodGhpcy5hcHAud29ybGQubGFuZG1hcmtzKVxyXG4gICAgICAgICAgICAgICAgLmZvckVhY2goYSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHR5cGUgPSBhLnRhcmdldC50eXBlO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmV2OiBDZWxsUm93ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEucm93cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcm93ID0gYS5yb3dzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJldiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocm93LngxICE9PSBwcmV2LngxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcmVhQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZHJhd0NlbGxFZGdlKHJvdy54MSwgcm93LnksIHByZXYueDEsIHJvdy55LCB0eXBlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocm93LngyICE9PSBwcmV2LngyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcmVhQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZHJhd0NlbGxFZGdlKHJvdy54MiArIDEsIHJvdy55LCBwcmV2LngyICsgMSwgcm93LnksIHR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXJlYUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdDZWxsRWRnZShyb3cueDEsIHJvdy55LCByb3cueDIgKyAxLCByb3cueSwgdHlwZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXJlYUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdDZWxsRWRnZShyb3cueDEsIHJvdy55LCByb3cueDEsIHJvdy55ICsgMSwgdHlwZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kcmF3Q2VsbEVkZ2Uocm93LngyICsgMSwgcm93LnksIHJvdy54MiArIDEsIHJvdy55ICsgMSwgdHlwZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2ID0gcm93O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZihwcmV2ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXJlYUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdDZWxsRWRnZShwcmV2LngxLCBwcmV2LnkgKyAxLCBwcmV2LngyICsgMSwgcHJldi55ICsgMSwgdHlwZSkpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGRyYXdDZWxsRWRnZSh4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4MjogbnVtYmVyLCB5MjogbnVtYmVyLCB0eXBlOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZHJhd0VkZ2UoVmVjMi5mcm9tQ2VsbCh4MSwgeTEpLCBWZWMyLmZyb21DZWxsKHgyLCB5MiksIHR5cGUsIFwibWFwLWFyZWFcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHJlbmRlclBhdGgocGF0aE5vZGU6IElQYXRoTm9kZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wYXRoQ29udGFpbmVyICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhdGhDb250YWluZXIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLnBhdGhDb250YWluZXIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHBhdGhOb2RlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGF0aENvbnRhaW5lciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMucGF0aENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnBhdGhDb250YWluZXIpO1xyXG4gICAgICAgICAgICB3aGlsZSAocGF0aE5vZGUgJiYgcGF0aE5vZGUucHJldikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXRoQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZHJhd0VkZ2UocGF0aE5vZGUubm9kZS5wb3MsIHBhdGhOb2RlLnByZXYubm9kZS5wb3MsIFwicGF0aFwiLCBcIm1hcC1cIiArIHBhdGhOb2RlLnByZXZFZGdlLnR5cGUpKTtcclxuICAgICAgICAgICAgICAgIHBhdGhOb2RlID0gcGF0aE5vZGUucHJldjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSByZW5kZXJNYXJrKCkge1xyXG4gICAgICAgICAgICB0aGlzLm1hcmtFbGVtID0gdGhpcy5hZGRPclVwZGF0ZU5vZGVFbGVtKHRoaXMuYXBwLmNvbnRleHQubWFya05vZGUsIHRoaXMubWFya0VsZW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIHJlbmRlclNvdXJjZSgpIHtcclxuICAgICAgICAgICAgdGhpcy5zb3VyY2VFbGVtID0gdGhpcy5hZGRPclVwZGF0ZU5vZGVFbGVtKHRoaXMuYXBwLmNvbnRleHQuc291cmNlTm9kZSwgdGhpcy5zb3VyY2VFbGVtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSByZW5kZXJEZXN0aW5hdGlvbigpIHtcclxuICAgICAgICAgICAgdGhpcy5kZXN0RWxlbSA9IHRoaXMuYWRkT3JVcGRhdGVOb2RlRWxlbSh0aGlzLmFwcC5jb250ZXh0LmRlc3ROb2RlLCB0aGlzLmRlc3RFbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgYWRkT3JVcGRhdGVOb2RlRWxlbShub2RlOiBJTm9kZSwgZWxlbTogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtKVxyXG4gICAgICAgICAgICAgICAgZWxlbS5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKGVsZW0pO1xyXG4gICAgICAgICAgICByZXR1cm4gbm9kZSAhPSBudWxsXHJcbiAgICAgICAgICAgICAgICA/IDxIVE1MRWxlbWVudD50aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5kcmF3Tm9kZShub2RlKSlcclxuICAgICAgICAgICAgICAgIDogbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgcmVuZGVyR3JpZCgpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmdyaWRDb250YWluZXIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ3JpZENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5ncmlkQ29udGFpbmVyKTtcclxuICAgICAgICAgICAgICAgIHZhciBpOiBudW1iZXIsIGVsOiBIVE1MRGl2RWxlbWVudDtcclxuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCAzNzsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoXCJtYXAtZ3JpZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKFwibWFwLWdyaWQtdlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZS5sZWZ0ID0gKGkgKiBDZWxsLndpZHRoICsgQ2VsbC53aWR0aE9mZnNldCkgKyBcInB4XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkQ29udGFpbmVyLmFwcGVuZENoaWxkKGVsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCA0MjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoXCJtYXAtZ3JpZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKFwibWFwLWdyaWQtaFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZS50b3AgPSAoaSAqIENlbGwuaGVpZ2h0ICsgQ2VsbC5oZWlnaHRPZmZzZXQpICsgXCJweFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JpZENvbnRhaW5lci5hcHBlbmRDaGlsZChlbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gc2hvdyBncmlkIGNvb3JkaW5hdGVzXHJcbiAgICAgICAgICAgICAgICAvKmZvciAoaSA9IDA7IGkgPCAzNzsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCA0MjsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbC50ZXh0Q29udGVudCA9IGkgKyAnLCcgKyBqO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc3R5bGUuY29sb3IgPSBcInJnYmEoMjU1LDI1NSwyNTUsMC43NSlcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc3R5bGUubGVmdCA9IChpICogNDQuNSArIDIyKSArIFwicHhcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc3R5bGUudG9wID0gKGogKiA0NC42ICsgMzcpICsgXCJweFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZS56SW5kZXggPSBcIjEwXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnN0eWxlLmZvbnQgPSBcIjdwdCBzYW5zLXNlcmlmXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JpZENvbnRhaW5lci5hcHBlbmRDaGlsZChlbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSovXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgdXBkYXRlRmVhdHVyZXMoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSBcIlwiO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5mZWF0dXJlcy5mb3JFYWNoKGYgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGYuaGlkZGVuKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaGlkZS1cIiArIGYudHlwZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBkcmF3Tm9kZShub2RlOiBJTm9kZSk6IEhUTUxFbGVtZW50ICB7XHJcbiAgICAgICAgICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwibWFwLW5vZGVcIik7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcIm1hcC1cIiArIG5vZGUudHlwZSk7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9IG5vZGUucG9zLnggKyBcInB4XCI7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUudG9wID0gbm9kZS5wb3MueSArIFwicHhcIjtcclxuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJkYXRhLW5vZGUtaWRcIiwgKG5vZGUucmVmZXJlbmNlSWQgfHwgbm9kZS5pZCkgKyBcIlwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGRyYXdFZGdlKG4xOiBJVmVjMiwgbjI6IElWZWMyLCB0eXBlOiBzdHJpbmcsIHN1YnR5cGU/OiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XHJcbiAgICAgICAgICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwibWFwLWVkZ2VcIik7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcIm1hcC1cIiArIHR5cGUpO1xyXG4gICAgICAgICAgICBpZiAoc3VidHlwZSlcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChzdWJ0eXBlKTtcclxuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IFZlYzIuZGlzdGFuY2UobjEsIG4yKTtcclxuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0gKChuMS54ICsgbjIueCkgLyAyKSAtIChsZW5ndGggLyAyKSArIFwicHhcIjtcclxuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS50b3AgPSAoKG4xLnkgKyBuMi55KSAvIDIpIC0gMSArIFwicHhcIjtcclxuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS53aWR0aCA9IGxlbmd0aCArIFwicHhcIjtcclxuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSBgcm90YXRlKCR7TWF0aC5hdGFuMihuMS55IC0gbjIueSwgbjEueCAtIG4yLngpfXJhZClgO1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiX3JlZnMudHNcIi8+XHJcbm1vZHVsZSBUZXNwIHtcclxuICAgIGV4cG9ydCBjbGFzcyBNZW51SXRlbSB7XHJcbiAgICAgICAgc3RhdGljIHNlcGFyYXRvciA9IG5ldyBNZW51SXRlbShcIlwiKTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIGxhYmVsOiBzdHJpbmcsIHB1YmxpYyBmdW5jPzogKCkgPT4gdm9pZCkgeyB9XHJcbiAgICB9XHJcbiAgICBleHBvcnQgY2xhc3MgTWVudSB7XHJcbiAgICAgICAgZWxlbWVudDogSFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgICAgIHByaXZhdGUgbGlzdGVuZXI6IENoYW5nZUxpc3RlbmVyO1xyXG4gICAgICAgIHByaXZhdGUgZGlzcG9zZWQgPSBmYWxzZTtcclxuICAgICAgICBwcml2YXRlIGxpbmtzOiBIVE1MRWxlbWVudFtdO1xyXG5cclxuICAgICAgICAvKiogQ3JlYXRlIGEgbmV3IG1lbnUgaW5zdGFuY2UuIFJlbWVtYmVyIHRvIGNhbGwgZGlzcG9zZSgpIG9uY2UgeW91J3JlIGRvbmUgKi9cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwbGljYXRpb24sIGZpeGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIgPSB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uQ2xlYXJNZW51cywgKCkgPT4gdGhpcy5oaWRlKCkpO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSBcIm1lbnVcIjtcclxuICAgICAgICAgICAgaWYgKGZpeGVkKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJmaXhlZFwiKTtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lm9ubW91c2Vkb3duID0gZXYgPT4gZXYuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5lbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLyoqIENsZWFuIHVwIHRoaXMgbWVudSBhZnRlciBpdHMgdXNlICovXHJcbiAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGlzcG9zZWQpIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy5hcHAucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5saXN0ZW5lcik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEdldCB0aGUgbWVudSBlbGVtZW50J3MgY3NzIHN0eWxlIG9iamVjdCAqL1xyXG4gICAgICAgIGdldFN0eWxlKCk6IENTU1N0eWxlRGVjbGFyYXRpb24ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kaXNwb3NlZCA/IG51bGwgOiB0aGlzLmVsZW1lbnQuc3R5bGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogQ29uc3RydWN0IHRoZSBNZW51J3MgY29udGVudHMgZnJvbSBNZW51SXRlbXMgKi9cclxuICAgICAgICBzZXREYXRhKGl0ZW1zOiBNZW51SXRlbVtdKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmRpc3Bvc2VkKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB0aGlzLmhpZGUoKTtcclxuICAgICAgICAgICAgdmFyIGNoaWxkOiBFbGVtZW50O1xyXG4gICAgICAgICAgICB3aGlsZSAoKGNoaWxkID0gdGhpcy5lbGVtZW50LmZpcnN0RWxlbWVudENoaWxkKSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQ2hpbGQoY2hpbGQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbGlua3M6IEhUTUxFbGVtZW50W10gPSB0aGlzLmxpbmtzID0gW107XHJcbiAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQobGkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gPT09IE1lbnVJdGVtLnNlcGFyYXRvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpLmNsYXNzTmFtZSA9IFwic2VwYXJhdG9yXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpLnRleHRDb250ZW50ID0gaXRlbS5sYWJlbDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5mdW5jICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGkuY2xhc3NOYW1lID0gXCJsaW5rXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpZHggPSBsaS50YWJJbmRleCA9IGxpbmtzLnB1c2gobGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaS5vbm1vdXNlZG93biA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5mdW5jKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGkub25rZXlkb3duID0gZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChldi53aGljaCA9PT0gMzggfHwgZXYud2hpY2ggPT09IDQwKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmtzW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaWR4ICsgKGV2LndoaWNoID09PSA0MCA/IDAgOiAtMikgKyBsaW5rcy5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICUgbGlua3MubGVuZ3RoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXS5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChldi53aGljaCA9PT0gMTMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmZ1bmMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpLm9ubW91c2VlbnRlciA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgbGkub25tb3VzZW91dCA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaSA9PT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpLmJsdXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogU2hvdyB0aGUgbWVudSAqL1xyXG4gICAgICAgIG9wZW4oKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmRpc3Bvc2VkKSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLkNsZWFyTWVudXMpO1xyXG4gICAgICAgICAgICBpZih0aGlzLmVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJpbmhlcml0XCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qKiBIaWRlIHRoZSBtZW51ICovXHJcbiAgICAgICAgaGlkZSgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGlzcG9zZWQpIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLyoqIElzIHRoZSBtZW51IHZpc2libGU/ICovXHJcbiAgICAgICAgaXNPcGVuKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICByZXR1cm4gIXRoaXMuZGlzcG9zZWQgJiYgdGhpcy5lbGVtZW50LnN0eWxlLmRpc3BsYXkgIT09IFwibm9uZVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTZXQgYSBtZW51IGxpbmsgYXMgdGhlIGZvY3VzZWQgZWxlbWVudC5cclxuICAgICAgICAgKiBQYXJhbWV0ZXIgc3BlY2lmaWVzIGluZGV4IG9mIGxpbmsgdG8gZm9jdXMgKGRlZmF1bHQgaXMgMCwgbmVnYXRpdmUgdmFsdWVzIGNvdW50IGZyb20gZW5kKVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZvY3VzKGluZGV4OiBudW1iZXIgPSAwKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmRpc3Bvc2VkKSByZXR1cm47XHJcbiAgICAgICAgICAgIHZhciBlbGVtID0gPEhUTUxFbGVtZW50PnRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKFwiLmxpbmtcIik7XHJcbiAgICAgICAgICAgIGlmIChlbGVtICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIC8vIGZvY3VzIHNvbWV0aW1lcyBkb2VzIHdlaXJkIHRoaW5ncyB3aXRoIHNjcm9sbGluZywgbWFrZSBzdXJlIHdlIHN0YXkgd2hlcmUgd2UgYXJlXHJcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHBhZ2VYT2Zmc2V0LCB5ID0gcGFnZVlPZmZzZXQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsZW4gPSB0aGlzLmxpbmtzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWR4ID0gKChpbmRleCAlIGxlbikgKyBsZW4pICUgbGVuO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGlua3NbaWR4XS5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc2Nyb2xsKHgsIHkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIl9yZWZzLnRzXCIvPlxyXG5tb2R1bGUgVGVzcCB7XHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElQYXRoRWRnZSB7XHJcbiAgICAgICAgdGFyZ2V0OiBJUGF0aE5vZGU7XHJcbiAgICAgICAgY29zdDogbnVtYmVyO1xyXG4gICAgICAgIHR5cGU6IHN0cmluZztcclxuICAgIH1cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSVBhdGhOb2RlIHtcclxuICAgICAgICBub2RlOiBJTm9kZTtcclxuICAgICAgICBkaXN0OiBudW1iZXI7XHJcbiAgICAgICAgcHJldjogSVBhdGhOb2RlO1xyXG4gICAgICAgIHByZXZFZGdlOiBJUGF0aEVkZ2U7XHJcbiAgICAgICAgZWRnZXM6IElQYXRoRWRnZVtdO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSVBhdGhXb3JrZXJEYXRhIHtcclxuICAgICAgICBub2RlczogSU5vZGVbXTtcclxuICAgICAgICBhcmVhczogSUFyZWFbXTtcclxuICAgICAgICBzb3VyY2U6IElOb2RlO1xyXG4gICAgICAgIGRlc3RpbmF0aW9uOiBJTm9kZTtcclxuICAgICAgICBtYXJrOiBJTm9kZTtcclxuICAgICAgICBmZWF0dXJlczogSUZlYXR1cmVMaXN0O1xyXG4gICAgfVxyXG4gICAgLyoqIENhbGN1bGF0ZXMgdGhlIGJlc3QgcGF0aCBpbiB0aGUgY3VycmVudCBjb250ZXh0ICovXHJcbiAgICBleHBvcnQgY2xhc3MgUGF0aCB7XHJcbiAgICAgICAgcHJpdmF0ZSB3b3JrZXI6IFdvcmtlcjtcclxuICAgICAgICBwcml2YXRlIHdvcmtpbmc6IFByb21pc2U8SVBhdGhOb2RlPjtcclxuICAgICAgICBwcml2YXRlIHF1ZXVlOiBQcm9taXNlPElQYXRoTm9kZT47XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXBwOiBBcHBsaWNhdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uQ29udGV4dENoYW5nZSB8IENoYW5nZVJlYXNvbi5NYXJrQ2hhbmdlIHwgQ2hhbmdlUmVhc29uLkZlYXR1cmVDaGFuZ2UsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmluZFBhdGgoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGZpbmRQYXRoKCk6IFByb21pc2U8SVBhdGhOb2RlPiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnF1ZXVlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy53b3JraW5nKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZSA9IDxQcm9taXNlPElQYXRoTm9kZT4+PGFueT50aGlzLndvcmtpbmcudGhlbigoKSA9PiB0aGlzLmZpbmRQYXRoKCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMuYXBwLmNvbnRleHQ7XHJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBjb250ZXh0LnNvdXJjZU5vZGU7XHJcbiAgICAgICAgICAgIHZhciBkZXN0aW5hdGlvbiA9IGNvbnRleHQuZGVzdE5vZGU7XHJcbiAgICAgICAgICAgIGlmIChzb3VyY2UgPT0gbnVsbCB8fCBkZXN0aW5hdGlvbiA9PSBudWxsIHx8IHNvdXJjZSA9PT0gZGVzdGluYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLlBhdGhVcGRhdGUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkludmFsaWQgc291cmNlIGFuZCBkZXN0aW5hdGlvbiBjb25maWd1cmF0aW9uXCIpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHdvcmxkID0gdGhpcy5hcHAud29ybGQ7XHJcbiAgICAgICAgICAgIHZhciBkYXRhOiBJUGF0aFdvcmtlckRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBub2Rlczogd29ybGQubm9kZXMsXHJcbiAgICAgICAgICAgICAgICBhcmVhczogd29ybGQuYXJlYXMsXHJcbiAgICAgICAgICAgICAgICBzb3VyY2U6IHNvdXJjZSxcclxuICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uOiBkZXN0aW5hdGlvbixcclxuICAgICAgICAgICAgICAgIG1hcms6IGNvbnRleHQubWFya05vZGUsXHJcbiAgICAgICAgICAgICAgICBmZWF0dXJlczogdGhpcy5hcHAuZmVhdHVyZXNcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLndvcmtpbmcgPSBuZXcgUHJvbWlzZTxJUGF0aE5vZGU+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLndvcmtlciA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53b3JrZXIgPSBuZXcgV29ya2VyKFwianMvcGF0aC53b3JrZXIuanNcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy53b3JrZXIub25tZXNzYWdlID0gZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucXVldWUgPSB0aGlzLndvcmtpbmcgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLlBhdGhVcGRhdGUsIGV2LmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZXYuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy53b3JrZXIub25lcnJvciA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXVlID0gdGhpcy53b3JraW5nID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcC50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5QYXRoVXBkYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXYpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKGRhdGEpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiX3JlZnMudHNcIi8+XHJcbm1vZHVsZSBUZXNwIHtcclxuICAgIGV4cG9ydCB0eXBlIFRyYW5zcG9ydFNvdXJjZSA9IHsgW2tleTogc3RyaW5nXTogSU5vZGVTb3VyY2VbXSB9O1xyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJV29ybGRTb3VyY2Uge1xyXG4gICAgICAgIHRyYW5zcG9ydDogVHJhbnNwb3J0U291cmNlO1xyXG4gICAgICAgIHJlZ2lvbnM6IElOb2RlU291cmNlW107XHJcbiAgICAgICAgbGFuZG1hcmtzOiBJTm9kZVNvdXJjZVtdO1xyXG4gICAgfVxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJTm9kZVNvdXJjZSB7XHJcbiAgICAgICAgbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIHg6IG51bWJlcjtcclxuICAgICAgICB5OiBudW1iZXI7XHJcbiAgICAgICAgZWRnZXM6IG51bWJlcltdO1xyXG4gICAgICAgIG9uZVdheUVkZ2VzOiBudW1iZXJbXTtcclxuICAgICAgICB0b3A6IG51bWJlcjtcclxuICAgICAgICBjZWxsczogbnVtYmVyW11bXTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogU3RhdGljIGFzc2V0cyBhbmQgbG9jYXRpb25zICovXHJcbiAgICBleHBvcnQgY2xhc3MgV29ybGQge1xyXG4gICAgICAgIG5vZGVzOiBOb2RlW107XHJcbiAgICAgICAgZWRnZXM6IEVkZ2VbXTtcclxuICAgICAgICBhcmVhczogQXJlYVtdO1xyXG4gICAgICAgIHJlZ2lvbnM6IEFyZWFbXTtcclxuICAgICAgICBsYW5kbWFya3M6IEFyZWFbXTtcclxuXHJcbiAgICAgICAgcHJpdmF0ZSBub2Rlc0J5SWQ6IHsgW2tleTogbnVtYmVyXTogSU5vZGUgfSA9IHt9O1xyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIHRyYW5zcG9ydENvc3Q6IG51bWJlciA9IDEwO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwbGljYXRpb24sIGRhdGE6IElXb3JsZFNvdXJjZSkge1xyXG4gICAgICAgICAgICB0aGlzLm5vZGVzID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuZWRnZXMgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5hcmVhcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoZGF0YS50cmFuc3BvcnQpLmZvckVhY2goayA9PiB0aGlzLmxvYWRUcmFuc3BvcnQoZGF0YS50cmFuc3BvcnQsIGspKTtcclxuICAgICAgICAgICAgdGhpcy5yZWdpb25zID0gZGF0YS5yZWdpb25zLm1hcChhID0+IFdvcmxkLm1ha2VBcmVhKG5ldyBOb2RlKGEubmFtZSwgYS5uYW1lLCBuZXcgVmVjMigwLCAwKSwgXCJyZWdpb25cIiksIGEpKTtcclxuICAgICAgICAgICAgdGhpcy5sYW5kbWFya3MgPSBkYXRhLmxhbmRtYXJrcy5tYXAoYSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IG5ldyBOb2RlKGEubmFtZSwgYS5uYW1lLCBuZXcgVmVjMigwLCAwKSwgXCJsYW5kbWFya1wiKTtcclxuICAgICAgICAgICAgICAgIHZhciBhcmVhID0gV29ybGQubWFrZUFyZWEobm9kZSwgYSk7XHJcbiAgICAgICAgICAgICAgICAvLyBzZXQgbm9kZSBsb2NhdGlvbiB0byBhdmVyYWdlIGNlbnRlciBwb2ludCBvZiBhbGwgY2VsbHNcclxuICAgICAgICAgICAgICAgIHZhciBzdW1YOiBudW1iZXIgPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN1bVk6IG51bWJlciA9IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgY291bnQ6IG51bWJlciA9IDA7XHJcbiAgICAgICAgICAgICAgICBhcmVhLnJvd3MuZm9yRWFjaChyID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzdW1YICs9IChyLngxICsgci53aWR0aCAvIDIpICogci53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBzdW1ZICs9IChyLnkgKyAwLjUpICogci53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBjb3VudCArPSByLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBub2RlLnBvcyA9IFZlYzIuZnJvbUNlbGwoc3VtWCAvIGNvdW50LCBzdW1ZIC8gY291bnQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyZWE7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gaW5kZXggYnkgaWRcclxuICAgICAgICAgICAgdGhpcy5ub2Rlc0J5SWQgPSB7fTtcclxuICAgICAgICAgICAgdGhpcy5ub2Rlcy5mb3JFYWNoKG4gPT4gdGhpcy5ub2Rlc0J5SWRbbi5pZF0gPSBuKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxvYWRUcmFuc3BvcnQoZGF0YTogVHJhbnNwb3J0U291cmNlLCB0eXBlOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIGFycmF5OiBJTm9kZVNvdXJjZVtdID0gZGF0YVt0eXBlXTtcclxuICAgICAgICAgICAgdmFyIGZlYXQgPSB0aGlzLmFwcC5mZWF0dXJlcy5ieU5hbWVbdHlwZV07XHJcbiAgICAgICAgICAgIHZhciB0eXBlTmFtZSA9IGZlYXQubG9jYXRpb24gfHwgZmVhdC5uYW1lO1xyXG4gICAgICAgICAgICB2YXIgbm9kZXM6IE5vZGVbXSA9IGFycmF5Lm1hcChuID0+IG5ldyBOb2RlKG4ubmFtZSwgYCR7dHlwZU5hbWV9LCAke24ubmFtZX1gLCBuZXcgVmVjMihuLngsIG4ueSksIHR5cGUsIHRydWUpKTtcclxuICAgICAgICAgICAgdGhpcy5ub2RlcyA9IHRoaXMubm9kZXMuY29uY2F0KG5vZGVzKTtcclxuICAgICAgICAgICAgdmFyIGNvc3QgPSBXb3JsZC50cmFuc3BvcnRDb3N0O1xyXG4gICAgICAgICAgICBhcnJheS5mb3JFYWNoKChuLCBpMSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIG4xID0gbm9kZXNbaTFdO1xyXG4gICAgICAgICAgICAgICAgaWYgKG4uZWRnZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBuLmVkZ2VzLmZvckVhY2goaTIgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbjIgPSBub2Rlc1tpMl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlZGdlID0gbmV3IEVkZ2UobjEsIG4yLCBjb3N0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbjEuZWRnZXMucHVzaChlZGdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbjIuZWRnZXMucHVzaChlZGdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGdlcy5wdXNoKGVkZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKG4ub25lV2F5RWRnZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBuLm9uZVdheUVkZ2VzLmZvckVhY2goaTIgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWRnZSA9IG5ldyBFZGdlKG4xLCBub2Rlc1tpMl0sIGNvc3QpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuMS5lZGdlcy5wdXNoKGVkZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVkZ2VzLnB1c2goZWRnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobi5jZWxscykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXJlYXMucHVzaChXb3JsZC5tYWtlQXJlYShuMSwgbikpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIG1ha2VBcmVhKG5vZGU6IE5vZGUsIGRhdGE6IElOb2RlU291cmNlKSB7XHJcbiAgICAgICAgICAgIHZhciB5ID0gZGF0YS50b3AgfHwgMDtcclxuICAgICAgICAgICAgdmFyIHJvd3MgPSBkYXRhLmNlbGxzLm1hcChjID0+IG5ldyBDZWxsUm93KHkrKywgY1swXSwgY1sxXSkpO1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEFyZWEobm9kZSwgcm93cyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaW5kTm9kZUJ5SWQoaWQ6IG51bWJlcik6IE5vZGUge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ub2Rlc0J5SWRbaWRdIHx8IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXRSZWdpb25OYW1lKHBvczogSVZlYzIpOiBzdHJpbmcge1xyXG4gICAgICAgICAgICB2YXIgYXJlYSA9IFdvcmxkLmdldEFyZWFCeUNlbGwodGhpcy5yZWdpb25zLCBDZWxsLmZyb21Qb3NpdGlvbihwb3MpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZWEgIT0gbnVsbCA/IGFyZWEudGFyZ2V0Lm5hbWUgOiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBnZXRMYW5kbWFya05hbWUocG9zOiBJVmVjMik6IHN0cmluZyB7XHJcbiAgICAgICAgICAgIHZhciBhcmVhID0gV29ybGQuZ2V0QXJlYUJ5Q2VsbCh0aGlzLmxhbmRtYXJrcywgQ2VsbC5mcm9tUG9zaXRpb24ocG9zKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBhcmVhICE9IG51bGwgPyBhcmVhLnRhcmdldC5uYW1lIDogbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgZ2V0QXJlYUJ5Q2VsbChzb3VyY2U6IEFyZWFbXSwgY2VsbDogSVZlYzIpOiBBcmVhIHtcclxuICAgICAgICAgICAgdmFyIGFyZWE6IEFyZWE7XHJcbiAgICAgICAgICAgIGlmIChzb3VyY2Uuc29tZShyID0+IEFyZWEuY29udGFpbnNDZWxsKHIsIGNlbGwpICYmIChhcmVhID0gcikgIT0gbnVsbCkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJlYTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImQvZXM2LXByb21pc2UvZXM2LXByb21pc2UuZC50c1wiLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImQvd2hhdHdnLWZldGNoL3doYXR3Zy1mZXRjaC5kLnRzXCIvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiYXBwLnRzXCIvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiY29tbW9uLnRzXCIvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiY29udGV4dC50c1wiLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImNvbnRleHRtZW51LnRzXCIvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiY29udHJvbHMudHNcIi8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJmZWF0dXJlcy50c1wiLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm1hcC50c1wiLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm1lbnUudHNcIi8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJwYXRoLnRzXCIvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwid29ybGQudHNcIi8+Il0sInNvdXJjZVJvb3QiOiIuLi90cyJ9