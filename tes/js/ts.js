/// <reference path="d/es6-promise/es6-promise.d.ts"/>
/// <reference path="d/whatwg-fetch/whatwg-fetch.d.ts"/>
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
        ChangeListener.prototype.trigger = function (reason) {
            if ((this.reasons & reason) !== 0)
                this.func(reason);
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
                _this.world = new Tesp.World(_this, data);
                _this.map = new Tesp.Map(_this, document.getElementById("map"));
                _this.controls = new Tesp.Controls(_this, document.getElementById("controls"));
                _this.ctxMenu = new Tesp.ContextMenu(_this);
                document.body.onmousedown = document.body.oncontextmenu = function () { return _this.triggerChange(ChangeReason.ClearMenus); };
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
        Application.prototype.triggerChange = function (reason) {
            this.listeners.forEach(function (l) { return l.trigger(reason); });
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
    Tesp.app = new Application();
})(Tesp || (Tesp = {}));
var Tesp;
(function (Tesp) {
    var Vec2 = (function () {
        function Vec2(x, y) {
            this.x = x;
            this.y = y;
        }
        Vec2.prototype.distance = function (other) {
            return Math.sqrt(((other.x - this.x) * (other.x - this.x)) + ((other.y - this.y) * (other.y - this.y)));
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
        Cell.widthOffset = 20;
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
            if (pos.y >= this.minY && pos.y < this.maxY + 1) {
                var row = this.rows[Math.floor(pos.y) - this.minY];
                return pos.x >= row.x1 && pos.x < row.x2 + 1;
            }
            return false;
        };
        return Area;
    })();
    Tesp.Area = Area;
})(Tesp || (Tesp = {}));
var Tesp;
(function (Tesp) {
    var Context = (function () {
        function Context(app) {
            var _this = this;
            this.app = app;
            this.app.addChangeListener(Tesp.ChangeReason.ContextChange | Tesp.ChangeReason.MarkChange, function (reason) {
                _this.findPath();
                if (reason === Tesp.ChangeReason.MarkChange) {
                    _this.app.toggleBodyClass("has-mark", _this.markNode != null);
                }
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
        Context.prototype.findPath = function () {
            this.pathEnd = this.sourceNode != null && this.destNode != null && this.sourceNode !== this.destNode
                ? Tesp.Path.findPath(this.app)
                : null;
            this.app.triggerChange(Tesp.ChangeReason.PathUpdate);
        };
        return Context;
    })();
    Tesp.Context = Context;
})(Tesp || (Tesp = {}));
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
            this.app.addChangeListener(Tesp.ChangeReason.PathUpdate, function () { return _this.updatePath(); });
            this.pathContainer = element.querySelector(".path-container");
            this.featuresContainer = element.querySelector(".features-container");
            this.searchInput = element.querySelector(".search-input");
            var featuresVisible = false;
            element.querySelector(".settings-icon").onclick = function () {
                return _this.featuresContainer.style.display = (featuresVisible = !featuresVisible) ? "block" : "none";
            };
            this.initSearch();
        }
        Controls.prototype.initSearch = function () {
            var _this = this;
            var searchContainer = this.element.querySelector(".search-container");
            this.searchMenu = new Tesp.Menu(Tesp.app, true);
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
            this.searchInput.oninput = function () {
                var search = _this.searchInput.value.toLowerCase();
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
            this.app.addChangeListener(Tesp.ChangeReason.ClearMenus, function () {
                if (document.activeElement !== _this.searchInput)
                    _this.clearSearch();
            });
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
        Controls.prototype.updatePath = function () {
            var child;
            while ((child = this.pathContainer.firstElementChild)) {
                this.pathContainer.removeChild(child);
            }
            var pathNode = this.app.context.pathEnd;
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
                el.textContent = f.name + ":";
                el.appendChild(_this.drawCheckbox(function (val) {
                    f.hidden = !val;
                    _this.app.triggerChange(Tesp.ChangeReason.FeatureChange);
                }, !f.hidden));
                if (!f.visualOnly)
                    el.appendChild(_this.drawCheckbox(function (val) {
                        f.disabled = !val;
                        _this.app.triggerChange(Tesp.ChangeReason.FeatureChange);
                    }, !f.disabled));
                _this.featuresContainer.appendChild(el);
            });
        };
        Controls.prototype.drawCheckbox = function (onchange, initial) {
            var input = document.createElement("input");
            input.type = "checkbox";
            input.onchange = function () { return onchange(input.checked); };
            input.checked = initial;
            return input;
        };
        return Controls;
    })();
    Tesp.Controls = Controls;
})(Tesp || (Tesp = {}));
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
            this.app.addChangeListener(Tesp.ChangeReason.PathUpdate, function () { return _this.renderPath(); });
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
            this.renderPath();
            this.renderMark();
            this.renderGrid();
            this.updateFeatures();
            this.initDragScroll();
        }
        Map.prototype.getEventNode = function (event) {
            var target = event.target;
            if (target.classList.contains("map-node")) {
                var id = target.dataset["nodeId"];
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
                if (!mousedown && ev.which === 1) {
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
        Map.prototype.renderPath = function () {
            if (this.pathContainer != null)
                this.pathContainer.parentElement.removeChild(this.pathContainer);
            var pathNode = this.app.context.pathEnd;
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
            element.dataset["nodeId"] = (node.referenceId || node.id) + "";
            return element;
        };
        Map.prototype.drawEdge = function (n1, n2, type, subtype) {
            var element = document.createElement("div");
            element.classList.add("map-edge");
            element.classList.add("map-" + type);
            if (subtype)
                element.classList.add(subtype);
            var length = n1.distance(n2);
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
                        li.onmousedown = function (ev) {
                            ev.stopPropagation();
                            item.func();
                            _this.hide();
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
        return Menu;
    })();
    Tesp.Menu = Menu;
})(Tesp || (Tesp = {}));
var Tesp;
(function (Tesp) {
    var PathEdge = (function () {
        function PathEdge(target, cost, type) {
            this.target = target;
            this.cost = cost;
            this.type = type;
        }
        return PathEdge;
    })();
    Tesp.PathEdge = PathEdge;
    var PathNode = (function () {
        function PathNode(node) {
            this.node = node;
            this.dist = Infinity;
        }
        return PathNode;
    })();
    Tesp.PathNode = PathNode;
    var Path = (function () {
        function Path() {
        }
        Path.findPath = function (app) {
            var world = app.world;
            var context = app.context;
            var nodeMap = {};
            var feats = app.features.byName;
            var nodes = world.nodes
                .filter(function (n) { return !feats[n.type].disabled && n !== context.sourceNode && n !== context.destNode; })
                .map(function (n) { return nodeMap[n.id] = new PathNode(n); });
            var source = new PathNode(context.sourceNode);
            source.dist = 0;
            nodes.push(source);
            nodeMap[context.sourceNode.id] = source;
            var dest = new PathNode(context.destNode);
            nodes.push(dest);
            nodeMap[context.destNode.id] = dest;
            var maxCost = context.sourceNode.pos.distance(context.destNode.pos);
            nodes.forEach(function (n) {
                return n.edges = n.node.edges
                    .filter(function (e) { return !feats[e.srcNode.type].disabled; })
                    .map(function (e) { return new PathEdge(nodeMap[(e.srcNode === n.node ? e.destNode : e.srcNode).id], e.cost, n.node.type); });
            });
            nodes.forEach(function (n) {
                return n.edges = n.edges.concat(nodes
                    .filter(function (n2) { return n2 !== n && !n.edges.some(function (e) { return e.target === n2; }); })
                    .map(function (n2) { return new PathEdge(n2, n.node.pos.distance(n2.node.pos), "walk"); })
                    .filter(function (e) { return e.cost <= maxCost; }));
            });
            if (context.markNode != null && !feats["mark"].disabled) {
                var mn = new PathNode(context.markNode);
                mn.edges = nodes.filter(function (n) { return n !== source; })
                    .map(function (n) { return new PathEdge(n, mn.node.pos.distance(n.node.pos), "walk"); })
                    .filter(function (e) { return e.cost < maxCost; });
                source.edges.push(new PathEdge(mn, Path.spellCost, "mark"));
                nodes.push(mn);
            }
            nodes.forEach(function (n) {
                var cell = Tesp.Cell.fromPosition(n.node.pos);
                world.areas.forEach(function (a) {
                    if (!feats[a.target.type].disabled) {
                        if (a.containsCell(cell)) {
                            n.edges.push(new PathEdge(nodeMap[a.target.id], Path.spellCost, a.target.type));
                        }
                        else {
                            var dist = Infinity;
                            var closest;
                            a.rows.forEach(function (r) {
                                var v = new Tesp.Vec2(Math.max(Math.min(cell.x, r.x1 + r.width), r.x1), Math.max(Math.min(cell.y, r.y + 1), r.y));
                                var alt = cell.distance(v);
                                if (alt < dist) {
                                    dist = alt;
                                    closest = v;
                                }
                            });
                            var pos = Tesp.Vec2.fromCell(closest.x, closest.y);
                            var cost = n.node.pos.distance(pos);
                            if (cost < maxCost) {
                                var feat = app.features.byName[a.target.type];
                                var name = feat.name + " range of " + a.target.name;
                                var an = new PathNode(new Tesp.Node(name, name, pos, "area"));
                                an.edges = [new PathEdge(nodeMap[a.target.id], Path.spellCost, a.target.type)];
                                nodes.push(an);
                                n.edges.push(new PathEdge(an, cost, "walk"));
                            }
                        }
                    }
                });
            });
            var q = nodes.slice();
            while (q.length > 0) {
                q.sort(function (a, b) { return b.dist - a.dist; });
                var u = q.pop();
                for (var i = 0; i < u.edges.length; i++) {
                    var e = u.edges[i];
                    var v = e.target;
                    var alt = u.dist + e.cost;
                    if (alt < v.dist) {
                        v.dist = alt;
                        v.prev = u;
                        v.prevEdge = e;
                    }
                }
            }
            return dest;
        };
        Path.spellCost = 5;
        return Path;
    })();
    Tesp.Path = Path;
})(Tesp || (Tesp = {}));
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
            if (source.some(function (r) { return r.containsCell(cell) && (area = r) != null; }))
                return area;
            return null;
        };
        World.transportCost = 10;
        return World;
    })();
    Tesp.World = World;
})(Tesp || (Tesp = {}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC50cyIsImNvbW1vbi50cyIsImNvbnRleHQudHMiLCJjb250ZXh0bWVudS50cyIsImNvbnRyb2xzLnRzIiwiZmVhdHVyZXMudHMiLCJtYXAudHMiLCJtZW51LnRzIiwicGF0aC50cyIsIndvcmxkLnRzIl0sIm5hbWVzIjpbIlRlc3AiLCJUZXNwLkNoYW5nZVJlYXNvbiIsIlRlc3AuQ2hhbmdlTGlzdGVuZXIiLCJUZXNwLkNoYW5nZUxpc3RlbmVyLmNvbnN0cnVjdG9yIiwiVGVzcC5DaGFuZ2VMaXN0ZW5lci50cmlnZ2VyIiwiVGVzcC5BcHBsaWNhdGlvbiIsIlRlc3AuQXBwbGljYXRpb24uY29uc3RydWN0b3IiLCJUZXNwLkFwcGxpY2F0aW9uLmFkZENoYW5nZUxpc3RlbmVyIiwiVGVzcC5BcHBsaWNhdGlvbi5yZW1vdmVDaGFuZ2VMaXN0ZW5lciIsIlRlc3AuQXBwbGljYXRpb24udHJpZ2dlckNoYW5nZSIsIlRlc3AuQXBwbGljYXRpb24udG9nZ2xlQm9keUNsYXNzIiwiVGVzcC5WZWMyIiwiVGVzcC5WZWMyLmNvbnN0cnVjdG9yIiwiVGVzcC5WZWMyLmRpc3RhbmNlIiwiVGVzcC5WZWMyLmZyb21DZWxsIiwiVGVzcC5Ob2RlIiwiVGVzcC5Ob2RlLmNvbnN0cnVjdG9yIiwiVGVzcC5FZGdlIiwiVGVzcC5FZGdlLmNvbnN0cnVjdG9yIiwiVGVzcC5DZWxsIiwiVGVzcC5DZWxsLmNvbnN0cnVjdG9yIiwiVGVzcC5DZWxsLmZyb21Qb3NpdGlvbiIsIlRlc3AuQ2VsbFJvdyIsIlRlc3AuQ2VsbFJvdy5jb25zdHJ1Y3RvciIsIlRlc3AuQXJlYSIsIlRlc3AuQXJlYS5jb25zdHJ1Y3RvciIsIlRlc3AuQXJlYS5jb250YWluc0NlbGwiLCJUZXNwLkNvbnRleHQiLCJUZXNwLkNvbnRleHQuY29uc3RydWN0b3IiLCJUZXNwLkNvbnRleHQuc2V0Q29udGV4dExvY2F0aW9uIiwiVGVzcC5Db250ZXh0LnNldENvbnRleHROb2RlIiwiVGVzcC5Db250ZXh0LmNsZWFyQ29udGV4dCIsIlRlc3AuQ29udGV4dC5maW5kUGF0aCIsIlRlc3AuQ29udGV4dE1lbnUiLCJUZXNwLkNvbnRleHRNZW51LmNvbnN0cnVjdG9yIiwiVGVzcC5Db250ZXh0TWVudS5zZXRDb250ZXh0IiwiVGVzcC5Db250ZXh0TWVudS5vcGVuTm9kZSIsIlRlc3AuQ29udGV4dE1lbnUub3BlbiIsIlRlc3AuQ29udGV4dE1lbnUuaGlkZSIsIlRlc3AuQ29udHJvbHMiLCJUZXNwLkNvbnRyb2xzLmNvbnN0cnVjdG9yIiwiVGVzcC5Db250cm9scy5pbml0U2VhcmNoIiwiVGVzcC5Db250cm9scy5pbml0U2VhcmNoLnByZXBUZXJtIiwiVGVzcC5Db250cm9scy5jbGVhclNlYXJjaCIsIlRlc3AuQ29udHJvbHMudXBkYXRlTm9kZUluZm8iLCJUZXNwLkNvbnRyb2xzLnVwZGF0ZVBhdGgiLCJUZXNwLkNvbnRyb2xzLmRyYXdQYXRoTm9kZSIsIlRlc3AuQ29udHJvbHMuZHJhd0ZlYXR1cmVzIiwiVGVzcC5Db250cm9scy5kcmF3Q2hlY2tib3giLCJUZXNwLkZlYXR1cmUiLCJUZXNwLkZlYXR1cmUuY29uc3RydWN0b3IiLCJUZXNwLkZlYXR1cmVzIiwiVGVzcC5GZWF0dXJlcy5jb25zdHJ1Y3RvciIsIlRlc3AuRmVhdHVyZXMuaW5pdCIsIlRlc3AuTWFwIiwiVGVzcC5NYXAuY29uc3RydWN0b3IiLCJUZXNwLk1hcC5nZXRFdmVudE5vZGUiLCJUZXNwLk1hcC50cmlnZ2VyQ29udGV4dE1lbnUiLCJUZXNwLk1hcC5pbml0RHJhZ1Njcm9sbCIsIlRlc3AuTWFwLnJlbmRlck5vZGVzIiwiVGVzcC5NYXAuZHJhd0NlbGxFZGdlIiwiVGVzcC5NYXAucmVuZGVyUGF0aCIsIlRlc3AuTWFwLnJlbmRlck1hcmsiLCJUZXNwLk1hcC5yZW5kZXJTb3VyY2UiLCJUZXNwLk1hcC5yZW5kZXJEZXN0aW5hdGlvbiIsIlRlc3AuTWFwLmFkZE9yVXBkYXRlTm9kZUVsZW0iLCJUZXNwLk1hcC5yZW5kZXJHcmlkIiwiVGVzcC5NYXAudXBkYXRlRmVhdHVyZXMiLCJUZXNwLk1hcC5kcmF3Tm9kZSIsIlRlc3AuTWFwLmRyYXdFZGdlIiwiVGVzcC5NZW51SXRlbSIsIlRlc3AuTWVudUl0ZW0uY29uc3RydWN0b3IiLCJUZXNwLk1lbnUiLCJUZXNwLk1lbnUuY29uc3RydWN0b3IiLCJUZXNwLk1lbnUuZGlzcG9zZSIsIlRlc3AuTWVudS5nZXRTdHlsZSIsIlRlc3AuTWVudS5zZXREYXRhIiwiVGVzcC5NZW51Lm9wZW4iLCJUZXNwLk1lbnUuaGlkZSIsIlRlc3AuUGF0aEVkZ2UiLCJUZXNwLlBhdGhFZGdlLmNvbnN0cnVjdG9yIiwiVGVzcC5QYXRoTm9kZSIsIlRlc3AuUGF0aE5vZGUuY29uc3RydWN0b3IiLCJUZXNwLlBhdGgiLCJUZXNwLlBhdGguY29uc3RydWN0b3IiLCJUZXNwLlBhdGguZmluZFBhdGgiLCJUZXNwLldvcmxkIiwiVGVzcC5Xb3JsZC5jb25zdHJ1Y3RvciIsIlRlc3AuV29ybGQubG9hZFRyYW5zcG9ydCIsIlRlc3AuV29ybGQubWFrZUFyZWEiLCJUZXNwLldvcmxkLmZpbmROb2RlQnlJZCIsIlRlc3AuV29ybGQuZ2V0UmVnaW9uTmFtZSIsIlRlc3AuV29ybGQuZ2V0TGFuZG1hcmtOYW1lIiwiVGVzcC5Xb3JsZC5nZXRBcmVhQnlDZWxsIl0sIm1hcHBpbmdzIjoiQUFBQSxBQUVBLHNEQUZzRDtBQUN0RCx3REFBd0Q7QUFDeEQsSUFBTyxJQUFJLENBeUZWO0FBekZELFdBQU8sSUFBSSxFQUFDLENBQUM7SUFFVEEsV0FBWUEsWUFBWUE7UUFDcEJDLCtDQUFVQSxDQUFBQTtRQUVWQSwrREFBa0JBLENBQUFBO1FBRWxCQSx5RUFBdUJBLENBQUFBO1FBRXZCQSwyREFBZ0JBLENBQUFBO1FBRWhCQSxpRUFBNkRBLENBQUFBO1FBRTdEQSxpRUFBbUJBLENBQUFBO1FBRW5CQSw0REFBaUJBLENBQUFBO1FBRWpCQSw0REFBaUJBLENBQUFBO1FBQ2pCQSw4Q0FBVUEsQ0FBQUE7SUFDZEEsQ0FBQ0EsRUFqQldELGlCQUFZQSxLQUFaQSxpQkFB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LENBQUNBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO1lBRWpCQSxJQUFJQSxTQUFTQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQTtZQUNyQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0E7WUFDOUJBLFNBQVNBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBO1lBRTdCQSxJQUFJQSxPQUFPQSxHQUFHQSxXQUFXQSxDQUFDQTtZQUMxQkEsSUFBSUEsT0FBT0EsR0FBR0EsV0FBV0EsQ0FBQ0E7WUFDMUJBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLHFCQUFxQkEsRUFBRUEsQ0FBQ0E7WUFDckRBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO2dCQUNqQkEsT0FBT0EsR0FBR0EsV0FBV0EsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDM0NBLENBQUNBO1lBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLFVBQVVBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO2dCQUN0Q0EsT0FBT0EsR0FBR0EsV0FBV0EsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsVUFBVUEsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDekRBLENBQUNBO1lBRURBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO2dCQUNoQkEsT0FBT0EsR0FBR0EsV0FBV0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDMUNBLENBQUNBO1lBQUNBLElBQUlB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S0FBS0E7aUJBQ2pDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxVQUFBQSxDQUFDQSxJQUFJQSxPQUFBQSxDQUFDQSxDQUFDQSxNQUFNQSxFQUFSQSxDQUFRQSxDQUFDQSxDQUFDQTtpQkFDbkRBLEdBQUdBLENBQUNBLFVBQUFBLENBQUNBO2dCQUNGQSxJQUFJQSxJQUFJQSxHQUFHQSxLQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDNUNBLElBQUlBLFFBQVFBLEdBQUdBLElBQUlBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBO2dCQUNoRUEsSUFBSUEsS0FBS0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JCQSxFQUFFQSxDQUFDQSxDQUFDQSxRQUFRQSxJQUFJQSxJQUFJQSxDQUFDQTtvQkFDakJBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO2dCQUN6QkEsSUFBSUEsUUFBUUEsR0FBR0EsS0FBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JEQSxFQUFFQSxDQUFDQSxDQUFDQSxRQUFRQSxJQUFJQSxRQUFRQSxLQUFLQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQTtvQkFDaENBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO2dCQUV6QkEsTUFBTUEsQ0FBQ0E7b0JBQ0hBLEtBQUtBLEVBQUVBLEtBQUtBO29CQUNaQSxXQUFXQSxFQUFFQSxLQUFLQSxDQUFDQSxHQUFHQSxDQUFDQSxVQUFBQSxDQUFDQSxJQUFJQSxPQUFBQSxR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QUNBLFdBQVdBLENBQUNBLEtBQUlBLENBQUNBLFlBQVlBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO29CQUM5RkEsQ0FBQ0E7b0JBQ0RBLEtBQUlBLENBQUNBLGFBQWFBLENBQUNBLFdBQVdBLENBQUNBLEtBQUlBLENBQUNBLFlBQVlBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO29CQUMxRkEsS0FBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBSUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2xHQSxJQUFJQSxHQUFHQSxHQUFHQSxDQUFDQTtnQkFDZkEsQ0FBQ0E7Z0JBQ0RBLEVBQUVBLENBQUFBLENBQUNBLElBQUlBLElBQUlBLElBQUlBLENBQUNBO29CQUNaQSxLQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxJQUFJQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFF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QUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTs0QkFDcENBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLEdBQUdBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBO2dDQUVqQkEsSUFBSUEsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0NBQzlDQSxJQUFJQSxJQUFJQSxHQUFNQSxJQUFJQSxDQUFDQSxJQUFJQSxrQkFBYUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBTUEsQ0FBQ0E7Z0NBQ3BEQSxJQUFJQSxFQUFFQSxHQUFHQSxJQUFJQSxRQUFRQSxDQUFDQSxJQUFJQSxTQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxHQUFHQSxFQUFFQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtnQ0FDekRBLEVBQUVBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLElBQUlBLFFBQVFBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLFNBQVNBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO2dDQUMvRUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7Z0NBQ2ZBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLFFBQVFBLENBQUNBLEVBQUVBLEVBQUVBLElBQUlBLEVBQUVBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBOzRCQUNqREEsQ0FBQ0E7d0JBQ0xBLENBQUNBO29CQUNMQSxDQUFDQTtnQkFDTEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDUEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFFSEEsSUFBSUEsQ0FBQ0EsR0FBZUEsS0FBS0Es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Q0FBQ0EsU0FBU0EsR0FBR0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBQUEsQ0FBQ0E7Z0JBQ2pDQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxTQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxTQUFJQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQTtnQkFDaEVBLElBQUlBLElBQUlBLEdBQUdBLEtBQUtBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO2dCQUVuQ0EsSUFBSUEsSUFBSUEsR0FBV0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JCQSxJQUFJQSxJQUFJQSxHQUFXQSxDQUFDQSxDQUFDQTtnQkFDckJBLElBQUlBLEtBQUtBLEdBQVdBLENBQUNBLENBQUNBO2dCQUN0QkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQUEsQ0FBQ0E7b0JBQ2ZBLElBQUlBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBO29CQUN2Q0EsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0E7b0JBQzlCQSxLQUFLQSxJQUFJQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQTtnQkFDckJBLENBQUNBLENBQUNBLENBQUNBO2dCQUNIQSxJQUFJQSxDQUFDQSxHQUFHQSxHQUFHQSxTQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxHQUFHQSxLQUFLQSxFQUFFQSxJQUFJQSxHQUFHQSxLQUFLQSxDQUFDQSxDQUFDQTtnQkFDckRBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO1lBQ2hCQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUdIQSxJQUFJQSxDQUFDQSxTQUFTQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUNwQkEsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQUEsQ0FBQ0EsSUFBSUEsT0FBQUEsS0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBeEJBLENBQXdCQSxDQUFDQSxDQUFDQTtRQUN0REEsQ0FBQ0E7UUFFREQsNkJBQWFBLEdBQWJBLFVBQWNBLElBQXFCQSxFQUFFQSxJQUFZQTtZQUFqREUsaUJBNkJDQTtZQTVCR0EsSUFBSUEsS0FBS0EsR0FBa0JBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ3RDQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUMxQ0EsSUFBSUEsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsUUFBUUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7WUFDMUNBLElBQUlBLEtBQUtBLEdBQVdBLEtBQUtBLENBQUNBLEdBQUdBLENBQUNBLFVBQUFBLENBQUNBLElBQUlBLE9BQUFBLElBQUlBLFNBQUlBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLEVBQUtBLFFBQVFBLFVBQUtBLENBQUNBLENBQUNBLElBQU1BLEVBQUVBLElBQUlBLFNBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLEVBQUVBLElBQUlBLENBQUNBLEVBQTFFQSxDQUEwRUEsQ0FBQ0EsQ0FBQ0E7WUFDL0dBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1lBQ3RDQSxJQUFJQSxJQUFJQSxHQUFHQSxLQUFLQSxDQUFDQSxh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ZSI6InRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImQvZXM2LXByb21pc2UvZXM2LXByb21pc2UuZC50c1wiLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImQvd2hhdHdnLWZldGNoL3doYXR3Zy1mZXRjaC5kLnRzXCIvPlxyXG5tb2R1bGUgVGVzcCB7XHJcbiAgICBleHBvcnQgdHlwZSBDaGFuZ2VMaXN0ZW5lckZ1bmMgPSAocmVhc29uOiBDaGFuZ2VSZWFzb24pID0+IHZvaWQ7XHJcbiAgICBleHBvcnQgZW51bSBDaGFuZ2VSZWFzb24ge1xyXG4gICAgICAgIE5vbmUgPSAweDAsXHJcbiAgICAgICAgLyoqIFRoZSBzZWxlY3RlZCBzb3VyY2Ugbm9kZSBoYXMgY2hhbmdlZCAqL1xyXG4gICAgICAgIFNvdXJjZUNoYW5nZSA9IDB4MSxcclxuICAgICAgICAvKiogVGhlIHNlbGVjdGVkIGRlc3RpbmF0aW9uIG5vZGUgaGFzIGNoYW5nZWQgKi9cclxuICAgICAgICBEZXN0aW5hdGlvbkNoYW5nZSA9IDB4MixcclxuICAgICAgICAvKiogVGhlIG1hcmsgbm9kZSBsb2NhdGlvbiBoYXMgY2hhbmdlZCAqL1xyXG4gICAgICAgIE1hcmtDaGFuZ2UgPSAweDQsXHJcbiAgICAgICAgLyoqIFRoZSBlaXRoZXIgdGhlIHNvdXJjZSwgZGVzdGluYXRpb24gb3IgbWFyayBsb2NhdGlvbiBoYXMgY2hhbmdlZCAqL1xyXG4gICAgICAgIENvbnRleHRDaGFuZ2UgPSBTb3VyY2VDaGFuZ2UgfCBEZXN0aW5hdGlvbkNoYW5nZSB8IE1hcmtDaGFuZ2UsXHJcbiAgICAgICAgLyoqIFRoZSBlbmFibGVkIHN0YXRlIG9yIHZpc2liaWxpdHkgb2YgYSBmZWF0dXJlIGhhcyBjaGFuZ2VkICovXHJcbiAgICAgICAgRmVhdHVyZUNoYW5nZSA9IDB4OCxcclxuICAgICAgICAvKiogQSBuZXcgcGF0aCBoYXMgYmVlbiBjYWxjdWxhdGVkICovXHJcbiAgICAgICAgUGF0aFVwZGF0ZSA9IDB4MTAsXHJcbiAgICAgICAgLyoqIEFuIGlucHV0IGV2ZW50IGhhcyB0cmlnZ2VyZWQgbWVudXMgdG8gY2xvc2UgKi9cclxuICAgICAgICBDbGVhck1lbnVzID0gMHgyMCxcclxuICAgICAgICBBbnkgPSAweDNmXHJcbiAgICB9XHJcbiAgICBleHBvcnQgY2xhc3MgQ2hhbmdlTGlzdGVuZXIge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFzb25zOiBDaGFuZ2VSZWFzb24sIHB1YmxpYyBmdW5jOiBDaGFuZ2VMaXN0ZW5lckZ1bmMpIHsgfVxyXG5cclxuICAgICAgICB0cmlnZ2VyKHJlYXNvbjogQ2hhbmdlUmVhc29uKSB7XHJcbiAgICAgICAgICAgIGlmICgodGhpcy5yZWFzb25zICYgcmVhc29uKSAhPT0gMClcclxuICAgICAgICAgICAgICAgIHRoaXMuZnVuYyhyZWFzb24pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKiogQ29yZSBURVNQYXRoZmluZGVyIGFwcGxpY2F0aW9uICovXHJcbiAgICBleHBvcnQgY2xhc3MgQXBwbGljYXRpb24ge1xyXG4gICAgICAgIGxvYWRlZDogUHJvbWlzZTxBcHBsaWNhdGlvbj47XHJcbiAgICAgICAgZWxlbWVudDogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgY29udGV4dDogQ29udGV4dDtcclxuICAgICAgICBmZWF0dXJlczogSUZlYXR1cmVMaXN0O1xyXG4gICAgICAgIHdvcmxkOiBXb3JsZDtcclxuICAgICAgICBjb250cm9sczogQ29udHJvbHM7XHJcbiAgICAgICAgbWFwOiBNYXA7XHJcbiAgICAgICAgY3R4TWVudTogQ29udGV4dE1lbnU7XHJcblxyXG4gICAgICAgIHByaXZhdGUgbGlzdGVuZXJzOiBDaGFuZ2VMaXN0ZW5lcltdID0gW107XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xyXG4gICAgICAgICAgICB0aGlzLmxvYWRlZCA9IHdpbmRvdy5mZXRjaChcImRhdGEvZGF0YS5qc29uXCIpXHJcbiAgICAgICAgICAgICAgICAudGhlbihyZXMgPT4gcmVzLmpzb24oKSlcclxuICAgICAgICAgICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dCA9IG5ldyBDb250ZXh0KHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmVhdHVyZXMgPSBGZWF0dXJlcy5pbml0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53b3JsZCA9IG5ldyBXb3JsZCh0aGlzLCA8SVdvcmxkU291cmNlPjxhbnk+ZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXAgPSBuZXcgTWFwKHRoaXMsIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFwXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRyb2xzID0gbmV3IENvbnRyb2xzKHRoaXMsIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udHJvbHNcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4TWVudSA9IG5ldyBDb250ZXh0TWVudSh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5vbm1vdXNlZG93biA9IGRvY3VtZW50LmJvZHkub25jb250ZXh0bWVudSA9ICgpID0+IHRoaXMudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uQ2xlYXJNZW51cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVCb2R5Q2xhc3MoXCJsb2FkaW5nXCIsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIExpc3RlbiBmb3IgYXBwbGljYXRpb24gbGV2ZWwgY2hhbmdlcyAqL1xyXG4gICAgICAgIGFkZENoYW5nZUxpc3RlbmVyKHJlYXNvbnM6IENoYW5nZVJlYXNvbiwgZnVuYzogQ2hhbmdlTGlzdGVuZXJGdW5jKTogQ2hhbmdlTGlzdGVuZXIge1xyXG4gICAgICAgICAgICB2YXIgbGlzdGVuZXIgPSBuZXcgQ2hhbmdlTGlzdGVuZXIocmVhc29ucywgZnVuYyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gbGlzdGVuZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qKiBSZW1vdmUgYSBwcmV2aW91c2x5IGFkZGVkIGxpc3RlbmVyICovXHJcbiAgICAgICAgcmVtb3ZlQ2hhbmdlTGlzdGVuZXIobGlzdGVuZXI6IENoYW5nZUxpc3RlbmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBpeCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xyXG4gICAgICAgICAgICBpZiAoaXggPiAtMSlcclxuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLnNwbGljZShpeCwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qKiBJbmZvcm0gYWxsIGxpc3RlbmVycyBhYm91dCBhIG5ldyBjaGFuZ2UgKi9cclxuICAgICAgICB0cmlnZ2VyQ2hhbmdlKHJlYXNvbjogQ2hhbmdlUmVhc29uKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2gobCA9PiBsLnRyaWdnZXIocmVhc29uKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogVG9nZ2xlIGEgY2xhc3MgYXR0cmlidXRlIG5hbWUgaW4gdGhlIGRvY3VtZW50IGJvZHkgKi9cclxuICAgICAgICB0b2dnbGVCb2R5Q2xhc3MobmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQobmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUobmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBhcHBsaWNhdGlvbiwgZm9yIGRlYnVnZ2luZyBwdXJwb3NlcyBvbmx5ICovXHJcbiAgICBleHBvcnQgdmFyIGFwcCA9IG5ldyBBcHBsaWNhdGlvbigpO1xyXG59IiwibW9kdWxlIFRlc3Age1xyXG4gICAgLyoqIDItZGltZW5zaW9uYWwgZmxvYXRpbmcgcG9pbnQgdmVjdG9yICovXHJcbiAgICBleHBvcnQgY2xhc3MgVmVjMiB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIHg6IG51bWJlciwgcHVibGljIHk6IG51bWJlcikgeyB9XHJcblxyXG4gICAgICAgIC8qKiBDYWxjdWxhdGUgdGhlIGV1Y2xpZGVhbiBkaXN0YW5jZSBiZXR3ZWVuIHRoaXMgdmVjdG9yIGFuZCBhbm90aGVyICovXHJcbiAgICAgICAgZGlzdGFuY2Uob3RoZXI6IFZlYzIpOiBudW1iZXIge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KCgob3RoZXIueCAtIHRoaXMueCkgKiAob3RoZXIueCAtIHRoaXMueCkpICsgKChvdGhlci55IC0gdGhpcy55KSAqIChvdGhlci55IC0gdGhpcy55KSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIENhbGN1bGF0ZSB0aGUgdG9wLWxlZnQgY29ybmVyIG9mIGEgY2VsbCBhcyBhIHBvc2l0aW9uIHZlY3RvciAqL1xyXG4gICAgICAgIHN0YXRpYyBmcm9tQ2VsbCh4OiBudW1iZXIsIHk6IG51bWJlcik6IFZlYzIge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFZlYzIoeCAqIENlbGwud2lkdGggKyBDZWxsLndpZHRoT2Zmc2V0LCB5ICogQ2VsbC5oZWlnaHQgKyBDZWxsLmhlaWdodE9mZnNldCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKiBBIHNpbmdsZSBzaWduaWZpY2FudCBwb2ludCBpbiB0aGUgd29ybGQgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBOb2RlIHtcclxuICAgICAgICAvKiogR2xvYmFsbHkgdW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoaXMgbm9kZSAqL1xyXG4gICAgICAgIGlkOiBudW1iZXI7XHJcbiAgICAgICAgLyoqIFRoZSBpZCBvZiBhIG5vZGUgdGhpcyBub2RlIHdhcyBjcmVhdGVkIG9uICovXHJcbiAgICAgICAgcmVmZXJlbmNlSWQ6IG51bWJlcjtcclxuICAgICAgICBlZGdlczogRWRnZVtdO1xyXG5cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyBpZGVudGl0eTogbnVtYmVyID0gMTtcclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwdWJsaWMgbG9uZ05hbWU6IHN0cmluZywgcHVibGljIHBvczogVmVjMiwgcHVibGljIHR5cGU6IHN0cmluZywgcHVibGljIHBlcm1hbmVudDogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaWQgPSBOb2RlLmlkZW50aXR5Kys7XHJcbiAgICAgICAgICAgIHRoaXMuZWRnZXMgPSBbXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIEEgbGluayBiZXR3ZWVuIHR3byBub2RlcyAqL1xyXG4gICAgZXhwb3J0IGNsYXNzIEVkZ2Uge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBzcmNOb2RlOiBOb2RlLCBwdWJsaWMgZGVzdE5vZGU6IE5vZGUsIHB1YmxpYyBjb3N0OiBudW1iZXIpIHsgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKiBBIGxhcmdlIGFyZWEgaW4gdGhlIHdvcmxkICovXHJcbiAgICBleHBvcnQgY2xhc3MgQ2VsbCB7XHJcbiAgICAgICAgc3RhdGljIHdpZHRoOiBudW1iZXIgPSA0NC41O1xyXG4gICAgICAgIHN0YXRpYyBoZWlnaHQ6IG51bWJlciA9IDQ0LjY7XHJcbiAgICAgICAgc3RhdGljIHdpZHRoT2Zmc2V0OiBudW1iZXIgPSAyMDtcclxuICAgICAgICBzdGF0aWMgaGVpZ2h0T2Zmc2V0OiBudW1iZXIgPSAzNTtcclxuICAgICAgICBzdGF0aWMgZnJvbVBvc2l0aW9uKHBvczogVmVjMik6IFZlYzIge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFZlYzIoKHBvcy54IC0gQ2VsbC53aWR0aE9mZnNldCkgLyBDZWxsLndpZHRoLCAocG9zLnkgLSBDZWxsLmhlaWdodE9mZnNldCkgLyBDZWxsLmhlaWdodCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqIEEgc2luZ2xlIHJvdyBvZiBjZWxscyAqL1xyXG4gICAgZXhwb3J0IGNsYXNzIENlbGxSb3cge1xyXG4gICAgICAgIHdpZHRoOiBudW1iZXI7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyB5OiBudW1iZXIsIHB1YmxpYyB4MTogbnVtYmVyLCBwdWJsaWMgeDI6IG51bWJlcikge1xyXG4gICAgICAgICAgICB0aGlzLndpZHRoID0geDIgLSB4MSArIDE7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqIEFuIGFyZWEgb2Ygb25lIG9yIG1vcmUgY2VsbHMgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBBcmVhIHtcclxuICAgICAgICBwcml2YXRlIG1pblk6IG51bWJlcjtcclxuICAgICAgICBwcml2YXRlIG1heFk6IG51bWJlcjtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIHRhcmdldDogTm9kZSwgcHVibGljIHJvd3M6IENlbGxSb3dbXSkge1xyXG4gICAgICAgICAgICB0aGlzLm1pblkgPSByb3dzWzBdLnk7XHJcbiAgICAgICAgICAgIHRoaXMubWF4WSA9IHJvd3Nbcm93cy5sZW5ndGggLSAxXS55O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIENoZWNrIGlmIHRoaXMgY2VsbCBjb250YWlucyB0aGUgc3VwcGxpZWQgY29vcmRpbmF0ZXMgKi9cclxuICAgICAgICBjb250YWluc0NlbGwocG9zOiBWZWMyKTogYm9vbGVhbiB7XHJcbiAgICAgICAgICAgIGlmIChwb3MueSA+PSB0aGlzLm1pblkgJiYgcG9zLnkgPCB0aGlzLm1heFkgKyAxKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcm93ID0gdGhpcy5yb3dzW01hdGguZmxvb3IocG9zLnkpIC0gdGhpcy5taW5ZXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwb3MueCA+PSByb3cueDEgJiYgcG9zLnggPCByb3cueDIgKyAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJtb2R1bGUgVGVzcCB7XHJcbiAgICAvKiogVGhlIGN1cnJlbnQgbXV0YWJsZSBzdGF0ZSBvZiB0aGUgYXBwbGljYXRpb24gKi9cclxuICAgIGV4cG9ydCBjbGFzcyBDb250ZXh0IHtcclxuICAgICAgICBzb3VyY2VOb2RlOiBOb2RlO1xyXG4gICAgICAgIGRlc3ROb2RlOiBOb2RlO1xyXG4gICAgICAgIG1hcmtOb2RlOiBOb2RlO1xyXG4gICAgICAgIHBhdGhFbmQ6IFBhdGhOb2RlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwbGljYXRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLkNvbnRleHRDaGFuZ2V8Q2hhbmdlUmVhc29uLk1hcmtDaGFuZ2UsIHJlYXNvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmRQYXRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVhc29uID09PSBDaGFuZ2VSZWFzb24uTWFya0NoYW5nZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRvZ2dsZUJvZHlDbGFzcyhcImhhcy1tYXJrXCIsIHRoaXMubWFya05vZGUgIT0gbnVsbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0Q29udGV4dExvY2F0aW9uKGNvbnRleHQ6IHN0cmluZywgcG9zOiBWZWMyKSB7XHJcbiAgICAgICAgICAgIHZhciBuYW1lID0gdGhpcy5hcHAud29ybGQuZ2V0TGFuZG1hcmtOYW1lKHBvcykgfHwgdGhpcy5hcHAud29ybGQuZ2V0UmVnaW9uTmFtZShwb3MpO1xyXG4gICAgICAgICAgICBpZiAoY29udGV4dCA9PT0gXCJzb3VyY2VcIikge1xyXG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUgfHwgXCJZb3VcIjtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q29udGV4dE5vZGUoY29udGV4dCwgbmV3IE5vZGUobmFtZSwgbmFtZSwgcG9zLCBcInNvdXJjZVwiKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29udGV4dCA9PT0gXCJkZXN0aW5hdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICBuYW1lID0gbmFtZSB8fCBcIllvdXIgZGVzdGluYXRpb25cIjtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q29udGV4dE5vZGUoY29udGV4dCwgbmV3IE5vZGUobmFtZSwgbmFtZSwgcG9zLCBcImRlc3RpbmF0aW9uXCIpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb250ZXh0ID09PSBcIm1hcmtcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXJrTm9kZSA9IG5ldyBOb2RlKG5hbWUsIG5hbWUsIHBvcywgXCJtYXJrXCIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uTWFya0NoYW5nZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgc2V0Q29udGV4dE5vZGUoY29udGV4dDogc3RyaW5nLCBub2RlOiBOb2RlKSB7XHJcbiAgICAgICAgICAgIGlmIChjb250ZXh0ID09PSBcInNvdXJjZVwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZU5vZGUgPSBub2RlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uU291cmNlQ2hhbmdlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb250ZXh0ID09PSBcImRlc3RpbmF0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGVzdE5vZGUgPSBub2RlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uRGVzdGluYXRpb25DaGFuZ2UpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbnRleHQgPT09IFwibWFya1wiKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcG9zID0gbm9kZS5wb3M7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1hcmtOb2RlID0gbmV3IE5vZGUobm9kZS5sb25nTmFtZSwgbm9kZS5sb25nTmFtZSwgcG9zLCBcIm1hcmtcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1hcmtOb2RlLnJlZmVyZW5jZUlkID0gbm9kZS5yZWZlcmVuY2VJZCB8fCBub2RlLmlkO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uTWFya0NoYW5nZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY2xlYXJDb250ZXh0KGNvbnRleHQ6IHN0cmluZykge1xyXG4gICAgICAgICAgICBpZiAoY29udGV4dCA9PT0gXCJzb3VyY2VcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zb3VyY2VOb2RlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLlNvdXJjZUNoYW5nZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29udGV4dCA9PT0gXCJkZXN0aW5hdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlc3ROb2RlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLkRlc3RpbmF0aW9uQ2hhbmdlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb250ZXh0ID09PSBcIm1hcmtcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXJrTm9kZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5NYXJrQ2hhbmdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmluZFBhdGgoKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGF0aEVuZCA9IHRoaXMuc291cmNlTm9kZSAhPSBudWxsICYmIHRoaXMuZGVzdE5vZGUgIT0gbnVsbCAmJiB0aGlzLnNvdXJjZU5vZGUgIT09IHRoaXMuZGVzdE5vZGVcclxuICAgICAgICAgICAgICAgID8gUGF0aC5maW5kUGF0aCh0aGlzLmFwcClcclxuICAgICAgICAgICAgICAgIDogbnVsbDtcclxuICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uUGF0aFVwZGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwibW9kdWxlIFRlc3Age1xyXG4gICAgLyoqIE1hbmFnZXMgdGhlIGNvbnRleHQgbWVudSBvZiB0aGUgbWFwICovXHJcbiAgICBleHBvcnQgY2xhc3MgQ29udGV4dE1lbnUge1xyXG4gICAgICAgIHByaXZhdGUgbWVudTogTWVudTtcclxuICAgICAgICBwcml2YXRlIGxpbmtzOiBNZW51SXRlbVtdO1xyXG4gICAgICAgIHByaXZhdGUgdW5tYXJrTGluazogTWVudUl0ZW07XHJcblxyXG4gICAgICAgIHByaXZhdGUgcG9zOiBWZWMyO1xyXG4gICAgICAgIHByaXZhdGUgbm9kZTogTm9kZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcGxpY2F0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWVudSA9IG5ldyBNZW51KGFwcCwgZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5saW5rcyA9IFtcclxuICAgICAgICAgICAgICAgIE1lbnVJdGVtLnNlcGFyYXRvcixcclxuICAgICAgICAgICAgICAgIG5ldyBNZW51SXRlbShcIk5hdmlnYXRlIGZyb20gaGVyZVwiLCAoKSA9PiB0aGlzLnNldENvbnRleHQoXCJzb3VyY2VcIikpLFxyXG4gICAgICAgICAgICAgICAgbmV3IE1lbnVJdGVtKFwiTmF2aWdhdGUgdG8gaGVyZVwiLCAoKSA9PiB0aGlzLnNldENvbnRleHQoXCJkZXN0aW5hdGlvblwiKSksXHJcbiAgICAgICAgICAgICAgICBuZXcgTWVudUl0ZW0oXCJTZXQgTWFyayBoZXJlXCIsICgpID0+IHRoaXMuc2V0Q29udGV4dChcIm1hcmtcIikpXHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgIHRoaXMudW5tYXJrTGluayA9IG5ldyBNZW51SXRlbShcIlJlbW92ZSBtYXJrXCIsICgpID0+IHRoaXMuYXBwLmNvbnRleHQuY2xlYXJDb250ZXh0KFwibWFya1wiKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHNldENvbnRleHQoY29udGV4dDogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5vZGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuY29udGV4dC5zZXRDb250ZXh0Tm9kZShjb250ZXh0LCB0aGlzLm5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuY29udGV4dC5zZXRDb250ZXh0TG9jYXRpb24oY29udGV4dCwgdGhpcy5wb3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvcGVuTm9kZShub2RlOiBOb2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3Blbihub2RlLnBvcywgbm9kZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9wZW4ocG9zOiBWZWMyLCBub2RlOiBOb2RlKSB7XHJcbiAgICAgICAgICAgIC8vIHJlbW92ZSBub2RlIGlmIG5laXRoZXIgaXQgb3IgaXRzIHJlZmVyZW5jZSBhcmUgcGVybWFuZW50XHJcbiAgICAgICAgICAgIGlmIChub2RlICE9IG51bGwgJiYgIW5vZGUucGVybWFuZW50KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5yZWZlcmVuY2VJZCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLmFwcC53b3JsZC5maW5kTm9kZUJ5SWQobm9kZS5yZWZlcmVuY2VJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUgIT0gbnVsbCAmJiAhbm9kZS5wZXJtYW5lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbGluZXM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgICAgIHZhciBsYW5kbWFyayA9IHRoaXMuYXBwLndvcmxkLmdldExhbmRtYXJrTmFtZShwb3MpO1xyXG4gICAgICAgICAgICBpZiAobm9kZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmVhdCA9IHRoaXMuYXBwLmZlYXR1cmVzLmJ5TmFtZVtub2RlLnR5cGVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZlYXQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVzLnB1c2goZmVhdC5sb2NhdGlvbiB8fCBmZWF0Lm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVzLnB1c2gobm9kZS5uYW1lKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZXMucHVzaChub2RlLmxvbmdOYW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChsYW5kbWFyayAhPSBudWxsICYmIGxhbmRtYXJrICE9PSBub2RlLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKGxhbmRtYXJrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHBvcyA9IG5vZGUucG9zO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGxhbmRtYXJrICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGxpbmVzLnB1c2gobGFuZG1hcmspO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciByZWdpb24gPSB0aGlzLmFwcC53b3JsZC5nZXRSZWdpb25OYW1lKHBvcyk7XHJcbiAgICAgICAgICAgIGlmIChyZWdpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgbGluZXMucHVzaChyZWdpb24gKyBcIiBSZWdpb25cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMucG9zID0gcG9zO1xyXG4gICAgICAgICAgICB0aGlzLm5vZGUgPSBub2RlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGl0ZW1zID0gbGluZXMubWFwKGwgPT4gbmV3IE1lbnVJdGVtKGwpKS5jb25jYXQodGhpcy5saW5rcyk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFwcC5jb250ZXh0Lm1hcmtOb2RlICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICBpdGVtcy5wdXNoKHRoaXMudW5tYXJrTGluayk7XHJcbiAgICAgICAgICAgIHRoaXMubWVudS5zZXREYXRhKGl0ZW1zKTtcclxuICAgICAgICAgICAgdGhpcy5tZW51Lm9wZW4oKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBtZW51U3R5bGUgPSB0aGlzLm1lbnUuZ2V0U3R5bGUoKTtcclxuICAgICAgICAgICAgbWVudVN0eWxlLmxlZnQgPSBwb3MueCArIFwicHhcIjtcclxuICAgICAgICAgICAgbWVudVN0eWxlLnRvcCA9IHBvcy55ICsgXCJweFwiO1xyXG5cclxuICAgICAgICAgICAgdmFyIHNjcm9sbFggPSBwYWdlWE9mZnNldDtcclxuICAgICAgICAgICAgdmFyIHNjcm9sbFkgPSBwYWdlWU9mZnNldDtcclxuICAgICAgICAgICAgdmFyIHJlY3QgPSB0aGlzLm1lbnUuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgICAgICAgaWYgKHJlY3QubGVmdCA8IDEwKSB7XHJcbiAgICAgICAgICAgICAgICBzY3JvbGxYID0gcGFnZVhPZmZzZXQgKyByZWN0LmxlZnQgLSAxMDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZWN0LnJpZ2h0ID4gaW5uZXJXaWR0aCAtIDI3KSB7XHJcbiAgICAgICAgICAgICAgICBzY3JvbGxYID0gcGFnZVhPZmZzZXQgKyByZWN0LnJpZ2h0IC0gaW5uZXJXaWR0aCArIDI3O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVjdC50b3AgPCA1MCkge1xyXG4gICAgICAgICAgICAgICAgc2Nyb2xsWSA9IHBhZ2VZT2Zmc2V0ICsgcmVjdC50b3AgLSA1MDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZWN0LmJvdHRvbSA+IGlubmVySGVpZ2h0IC0gMjcpIHtcclxuICAgICAgICAgICAgICAgIHNjcm9sbFkgPSBwYWdlWU9mZnNldCArIHJlY3QuYm90dG9tIC0gaW5uZXJIZWlnaHQgKyAyNztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHNjcm9sbFggIT09IHBhZ2VYT2Zmc2V0IHx8IHNjcm9sbFkgIT09IHBhZ2VZT2Zmc2V0KVxyXG4gICAgICAgICAgICAgICAgc2Nyb2xsKHNjcm9sbFgsIHNjcm9sbFkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBoaWRlKCkge1xyXG4gICAgICAgICAgICB0aGlzLm1lbnUuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIm1vZHVsZSBUZXNwIHtcclxuICAgIC8qKiBVSSBjb250cm9scyBmb3Igc2VhcmNoIGFuZCBuYXZpZ2F0aW9uICovXHJcbiAgICBleHBvcnQgY2xhc3MgQ29udHJvbHMge1xyXG4gICAgICAgIHByaXZhdGUgcGF0aENvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBmZWF0dXJlc0NvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBzZWFyY2hJbnB1dDogSFRNTElucHV0RWxlbWVudDtcclxuICAgICAgICBwcml2YXRlIHNlYXJjaEJveDogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBzZWFyY2hNZW51OiBNZW51O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwbGljYXRpb24sIHByaXZhdGUgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLlNvdXJjZUNoYW5nZSwgKCkgPT4gdGhpcy51cGRhdGVOb2RlSW5mbyhcIi5jb250cm9sLXNvdXJjZS1pbmZvXCIsIHRoaXMuYXBwLmNvbnRleHQuc291cmNlTm9kZSkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uRGVzdGluYXRpb25DaGFuZ2UsICgpID0+IHRoaXMudXBkYXRlTm9kZUluZm8oXCIuY29udHJvbC1kZXN0aW5hdGlvbi1pbmZvXCIsIHRoaXMuYXBwLmNvbnRleHQuZGVzdE5vZGUpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLk1hcmtDaGFuZ2UsICgpID0+IHRoaXMudXBkYXRlTm9kZUluZm8oXCIuY29udHJvbC1tYXJrLWluZm9cIiwgdGhpcy5hcHAuY29udGV4dC5tYXJrTm9kZSkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uUGF0aFVwZGF0ZSwgKCkgPT4gdGhpcy51cGRhdGVQYXRoKCkpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wYXRoQ29udGFpbmVyID0gPEhUTUxFbGVtZW50PmVsZW1lbnQucXVlcnlTZWxlY3RvcihcIi5wYXRoLWNvbnRhaW5lclwiKTtcclxuICAgICAgICAgICAgdGhpcy5mZWF0dXJlc0NvbnRhaW5lciA9IDxIVE1MRWxlbWVudD5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZmVhdHVyZXMtY29udGFpbmVyXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaElucHV0ID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZWxlbWVudC5xdWVyeVNlbGVjdG9yKFwiLnNlYXJjaC1pbnB1dFwiKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBmZWF0dXJlc1Zpc2libGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgKDxIVE1MRWxlbWVudD5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2V0dGluZ3MtaWNvblwiKSkub25jbGljayA9ICgpID0+IFxyXG4gICAgICAgICAgICAgICAgdGhpcy5mZWF0dXJlc0NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gKGZlYXR1cmVzVmlzaWJsZSA9ICFmZWF0dXJlc1Zpc2libGUpID8gXCJibG9ja1wiIDogXCJub25lXCI7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluaXRTZWFyY2goKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluaXRTZWFyY2goKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWFyY2hDb250YWluZXIgPSA8SFRNTElucHV0RWxlbWVudD50aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcihcIi5zZWFyY2gtY29udGFpbmVyXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaE1lbnUgPSBuZXcgTWVudShhcHAsIHRydWUpO1xyXG4gICAgICAgICAgICB2YXIgbWVudVN0eWxlID0gdGhpcy5zZWFyY2hNZW51LmdldFN0eWxlKCk7XHJcbiAgICAgICAgICAgIHZhciBpbnB1dCA9IHRoaXMuc2VhcmNoSW5wdXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgICAgIG1lbnVTdHlsZS5taW5XaWR0aCA9IFwiMjAwcHhcIjtcclxuICAgICAgICAgICAgbWVudVN0eWxlLnRvcCA9IChpbnB1dC50b3AgKyBpbnB1dC5oZWlnaHQpICsgXCJweFwiO1xyXG4gICAgICAgICAgICBtZW51U3R5bGUucmlnaHQgPSAoc2VhcmNoQ29udGFpbmVyLmNsaWVudFdpZHRoIC0gaW5wdXQucmlnaHQpICsgXCJweFwiO1xyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gcHJlcFRlcm0odGV4dDogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGV4dCAhPSBudWxsID8gdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1teYS16XSsvZywgXCIgXCIpIDogbnVsbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHNlYXJjaE5vZGVzID0gdGhpcy5hcHAud29ybGQubm9kZXNcclxuICAgICAgICAgICAgICAgIC5jb25jYXQodGhpcy5hcHAud29ybGQubGFuZG1hcmtzLm1hcChhID0+IGEudGFyZ2V0KSlcclxuICAgICAgICAgICAgICAgIC5tYXAobiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZlYXQgPSB0aGlzLmFwcC5mZWF0dXJlcy5ieU5hbWVbbi50eXBlXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmVhdE5hbWUgPSBmZWF0ICE9IG51bGwgPyBmZWF0LmxvY2F0aW9uIHx8IGZlYXQubmFtZSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlcm1zID0gW24ubmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZlYXROYW1lICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlcm1zLnB1c2goZmVhdE5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsYW5kbWFyayA9IHRoaXMuYXBwLndvcmxkLmdldExhbmRtYXJrTmFtZShuLnBvcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhbmRtYXJrICYmIGxhbmRtYXJrICE9PSBuLm5hbWUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlcm1zLnB1c2gobGFuZG1hcmspO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXJtczogdGVybXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaFRlcm1zOiB0ZXJtcy5tYXAodCA9PiBwcmVwVGVybSh0KSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGU6IG5cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0ID0gYS5zZWFyY2hUZXJtcywgYnQgPSBiLnNlYXJjaFRlcm1zO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtbCA9IE1hdGgubWF4KGF0Lmxlbmd0aCwgYnQubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1sOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGQgPSAoYXRbaV0gfHwgXCJcIikubG9jYWxlQ29tcGFyZShidFtpXSB8fCBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQgIT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0ZlYXR1cmVzKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaElucHV0Lm9uaW5wdXQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2VhcmNoID0gdGhpcy5zZWFyY2hJbnB1dC52YWx1ZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBzdGFydHM6IG51bWJlcltdID0gW107XHJcbiAgICAgICAgICAgICAgICB2YXIgdGVybXM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgICAgICAgICB2YXIgYWxwaGEgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VhcmNoLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBzZWFyY2guY2hhckNvZGVBdChpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYyA+IDk2ICYmIGMgPCAxMjMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhbHBoYSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRzLnB1c2goaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbHBoYSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFscGhhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlcm1zID0gdGVybXMuY29uY2F0KHN0YXJ0cy5tYXAocyA9PiBzZWFyY2guc3Vic3RyaW5nKHMsIGkpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFscGhhID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGFscGhhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGVybXMgPSB0ZXJtcy5jb25jYXQoc3RhcnRzLm1hcChzID0+IHNlYXJjaC5zdWJzdHJpbmcocykpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0cyA9IHNlYXJjaE5vZGVzXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihuID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGVybXMuc29tZSh0ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuLnNlYXJjaFRlcm1zLnNvbWUoc3QgPT4gc3QuaW5kZXhPZih0KSA9PT0gMCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYysrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMgPj0gc3RhcnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWFyY2hNZW51LnNldERhdGEocmVzdWx0cy5tYXAobiA9PlxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBNZW51SXRlbShuLnRlcm1zLmpvaW4oXCIsIFwiKSwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcC5jdHhNZW51Lm9wZW5Ob2RlKG4ubm9kZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJTZWFyY2goKTtcclxuICAgICAgICAgICAgICAgICAgICB9KSkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWFyY2hNZW51Lm9wZW4oKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLkNsZWFyTWVudXMsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSB0aGlzLnNlYXJjaElucHV0KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJTZWFyY2goKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNsZWFyU2VhcmNoKCkge1xyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaElucHV0LnZhbHVlID0gXCJcIjtcclxuICAgICAgICAgICAgdGhpcy5zZWFyY2hNZW51LmhpZGUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgdXBkYXRlTm9kZUluZm8oc2VsZWN0b3I6IHN0cmluZywgbm9kZTogTm9kZSkge1xyXG4gICAgICAgICAgICB2YXIgZWwgPSA8SFRNTEVsZW1lbnQ+dGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAobm9kZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBlbC50ZXh0Q29udGVudCA9IG5vZGUubG9uZ05hbWU7XHJcbiAgICAgICAgICAgICAgICBlbC5vbmNsaWNrID0gKCkgPT4gdGhpcy5hcHAuY3R4TWVudS5vcGVuTm9kZShub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVsLnRleHRDb250ZW50ID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIGVsLm9uY2xpY2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHVwZGF0ZVBhdGgoKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZDogRWxlbWVudDtcclxuICAgICAgICAgICAgd2hpbGUgKChjaGlsZCA9IHRoaXMucGF0aENvbnRhaW5lci5maXJzdEVsZW1lbnRDaGlsZCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGF0aENvbnRhaW5lci5yZW1vdmVDaGlsZChjaGlsZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwYXRoTm9kZTogUGF0aE5vZGUgPSB0aGlzLmFwcC5jb250ZXh0LnBhdGhFbmQ7XHJcbiAgICAgICAgICAgIHRoaXMucGF0aENvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gcGF0aE5vZGUgPyBcImJsb2NrXCIgOiBcIm5vbmVcIjtcclxuICAgICAgICAgICAgd2hpbGUgKHBhdGhOb2RlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhdGhDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMuZHJhd1BhdGhOb2RlKHBhdGhOb2RlKSwgdGhpcy5wYXRoQ29udGFpbmVyLmZpcnN0RWxlbWVudENoaWxkKTtcclxuICAgICAgICAgICAgICAgIHBhdGhOb2RlID0gcGF0aE5vZGUucHJldjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgZHJhd1BhdGhOb2RlKHBhdGhOb2RlOiBQYXRoTm9kZSk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBpY29uOiBzdHJpbmcsIHRleHQ6IHN0cmluZywgbGlua1RleHQ6IHN0cmluZztcclxuICAgICAgICAgICAgdmFyIG5vZGUgPSBwYXRoTm9kZS5ub2RlO1xyXG4gICAgICAgICAgICB2YXIgZWRnZSA9IHBhdGhOb2RlLnByZXZFZGdlO1xyXG4gICAgICAgICAgICBpZiAoZWRnZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbjogc3RyaW5nO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVkZ2UudHlwZSA9PT0gXCJ3YWxrXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBcIldhbGtcIjtcclxuICAgICAgICAgICAgICAgICAgICBpY29uID0gXCJjb21wYXNzXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmZWF0ID0gdGhpcy5hcHAuZmVhdHVyZXMuYnlOYW1lW2VkZ2UudHlwZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZlYXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gZmVhdC52ZXJiIHx8IGZlYXQubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbiA9IGZlYXQuaWNvbjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBlZGdlLnR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb24gPSBcInF1ZXN0aW9uXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRleHQgPSBgICR7YWN0aW9ufSB0byBgO1xyXG4gICAgICAgICAgICAgICAgbGlua1RleHQgPSBub2RlLnR5cGUgPT09IGVkZ2UudHlwZSA/IG5vZGUubmFtZSA6IG5vZGUubG9uZ05hbWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpY29uID0gXCJtYXAtbWFya2VyXCI7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gXCIgXCI7XHJcbiAgICAgICAgICAgICAgICBsaW5rVGV4dCA9IG5vZGUubG9uZ05hbWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlcIik7XHJcbiAgICAgICAgICAgIGkuY2xhc3NMaXN0LmFkZChcInBhdGgtaWNvblwiKTtcclxuICAgICAgICAgICAgaS5jbGFzc0xpc3QuYWRkKFwiZmFcIik7XHJcbiAgICAgICAgICAgIGkuY2xhc3NMaXN0LmFkZChcImZhLVwiICsgaWNvbik7XHJcbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKGkpO1xyXG5cclxuICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dCkpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICAgICAgYS50ZXh0Q29udGVudCA9IGxpbmtUZXh0O1xyXG4gICAgICAgICAgICBhLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmFwcC5jdHhNZW51Lm9wZW5Ob2RlKG5vZGUpO1xyXG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChhKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBlbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgZHJhd0ZlYXR1cmVzKCkge1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5mZWF0dXJlcy5mb3JFYWNoKGYgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgIGVsLnRleHRDb250ZW50ID0gZi5uYW1lICsgXCI6XCI7XHJcblxyXG4gICAgICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQodGhpcy5kcmF3Q2hlY2tib3godmFsID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBmLmhpZGRlbiA9ICF2YWw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uRmVhdHVyZUNoYW5nZSk7XHJcbiAgICAgICAgICAgICAgICB9LCAhZi5oaWRkZW4pKTtcclxuICAgICAgICAgICAgICAgIGlmICghZi52aXN1YWxPbmx5KVxyXG4gICAgICAgICAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKHRoaXMuZHJhd0NoZWNrYm94KHZhbCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGYuZGlzYWJsZWQgPSAhdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcC50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5GZWF0dXJlQ2hhbmdlKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCAhZi5kaXNhYmxlZCkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuZmVhdHVyZXNDb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgZHJhd0NoZWNrYm94KG9uY2hhbmdlOiAodmFsdWU6IGJvb2xlYW4pID0+IHZvaWQsIGluaXRpYWw6IGJvb2xlYW4pOiBIVE1MRWxlbWVudCB7XHJcbiAgICAgICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcclxuICAgICAgICAgICAgaW5wdXQudHlwZSA9IFwiY2hlY2tib3hcIjtcclxuICAgICAgICAgICAgaW5wdXQub25jaGFuZ2UgPSAoKSA9PiBvbmNoYW5nZShpbnB1dC5jaGVja2VkKTtcclxuICAgICAgICAgICAgaW5wdXQuY2hlY2tlZCA9IGluaXRpYWw7XHJcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJtb2R1bGUgVGVzcCB7XHJcbiAgICBleHBvcnQgY2xhc3MgRmVhdHVyZSB7XHJcbiAgICAgICAgbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIHZlcmI6IHN0cmluZztcclxuICAgICAgICBsb2NhdGlvbjogc3RyaW5nO1xyXG4gICAgICAgIHR5cGU6IHN0cmluZztcclxuICAgICAgICBpY29uOiBzdHJpbmc7XHJcbiAgICAgICAgZGlzYWJsZWQ6IGJvb2xlYW47XHJcbiAgICAgICAgaGlkZGVuOiBib29sZWFuO1xyXG4gICAgICAgIHZpc3VhbE9ubHk6IGJvb2xlYW47XHJcbiAgICB9XHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElGZWF0dXJlTGlzdCBleHRlbmRzIEFycmF5PEZlYXR1cmU+IHtcclxuICAgICAgICBieU5hbWU6IHsgW2tleTogc3RyaW5nXTogRmVhdHVyZSB9O1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBGZWF0dXJlcyB7XHJcbiAgICAgICAgc3RhdGljIGluaXQoKTogSUZlYXR1cmVMaXN0IHtcclxuICAgICAgICAgICAgdmFyIGZlYXR1cmVzID0gPElGZWF0dXJlTGlzdD5bXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiTWFyay9SZWNhbGxcIiwgdmVyYjogXCJSZWNhbGxcIiwgdHlwZTogXCJtYXJrXCIsIGljb246IFwiYm9sdFwiIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiTWFnZXMgR3VpbGRcIiwgdmVyYjogXCJHdWlsZCBHdWlkZVwiLCB0eXBlOiBcIm1hZ2VzLWd1aWxkXCIsIGljb246IFwiZXllXCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJTaWx0IFN0cmlkZXJcIiwgdmVyYjogXCJTaWx0IFN0cmlkZXJcIiwgdHlwZTogXCJzaWx0LXN0cmlkZXJcIiwgaWNvbjogXCJidWdcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIkJvYXRcIiwgbG9jYXRpb246IFwiRG9ja3NcIiwgdHlwZTogXCJib2F0XCIsIGljb246IFwic2hpcFwiIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiSG9sYW1heWFuIEJvYXRcIiwgbG9jYXRpb246IFwiRG9ja3NcIiwgdmVyYjogXCJCb2F0XCIsIHR5cGU6IFwiaG9sYW1heWFuXCIsIGljb246IFwic2hpcFwiIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiUHJvcHlsb24gQ2hhbWJlclwiLCB0eXBlOiBcInByb3B5bG9uXCIsIGljb246IFwiY29nXCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJHb25kb2xhXCIsIHR5cGU6IFwiZ29uZG9sYVwiLCBpY29uOiBcInNoaXBcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIkRpdmluZSBJbnRlcnZlbnRpb25cIiwgbG9jYXRpb246IFwiSW1wZXJpYWwgQ3VsdCBTaHJpbmVcIiwgdHlwZTogXCJkaXZpbmVcIiwgaWNvbjogXCJib2x0XCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJBbG1zaXZpIEludGVydmVudGlvblwiLCBsb2NhdGlvbjogXCJUcmlidW5hbCBUZW1wbGVcIiwgdHlwZTogXCJhbG1zaXZpXCIsIGljb246IFwiYm9sdFwiIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiVHJhbnNwb3J0IGxpbmVzXCIsIHR5cGU6IFwidHJhbnNwb3J0LWVkZ2VcIiwgdmlzdWFsT25seTogdHJ1ZSB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIkxvY2F0aW9uc1wiLCB0eXBlOiBcIm5vZGVcIiwgdmlzdWFsT25seTogdHJ1ZSB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIkludGVydmVudGlvbiBhcmVhIGJvcmRlclwiLCB0eXBlOiBcImFyZWFcIiwgdmlzdWFsT25seTogdHJ1ZSB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIkdyaWRsaW5lc1wiLCB0eXBlOiBcImdyaWRcIiwgdmlzdWFsT25seTogdHJ1ZSB9XHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgIGZlYXR1cmVzLmJ5TmFtZSA9IHt9O1xyXG4gICAgICAgICAgICB2YXIgZklkeCA9IGZlYXR1cmVzLmJ5TmFtZTtcclxuICAgICAgICAgICAgZmVhdHVyZXMuZm9yRWFjaChmID0+IGZJZHhbZi50eXBlXSA9IGYpO1xyXG4gICAgICAgICAgICBmSWR4W1widHJhbnNwb3J0LWVkZ2VcIl0uaGlkZGVuID0gZklkeFtcImFyZWFcIl0uaGlkZGVuID0gZklkeFtcImdyaWRcIl0uaGlkZGVuID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIGZlYXR1cmVzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIm1vZHVsZSBUZXNwIHtcclxuICAgIC8qKiBUaGUgbWFwIFVJICovXHJcbiAgICBleHBvcnQgY2xhc3MgTWFwIHtcclxuICAgICAgICBwcml2YXRlIGVkZ2VDb250YWluZXI6IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIHByaXZhdGUgbm9kZUNvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBhcmVhQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcclxuICAgICAgICBwcml2YXRlIHBhdGhDb250YWluZXI6IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIHByaXZhdGUgZ3JpZENvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBzb3VyY2VFbGVtOiBIVE1MRWxlbWVudDtcclxuICAgICAgICBwcml2YXRlIGRlc3RFbGVtOiBIVE1MRWxlbWVudDtcclxuICAgICAgICBwcml2YXRlIG1hcmtFbGVtOiBIVE1MRWxlbWVudDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcGxpY2F0aW9uLCBwcml2YXRlIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmFkZENoYW5nZUxpc3RlbmVyKENoYW5nZVJlYXNvbi5Tb3VyY2VDaGFuZ2UsICgpID0+IHRoaXMucmVuZGVyU291cmNlKCkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uRGVzdGluYXRpb25DaGFuZ2UsICgpID0+IHRoaXMucmVuZGVyRGVzdGluYXRpb24oKSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmFkZENoYW5nZUxpc3RlbmVyKENoYW5nZVJlYXNvbi5NYXJrQ2hhbmdlLCAoKSA9PiB0aGlzLnJlbmRlck1hcmsoKSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmFkZENoYW5nZUxpc3RlbmVyKENoYW5nZVJlYXNvbi5QYXRoVXBkYXRlLCAoKSA9PiB0aGlzLnJlbmRlclBhdGgoKSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmFkZENoYW5nZUxpc3RlbmVyKENoYW5nZVJlYXNvbi5GZWF0dXJlQ2hhbmdlLCAoKSA9PiB0aGlzLnVwZGF0ZUZlYXR1cmVzKCkpO1xyXG5cclxuICAgICAgICAgICAgZWxlbWVudC5vbmNsaWNrID0gZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldEV2ZW50Tm9kZShldik7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyQ29udGV4dE1lbnUoZXYsIG5vZGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgZWxlbWVudC5vbmNvbnRleHRtZW51ID0gZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFldi5zaGlmdEtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyQ29udGV4dE1lbnUoZXYpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnJlbmRlck5vZGVzKCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyUGF0aCgpO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlck1hcmsoKTtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRmVhdHVyZXMoKTtcclxuICAgICAgICAgICAgdGhpcy5pbml0RHJhZ1Njcm9sbCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBnZXRFdmVudE5vZGUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IDxIVE1MRWxlbWVudD5ldmVudC50YXJnZXQ7XHJcbiAgICAgICAgICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwibWFwLW5vZGVcIikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZCA9IHRhcmdldC5kYXRhc2V0W1wibm9kZUlkXCJdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hcHAud29ybGQuZmluZE5vZGVCeUlkKCtpZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHRyaWdnZXJDb250ZXh0TWVudShldjogTW91c2VFdmVudCwgbm9kZT86IE5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5hcHAuY3R4TWVudS5vcGVuKG5ldyBWZWMyKGV2LnBhZ2VYLCBldi5wYWdlWSksIG5vZGUgfHwgdGhpcy5nZXRFdmVudE5vZGUoZXYpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgaW5pdERyYWdTY3JvbGwoKSB7XHJcbiAgICAgICAgICAgIHZhciBpbWcgPSA8SFRNTEVsZW1lbnQ+dGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbWdcIik7XHJcbiAgICAgICAgICAgIHZhciBtb3VzZWRvd24gPSBmYWxzZSwgcHJldlg6IG51bWJlciwgcHJldlk6IG51bWJlcjtcclxuICAgICAgICAgICAgdmFyIHN0b3AgPSAoZXY6IE1vdXNlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIG1vdXNlZG93biA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudG9nZ2xlQm9keUNsYXNzKFwic2Nyb2xsaW5nXCIsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHZhciBzdGFydCA9IChldjogTW91c2VFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbW91c2Vkb3duID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHByZXZYID0gZXYuY2xpZW50WDtcclxuICAgICAgICAgICAgICAgIHByZXZZID0gZXYuY2xpZW50WTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRvZ2dsZUJvZHlDbGFzcyhcInNjcm9sbGluZ1wiLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaW1nLm9ubW91c2Vkb3duID0gZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGV2LmJ1dHRvbiA9PT0gMCAmJiBldi50YXJnZXQgPT09IGltZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0KGV2KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaW1nLm9ubW91c2V1cCA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChtb3VzZWRvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICBzdG9wKGV2KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpbWcub25tb3VzZW1vdmUgPSBldiA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1vdXNlZG93biAmJiBldi53aGljaCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0KGV2KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChtb3VzZWRvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXYud2hpY2ggIT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcChldik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsKHBhZ2VYT2Zmc2V0ICsgcHJldlggLSBldi5jbGllbnRYLCBwYWdlWU9mZnNldCArIHByZXZZIC0gZXYuY2xpZW50WSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZYID0gZXYuY2xpZW50WDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldlkgPSBldi5jbGllbnRZO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgcmVuZGVyTm9kZXMoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5vZGVDb250YWluZXIgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHRoaXMubm9kZUNvbnRhaW5lci5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMubm9kZUNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgIHRoaXMubm9kZUNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLm5vZGVDb250YWluZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC53b3JsZC5ub2Rlc1xyXG4gICAgICAgICAgICAgICAgLy8uY29uY2F0KHRoaXMuYXBwLndvcmxkLmxhbmRtYXJrcy5tYXAobCA9PiBsLnRhcmdldCkpXHJcbiAgICAgICAgICAgICAgICAuZm9yRWFjaChuID0+IHRoaXMubm9kZUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdOb2RlKG4pKSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5lZGdlQ29udGFpbmVyICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVkZ2VDb250YWluZXIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmVkZ2VDb250YWluZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmVkZ2VDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5lZGdlQ29udGFpbmVyKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAud29ybGQuZWRnZXMuZm9yRWFjaChlID0+XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVkZ2VDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kcmF3RWRnZShlLnNyY05vZGUucG9zLCBlLmRlc3ROb2RlLnBvcywgZS5zcmNOb2RlLnR5cGUsIFwibWFwLXRyYW5zcG9ydC1lZGdlXCIpKSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5hcmVhQ29udGFpbmVyICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmFyZWFDb250YWluZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5hcmVhQ29udGFpbmVyKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAud29ybGQuYXJlYXNcclxuICAgICAgICAgICAgICAgIC8vLmNvbmNhdCh0aGlzLmFwcC53b3JsZC5yZWdpb25zKVxyXG4gICAgICAgICAgICAgICAgLy8uY29uY2F0KHRoaXMuYXBwLndvcmxkLmxhbmRtYXJrcylcclxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0eXBlID0gYS50YXJnZXQudHlwZTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJldjogQ2VsbFJvdyA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLnJvd3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvdyA9IGEucm93c1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXYgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvdy54MSAhPT0gcHJldi54MSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXJlYUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdDZWxsRWRnZShyb3cueDEsIHJvdy55LCBwcmV2LngxLCByb3cueSwgdHlwZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvdy54MiAhPT0gcHJldi54Mikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXJlYUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdDZWxsRWRnZShyb3cueDIgKyAxLCByb3cueSwgcHJldi54MiArIDEsIHJvdy55LCB0eXBlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kcmF3Q2VsbEVkZ2Uocm93LngxLCByb3cueSwgcm93LngyICsgMSwgcm93LnksIHR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kcmF3Q2VsbEVkZ2Uocm93LngxLCByb3cueSwgcm93LngxLCByb3cueSArIDEsIHR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcmVhQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZHJhd0NlbGxFZGdlKHJvdy54MiArIDEsIHJvdy55LCByb3cueDIgKyAxLCByb3cueSArIDEsIHR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldiA9IHJvdztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYocHJldiAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kcmF3Q2VsbEVkZ2UocHJldi54MSwgcHJldi55ICsgMSwgcHJldi54MiArIDEsIHByZXYueSArIDEsIHR5cGUpKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBkcmF3Q2VsbEVkZ2UoeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlciwgdHlwZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRyYXdFZGdlKFZlYzIuZnJvbUNlbGwoeDEsIHkxKSwgVmVjMi5mcm9tQ2VsbCh4MiwgeTIpLCB0eXBlLCBcIm1hcC1hcmVhXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSByZW5kZXJQYXRoKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wYXRoQ29udGFpbmVyICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhdGhDb250YWluZXIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLnBhdGhDb250YWluZXIpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHBhdGhOb2RlOiBQYXRoTm9kZSA9IHRoaXMuYXBwLmNvbnRleHQucGF0aEVuZDtcclxuICAgICAgICAgICAgaWYgKHBhdGhOb2RlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGF0aENvbnRhaW5lciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMucGF0aENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnBhdGhDb250YWluZXIpO1xyXG4gICAgICAgICAgICB3aGlsZSAocGF0aE5vZGUgJiYgcGF0aE5vZGUucHJldikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXRoQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZHJhd0VkZ2UocGF0aE5vZGUubm9kZS5wb3MsIHBhdGhOb2RlLnByZXYubm9kZS5wb3MsIFwicGF0aFwiLCBcIm1hcC1cIiArIHBhdGhOb2RlLnByZXZFZGdlLnR5cGUpKTtcclxuICAgICAgICAgICAgICAgIHBhdGhOb2RlID0gcGF0aE5vZGUucHJldjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSByZW5kZXJNYXJrKCkge1xyXG4gICAgICAgICAgICB0aGlzLm1hcmtFbGVtID0gdGhpcy5hZGRPclVwZGF0ZU5vZGVFbGVtKHRoaXMuYXBwLmNvbnRleHQubWFya05vZGUsIHRoaXMubWFya0VsZW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIHJlbmRlclNvdXJjZSgpIHtcclxuICAgICAgICAgICAgdGhpcy5zb3VyY2VFbGVtID0gdGhpcy5hZGRPclVwZGF0ZU5vZGVFbGVtKHRoaXMuYXBwLmNvbnRleHQuc291cmNlTm9kZSwgdGhpcy5zb3VyY2VFbGVtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSByZW5kZXJEZXN0aW5hdGlvbigpIHtcclxuICAgICAgICAgICAgdGhpcy5kZXN0RWxlbSA9IHRoaXMuYWRkT3JVcGRhdGVOb2RlRWxlbSh0aGlzLmFwcC5jb250ZXh0LmRlc3ROb2RlLCB0aGlzLmRlc3RFbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgYWRkT3JVcGRhdGVOb2RlRWxlbShub2RlOiBOb2RlLCBlbGVtOiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICAgICAgaWYgKGVsZW0pXHJcbiAgICAgICAgICAgICAgICBlbGVtLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlICE9IG51bGxcclxuICAgICAgICAgICAgICAgID8gPEhUTUxFbGVtZW50PnRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmRyYXdOb2RlKG5vZGUpKVxyXG4gICAgICAgICAgICAgICAgOiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSByZW5kZXJHcmlkKCkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuZ3JpZENvbnRhaW5lcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ncmlkQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmdyaWRDb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGk6IG51bWJlciwgZWw6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDM3OyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChcIm1hcC1ncmlkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoXCJtYXAtZ3JpZC12XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsLnN0eWxlLmxlZnQgPSAoaSAqIENlbGwud2lkdGggKyBDZWxsLndpZHRoT2Zmc2V0KSArIFwicHhcIjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyaWRDb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDQyOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChcIm1hcC1ncmlkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoXCJtYXAtZ3JpZC1oXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsLnN0eWxlLnRvcCA9IChpICogQ2VsbC5oZWlnaHQgKyBDZWxsLmhlaWdodE9mZnNldCkgKyBcInB4XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkQ29udGFpbmVyLmFwcGVuZENoaWxkKGVsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBzaG93IGdyaWQgY29vcmRpbmF0ZXNcclxuICAgICAgICAgICAgICAgIC8qZm9yIChpID0gMDsgaSA8IDM3OyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDQyOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnRleHRDb250ZW50ID0gaSArICcsJyArIGo7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZS5jb2xvciA9IFwicmdiYSgyNTUsMjU1LDI1NSwwLjc1KVwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZS5sZWZ0ID0gKGkgKiA0NC41ICsgMjIpICsgXCJweFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZS50b3AgPSAoaiAqIDQ0LjYgKyAzNykgKyBcInB4XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnN0eWxlLnpJbmRleCA9IFwiMTBcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc3R5bGUuZm9udCA9IFwiN3B0IHNhbnMtc2VyaWZcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkQ29udGFpbmVyLmFwcGVuZENoaWxkKGVsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9Ki9cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSB1cGRhdGVGZWF0dXJlcygpIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9IFwiXCI7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmZlYXR1cmVzLmZvckVhY2goZiA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZi5oaWRkZW4pXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJoaWRlLVwiICsgZi50eXBlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGRyYXdOb2RlKG5vZGU6IE5vZGUpOiBIVE1MRWxlbWVudCAge1xyXG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcIm1hcC1ub2RlXCIpO1xyXG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJtYXAtXCIgKyBub2RlLnR5cGUpO1xyXG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmxlZnQgPSBub2RlLnBvcy54ICsgXCJweFwiO1xyXG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLnRvcCA9IG5vZGUucG9zLnkgKyBcInB4XCI7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuZGF0YXNldFtcIm5vZGVJZFwiXSA9IChub2RlLnJlZmVyZW5jZUlkIHx8IG5vZGUuaWQpICsgXCJcIjtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGRyYXdFZGdlKG4xOiBWZWMyLCBuMjogVmVjMiwgdHlwZTogc3RyaW5nLCBzdWJ0eXBlPzogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xyXG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcIm1hcC1lZGdlXCIpO1xyXG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJtYXAtXCIgKyB0eXBlKTtcclxuICAgICAgICAgICAgaWYgKHN1YnR5cGUpXHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoc3VidHlwZSk7XHJcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBuMS5kaXN0YW5jZShuMik7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9ICgobjEueCArIG4yLngpIC8gMikgLSAobGVuZ3RoIC8gMikgKyBcInB4XCI7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUudG9wID0gKChuMS55ICsgbjIueSkgLyAyKSAtIDEgKyBcInB4XCI7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUud2lkdGggPSBsZW5ndGggKyBcInB4XCI7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gYHJvdGF0ZSgke01hdGguYXRhbjIobjEueSAtIG4yLnksIG4xLnggLSBuMi54KX1yYWQpYDtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwibW9kdWxlIFRlc3Age1xyXG4gICAgZXhwb3J0IGNsYXNzIE1lbnVJdGVtIHtcclxuICAgICAgICBzdGF0aWMgc2VwYXJhdG9yID0gbmV3IE1lbnVJdGVtKFwiXCIpO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbGFiZWw6IHN0cmluZywgcHVibGljIGZ1bmM/OiAoKSA9PiB2b2lkKSB7IH1cclxuICAgIH1cclxuICAgIGV4cG9ydCBjbGFzcyBNZW51IHtcclxuICAgICAgICBlbGVtZW50OiBIVE1MRWxlbWVudDtcclxuXHJcbiAgICAgICAgcHJpdmF0ZSBsaXN0ZW5lcjogQ2hhbmdlTGlzdGVuZXI7XHJcbiAgICAgICAgcHJpdmF0ZSBkaXNwb3NlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwbGljYXRpb24sIGZpeGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIgPSB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uQ2xlYXJNZW51cywgKCkgPT4gdGhpcy5oaWRlKCkpO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSBcIm1lbnVcIjtcclxuICAgICAgICAgICAgaWYgKGZpeGVkKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJmaXhlZFwiKTtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lm9ubW91c2Vkb3duID0gZXYgPT4gZXYuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5lbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGlzcG9zZWQpIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy5hcHAucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5saXN0ZW5lcik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0U3R5bGUoKTogQ1NTU3R5bGVEZWNsYXJhdGlvbiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRpc3Bvc2VkID8gbnVsbCA6IHRoaXMuZWxlbWVudC5zdHlsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldERhdGEoaXRlbXM6IE1lbnVJdGVtW10pIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGlzcG9zZWQpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xyXG4gICAgICAgICAgICB2YXIgY2hpbGQ6IEVsZW1lbnQ7XHJcbiAgICAgICAgICAgIHdoaWxlICgoY2hpbGQgPSB0aGlzLmVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQpICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5yZW1vdmVDaGlsZChjaGlsZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQobGkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gPT09IE1lbnVJdGVtLnNlcGFyYXRvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpLmNsYXNzTmFtZSA9IFwic2VwYXJhdG9yXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpLnRleHRDb250ZW50ID0gaXRlbS5sYWJlbDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5mdW5jICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGkuY2xhc3NOYW1lID0gXCJsaW5rXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpLm9ubW91c2Vkb3duID0gZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmZ1bmMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvcGVuKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5kaXNwb3NlZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5DbGVhck1lbnVzKTtcclxuICAgICAgICAgICAgaWYodGhpcy5lbGVtZW50LmZpcnN0RWxlbWVudENoaWxkICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwiaW5oZXJpdFwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBoaWRlKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5kaXNwb3NlZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIm1vZHVsZSBUZXNwIHtcclxuICAgIGV4cG9ydCBjbGFzcyBQYXRoRWRnZSB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIHRhcmdldDogUGF0aE5vZGUsIHB1YmxpYyBjb3N0OiBudW1iZXIsIHB1YmxpYyB0eXBlOiBzdHJpbmcpIHsgfVxyXG4gICAgfVxyXG4gICAgZXhwb3J0IGNsYXNzIFBhdGhOb2RlIHtcclxuICAgICAgICBkaXN0OiBudW1iZXI7XHJcbiAgICAgICAgcHJldjogUGF0aE5vZGU7XHJcbiAgICAgICAgcHJldkVkZ2U6IFBhdGhFZGdlO1xyXG4gICAgICAgIGVkZ2VzOiBQYXRoRWRnZVtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbm9kZTogTm9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLmRpc3QgPSBJbmZpbml0eTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFBhdGgge1xyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIHNwZWxsQ29zdDogbnVtYmVyID0gNTtcclxuXHJcbiAgICAgICAgc3RhdGljIGZpbmRQYXRoKGFwcDogQXBwbGljYXRpb24pIHtcclxuICAgICAgICAgICAgdmFyIHdvcmxkID0gYXBwLndvcmxkO1xyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IGFwcC5jb250ZXh0O1xyXG5cclxuICAgICAgICAgICAgLy8gY3JlYXRlIG5vZGVzXHJcbiAgICAgICAgICAgIHZhciBub2RlTWFwOiB7IFtrZXk6IG51bWJlcl06IFBhdGhOb2RlIH0gPSB7fTtcclxuICAgICAgICAgICAgdmFyIGZlYXRzID0gYXBwLmZlYXR1cmVzLmJ5TmFtZTtcclxuICAgICAgICAgICAgdmFyIG5vZGVzOiBQYXRoTm9kZVtdID0gd29ybGQubm9kZXNcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIobiA9PiAhZmVhdHNbbi50eXBlXS5kaXNhYmxlZCAmJiBuICE9PSBjb250ZXh0LnNvdXJjZU5vZGUgJiYgbiAhPT0gY29udGV4dC5kZXN0Tm9kZSlcclxuICAgICAgICAgICAgICAgIC5tYXAobiA9PiBub2RlTWFwW24uaWRdID0gbmV3IFBhdGhOb2RlKG4pKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBuZXcgUGF0aE5vZGUoY29udGV4dC5zb3VyY2VOb2RlKTtcclxuICAgICAgICAgICAgc291cmNlLmRpc3QgPSAwO1xyXG4gICAgICAgICAgICBub2Rlcy5wdXNoKHNvdXJjZSk7XHJcbiAgICAgICAgICAgIG5vZGVNYXBbY29udGV4dC5zb3VyY2VOb2RlLmlkXSA9IHNvdXJjZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkZXN0ID0gbmV3IFBhdGhOb2RlKGNvbnRleHQuZGVzdE5vZGUpO1xyXG4gICAgICAgICAgICBub2Rlcy5wdXNoKGRlc3QpO1xyXG4gICAgICAgICAgICBub2RlTWFwW2NvbnRleHQuZGVzdE5vZGUuaWRdID0gZGVzdDtcclxuXHJcbiAgICAgICAgICAgIHZhciBtYXhDb3N0ID0gY29udGV4dC5zb3VyY2VOb2RlLnBvcy5kaXN0YW5jZShjb250ZXh0LmRlc3ROb2RlLnBvcyk7XHJcblxyXG4gICAgICAgICAgICAvLyBleHBsaWNpdCBlZGdlcyAoc2VydmljZXMpXHJcbiAgICAgICAgICAgIG5vZGVzLmZvckVhY2gobiA9PlxyXG4gICAgICAgICAgICAgICAgbi5lZGdlcyA9IG4ubm9kZS5lZGdlc1xyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoZSA9PiAhZmVhdHNbZS5zcmNOb2RlLnR5cGVdLmRpc2FibGVkKVxyXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoZSA9PiBuZXcgUGF0aEVkZ2Uobm9kZU1hcFsoZS5zcmNOb2RlID09PSBuLm5vZGUgPyBlLmRlc3ROb2RlIDogZS5zcmNOb2RlKS5pZF0sIGUuY29zdCwgbi5ub2RlLnR5cGUpKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBpbXBsaWNpdCBlZGdlcyAod2Fsa2luZylcclxuICAgICAgICAgICAgbm9kZXMuZm9yRWFjaChuID0+XHJcbiAgICAgICAgICAgICAgICBuLmVkZ2VzID0gbi5lZGdlcy5jb25jYXQobm9kZXNcclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKG4yID0+IG4yICE9PSBuICYmICFuLmVkZ2VzLnNvbWUoZSA9PiBlLnRhcmdldCA9PT0gbjIpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5tYXAobjIgPT4gbmV3IFBhdGhFZGdlKG4yLCBuLm5vZGUucG9zLmRpc3RhbmNlKG4yLm5vZGUucG9zKSwgXCJ3YWxrXCIpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoZSA9PiBlLmNvc3QgPD0gbWF4Q29zdCkpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIG1hcmtcclxuICAgICAgICAgICAgaWYgKGNvbnRleHQubWFya05vZGUgIT0gbnVsbCAmJiAhZmVhdHNbXCJtYXJrXCJdLmRpc2FibGVkKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbW4gPSBuZXcgUGF0aE5vZGUoY29udGV4dC5tYXJrTm9kZSk7XHJcbiAgICAgICAgICAgICAgICBtbi5lZGdlcyA9IG5vZGVzLmZpbHRlcihuID0+IG4gIT09IHNvdXJjZSlcclxuICAgICAgICAgICAgICAgICAgICAubWFwKG4gPT4gbmV3IFBhdGhFZGdlKG4sIG1uLm5vZGUucG9zLmRpc3RhbmNlKG4ubm9kZS5wb3MpLCBcIndhbGtcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihlID0+IGUuY29zdCA8IG1heENvc3QpO1xyXG4gICAgICAgICAgICAgICAgc291cmNlLmVkZ2VzLnB1c2gobmV3IFBhdGhFZGdlKG1uLCBQYXRoLnNwZWxsQ29zdCwgXCJtYXJrXCIpKTtcclxuICAgICAgICAgICAgICAgIG5vZGVzLnB1c2gobW4pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBpbnRlcnZlbnRpb25cclxuICAgICAgICAgICAgbm9kZXMuZm9yRWFjaChuID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBjZWxsID0gQ2VsbC5mcm9tUG9zaXRpb24obi5ub2RlLnBvcyk7XHJcbiAgICAgICAgICAgICAgICB3b3JsZC5hcmVhcy5mb3JFYWNoKGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZmVhdHNbYS50YXJnZXQudHlwZV0uZGlzYWJsZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGEuY29udGFpbnNDZWxsKGNlbGwpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBub2RlIGluc2lkZSBhcmVhLCB0ZWxlcG9ydCB0byB0ZW1wbGUvc2hyaW5lXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuLmVkZ2VzLnB1c2gobmV3IFBhdGhFZGdlKG5vZGVNYXBbYS50YXJnZXQuaWRdLCBQYXRoLnNwZWxsQ29zdCwgYS50YXJnZXQudHlwZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm9kZSBvdXRzaWRlIGFyZWEsIHdhbGsgdG8gZWRnZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRpc3Q6IG51bWJlciA9IEluZmluaXR5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNsb3Nlc3Q6IFZlYzI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhLnJvd3MuZm9yRWFjaChyID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2IGlzIGNsb3Nlc3QgcG9pbnQgKGluIGNlbGwgdW5pdHMpIGZyb20gbm9kZSB0byByb3dcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IG5ldyBWZWMyKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1heChNYXRoLm1pbihjZWxsLngsIHIueDEgKyByLndpZHRoKSwgci54MSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KE1hdGgubWluKGNlbGwueSwgci55ICsgMSksIHIueSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbHQgPSBjZWxsLmRpc3RhbmNlKHYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbHQgPCBkaXN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3QgPSBhbHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb3Nlc3QgPSB2O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBvcyA9IFZlYzIuZnJvbUNlbGwoY2xvc2VzdC54LCBjbG9zZXN0LnkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvc3QgPSBuLm5vZGUucG9zLmRpc3RhbmNlKHBvcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29zdCA8IG1heENvc3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuZXcgbm9kZSB0byBhbGxvdyB1cyB0byB0ZWxlcG9ydCBvbmNlIHdlJ3JlIGluIHRoZSBhcmVhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZlYXQgPSBhcHAuZmVhdHVyZXMuYnlOYW1lW2EudGFyZ2V0LnR5cGVdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gYCR7ZmVhdC5uYW1lfSByYW5nZSBvZiAke2EudGFyZ2V0Lm5hbWV9YDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYW4gPSBuZXcgUGF0aE5vZGUobmV3IE5vZGUobmFtZSwgbmFtZSwgcG9zLCBcImFyZWFcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuLmVkZ2VzID0gW25ldyBQYXRoRWRnZShub2RlTWFwW2EudGFyZ2V0LmlkXSwgUGF0aC5zcGVsbENvc3QsIGEudGFyZ2V0LnR5cGUpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2Rlcy5wdXNoKGFuKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuLmVkZ2VzLnB1c2gobmV3IFBhdGhFZGdlKGFuLCBjb3N0LCBcIndhbGtcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmFyIHE6IFBhdGhOb2RlW10gPSBub2Rlcy5zbGljZSgpO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKHEubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgcS5zb3J0KChhLCBiKSA9PiBiLmRpc3QgLSBhLmRpc3QpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHUgPSBxLnBvcCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdS5lZGdlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBlID0gdS5lZGdlc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IGUudGFyZ2V0O1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhbHQgPSB1LmRpc3QgKyBlLmNvc3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFsdCA8IHYuZGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2LmRpc3QgPSBhbHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHYucHJldiA9IHU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHYucHJldkVkZ2UgPSBlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwibW9kdWxlIFRlc3Age1xyXG4gICAgZXhwb3J0IHR5cGUgVHJhbnNwb3J0U291cmNlID0geyBba2V5OiBzdHJpbmddOiBJTm9kZVNvdXJjZVtdIH07XHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElXb3JsZFNvdXJjZSB7XHJcbiAgICAgICAgdHJhbnNwb3J0OiBUcmFuc3BvcnRTb3VyY2U7XHJcbiAgICAgICAgcmVnaW9uczogSU5vZGVTb3VyY2VbXTtcclxuICAgICAgICBsYW5kbWFya3M6IElOb2RlU291cmNlW107XHJcbiAgICB9XHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElOb2RlU291cmNlIHtcclxuICAgICAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgeDogbnVtYmVyO1xyXG4gICAgICAgIHk6IG51bWJlcjtcclxuICAgICAgICBlZGdlczogbnVtYmVyW107XHJcbiAgICAgICAgb25lV2F5RWRnZXM6IG51bWJlcltdO1xyXG4gICAgICAgIHRvcDogbnVtYmVyO1xyXG4gICAgICAgIGNlbGxzOiBudW1iZXJbXVtdO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBTdGF0aWMgYXNzZXRzIGFuZCBsb2NhdGlvbnMgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBXb3JsZCB7XHJcbiAgICAgICAgbm9kZXM6IE5vZGVbXTtcclxuICAgICAgICBlZGdlczogRWRnZVtdO1xyXG4gICAgICAgIGFyZWFzOiBBcmVhW107XHJcbiAgICAgICAgcmVnaW9uczogQXJlYVtdO1xyXG4gICAgICAgIGxhbmRtYXJrczogQXJlYVtdO1xyXG5cclxuICAgICAgICBwcml2YXRlIG5vZGVzQnlJZDogeyBba2V5OiBudW1iZXJdOiBOb2RlIH0gPSB7fTtcclxuICAgICAgICBwcml2YXRlIHN0YXRpYyB0cmFuc3BvcnRDb3N0OiBudW1iZXIgPSAxMDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcGxpY2F0aW9uLCBkYXRhOiBJV29ybGRTb3VyY2UpIHtcclxuICAgICAgICAgICAgdGhpcy5ub2RlcyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLmVkZ2VzID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuYXJlYXMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGRhdGEudHJhbnNwb3J0KS5mb3JFYWNoKGsgPT4gdGhpcy5sb2FkVHJhbnNwb3J0KGRhdGEudHJhbnNwb3J0LCBrKSk7XHJcbiAgICAgICAgICAgIHRoaXMucmVnaW9ucyA9IGRhdGEucmVnaW9ucy5tYXAoYSA9PiBXb3JsZC5tYWtlQXJlYShuZXcgTm9kZShhLm5hbWUsIGEubmFtZSwgbmV3IFZlYzIoMCwgMCksIFwicmVnaW9uXCIpLCBhKSk7XHJcbiAgICAgICAgICAgIHRoaXMubGFuZG1hcmtzID0gZGF0YS5sYW5kbWFya3MubWFwKGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSBuZXcgTm9kZShhLm5hbWUsIGEubmFtZSwgbmV3IFZlYzIoMCwgMCksIFwibGFuZG1hcmtcIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJlYSA9IFdvcmxkLm1ha2VBcmVhKG5vZGUsIGEpO1xyXG4gICAgICAgICAgICAgICAgLy8gc2V0IG5vZGUgbG9jYXRpb24gdG8gYXZlcmFnZSBjZW50ZXIgcG9pbnQgb2YgYWxsIGNlbGxzXHJcbiAgICAgICAgICAgICAgICB2YXIgc3VtWDogbnVtYmVyID0gMDtcclxuICAgICAgICAgICAgICAgIHZhciBzdW1ZOiBudW1iZXIgPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvdW50OiBudW1iZXIgPSAwO1xyXG4gICAgICAgICAgICAgICAgYXJlYS5yb3dzLmZvckVhY2gociA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VtWCArPSAoci54MSArIHIud2lkdGggLyAyKSAqIHIud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VtWSArPSAoci55ICsgMC41KSAqIHIud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgY291bnQgKz0gci53aWR0aDtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgbm9kZS5wb3MgPSBWZWMyLmZyb21DZWxsKHN1bVggLyBjb3VudCwgc3VtWSAvIGNvdW50KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhcmVhO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIGluZGV4IGJ5IGlkXHJcbiAgICAgICAgICAgIHRoaXMubm9kZXNCeUlkID0ge307XHJcbiAgICAgICAgICAgIHRoaXMubm9kZXMuZm9yRWFjaChuID0+IHRoaXMubm9kZXNCeUlkW24uaWRdID0gbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsb2FkVHJhbnNwb3J0KGRhdGE6IFRyYW5zcG9ydFNvdXJjZSwgdHlwZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnJheTogSU5vZGVTb3VyY2VbXSA9IGRhdGFbdHlwZV07XHJcbiAgICAgICAgICAgIHZhciBmZWF0ID0gdGhpcy5hcHAuZmVhdHVyZXMuYnlOYW1lW3R5cGVdO1xyXG4gICAgICAgICAgICB2YXIgdHlwZU5hbWUgPSBmZWF0LmxvY2F0aW9uIHx8IGZlYXQubmFtZTtcclxuICAgICAgICAgICAgdmFyIG5vZGVzOiBOb2RlW10gPSBhcnJheS5tYXAobiA9PiBuZXcgTm9kZShuLm5hbWUsIGAke3R5cGVOYW1lfSwgJHtuLm5hbWV9YCwgbmV3IFZlYzIobi54LCBuLnkpLCB0eXBlLCB0cnVlKSk7XHJcbiAgICAgICAgICAgIHRoaXMubm9kZXMgPSB0aGlzLm5vZGVzLmNvbmNhdChub2Rlcyk7XHJcbiAgICAgICAgICAgIHZhciBjb3N0ID0gV29ybGQudHJhbnNwb3J0Q29zdDtcclxuICAgICAgICAgICAgYXJyYXkuZm9yRWFjaCgobiwgaTEpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBuMSA9IG5vZGVzW2kxXTtcclxuICAgICAgICAgICAgICAgIGlmIChuLmVkZ2VzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbi5lZGdlcy5mb3JFYWNoKGkyID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG4yID0gbm9kZXNbaTJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWRnZSA9IG5ldyBFZGdlKG4xLCBuMiwgY29zdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG4xLmVkZ2VzLnB1c2goZWRnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG4yLmVkZ2VzLnB1c2goZWRnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZWRnZXMucHVzaChlZGdlKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChuLm9uZVdheUVkZ2VzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbi5vbmVXYXlFZGdlcy5mb3JFYWNoKGkyID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVkZ2UgPSBuZXcgRWRnZShuMSwgbm9kZXNbaTJdLCBjb3N0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbjEuZWRnZXMucHVzaChlZGdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGdlcy5wdXNoKGVkZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKG4uY2VsbHMpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFyZWFzLnB1c2goV29ybGQubWFrZUFyZWEobjEsIG4pKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyBtYWtlQXJlYShub2RlOiBOb2RlLCBkYXRhOiBJTm9kZVNvdXJjZSkge1xyXG4gICAgICAgICAgICB2YXIgeSA9IGRhdGEudG9wIHx8IDA7XHJcbiAgICAgICAgICAgIHZhciByb3dzID0gZGF0YS5jZWxscy5tYXAoYyA9PiBuZXcgQ2VsbFJvdyh5KyssIGNbMF0sIGNbMV0pKTtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBBcmVhKG5vZGUsIHJvd3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmluZE5vZGVCeUlkKGlkOiBudW1iZXIpOiBOb2RlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubm9kZXNCeUlkW2lkXSB8fCBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0UmVnaW9uTmFtZShwb3M6IFZlYzIpOiBzdHJpbmcge1xyXG4gICAgICAgICAgICB2YXIgYXJlYSA9IFdvcmxkLmdldEFyZWFCeUNlbGwodGhpcy5yZWdpb25zLCBDZWxsLmZyb21Qb3NpdGlvbihwb3MpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZWEgIT0gbnVsbCA/IGFyZWEudGFyZ2V0Lm5hbWUgOiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBnZXRMYW5kbWFya05hbWUocG9zOiBWZWMyKTogc3RyaW5nIHtcclxuICAgICAgICAgICAgdmFyIGFyZWEgPSBXb3JsZC5nZXRBcmVhQnlDZWxsKHRoaXMubGFuZG1hcmtzLCBDZWxsLmZyb21Qb3NpdGlvbihwb3MpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZWEgIT0gbnVsbCA/IGFyZWEudGFyZ2V0Lm5hbWUgOiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyBnZXRBcmVhQnlDZWxsKHNvdXJjZTogQXJlYVtdLCBjZWxsOiBWZWMyKTogQXJlYSB7XHJcbiAgICAgICAgICAgIHZhciBhcmVhOiBBcmVhO1xyXG4gICAgICAgICAgICBpZiAoc291cmNlLnNvbWUociA9PiByLmNvbnRhaW5zQ2VsbChjZWxsKSAmJiAoYXJlYSA9IHIpICE9IG51bGwpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyZWE7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSJdLCJzb3VyY2VSb290IjoiLi4vdHMifQ==