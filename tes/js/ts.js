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
            this.app.addChangeListener(Tesp.ChangeReason.ContextChange | Tesp.ChangeReason.MarkChange | Tesp.ChangeReason.FeatureChange, function (reason) {
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
            element.querySelector(".features-icon").onclick = function () {
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
                    .filter(function (e) { return !feats[e.destNode.type].disabled; })
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC50cyIsImNvbW1vbi50cyIsImNvbnRleHQudHMiLCJjb250ZXh0bWVudS50cyIsImNvbnRyb2xzLnRzIiwiZmVhdHVyZXMudHMiLCJtYXAudHMiLCJtZW51LnRzIiwicGF0aC50cyIsIndvcmxkLnRzIl0sIm5hbWVzIjpbIlRlc3AiLCJUZXNwLkNoYW5nZVJlYXNvbiIsIlRlc3AuQ2hhbmdlTGlzdGVuZXIiLCJUZXNwLkNoYW5nZUxpc3RlbmVyLmNvbnN0cnVjdG9yIiwiVGVzcC5DaGFuZ2VMaXN0ZW5lci50cmlnZ2VyIiwiVGVzcC5BcHBsaWNhdGlvbiIsIlRlc3AuQXBwbGljYXRpb24uY29uc3RydWN0b3IiLCJUZXNwLkFwcGxpY2F0aW9uLmFkZENoYW5nZUxpc3RlbmVyIiwiVGVzcC5BcHBsaWNhdGlvbi5yZW1vdmVDaGFuZ2VMaXN0ZW5lciIsIlRlc3AuQXBwbGljYXRpb24udHJpZ2dlckNoYW5nZSIsIlRlc3AuQXBwbGljYXRpb24udG9nZ2xlQm9keUNsYXNzIiwiVGVzcC5WZWMyIiwiVGVzcC5WZWMyLmNvbnN0cnVjdG9yIiwiVGVzcC5WZWMyLmRpc3RhbmNlIiwiVGVzcC5WZWMyLmZyb21DZWxsIiwiVGVzcC5Ob2RlIiwiVGVzcC5Ob2RlLmNvbnN0cnVjdG9yIiwiVGVzcC5FZGdlIiwiVGVzcC5FZGdlLmNvbnN0cnVjdG9yIiwiVGVzcC5DZWxsIiwiVGVzcC5DZWxsLmNvbnN0cnVjdG9yIiwiVGVzcC5DZWxsLmZyb21Qb3NpdGlvbiIsIlRlc3AuQ2VsbFJvdyIsIlRlc3AuQ2VsbFJvdy5jb25zdHJ1Y3RvciIsIlRlc3AuQXJlYSIsIlRlc3AuQXJlYS5jb25zdHJ1Y3RvciIsIlRlc3AuQXJlYS5jb250YWluc0NlbGwiLCJUZXNwLkNvbnRleHQiLCJUZXNwLkNvbnRleHQuY29uc3RydWN0b3IiLCJUZXNwLkNvbnRleHQuc2V0Q29udGV4dExvY2F0aW9uIiwiVGVzcC5Db250ZXh0LnNldENvbnRleHROb2RlIiwiVGVzcC5Db250ZXh0LmNsZWFyQ29udGV4dCIsIlRlc3AuQ29udGV4dC5maW5kUGF0aCIsIlRlc3AuQ29udGV4dE1lbnUiLCJUZXNwLkNvbnRleHRNZW51LmNvbnN0cnVjdG9yIiwiVGVzcC5Db250ZXh0TWVudS5zZXRDb250ZXh0IiwiVGVzcC5Db250ZXh0TWVudS5vcGVuTm9kZSIsIlRlc3AuQ29udGV4dE1lbnUub3BlbiIsIlRlc3AuQ29udGV4dE1lbnUuaGlkZSIsIlRlc3AuQ29udHJvbHMiLCJUZXNwLkNvbnRyb2xzLmNvbnN0cnVjdG9yIiwiVGVzcC5Db250cm9scy5pbml0U2VhcmNoIiwiVGVzcC5Db250cm9scy5pbml0U2VhcmNoLnByZXBUZXJtIiwiVGVzcC5Db250cm9scy5jbGVhclNlYXJjaCIsIlRlc3AuQ29udHJvbHMudXBkYXRlTm9kZUluZm8iLCJUZXNwLkNvbnRyb2xzLnVwZGF0ZVBhdGgiLCJUZXNwLkNvbnRyb2xzLmRyYXdQYXRoTm9kZSIsIlRlc3AuQ29udHJvbHMuZHJhd0ZlYXR1cmVzIiwiVGVzcC5Db250cm9scy5kcmF3Q2hlY2tib3giLCJUZXNwLkZlYXR1cmUiLCJUZXNwLkZlYXR1cmUuY29uc3RydWN0b3IiLCJUZXNwLkZlYXR1cmVzIiwiVGVzcC5GZWF0dXJlcy5jb25zdHJ1Y3RvciIsIlRlc3AuRmVhdHVyZXMuaW5pdCIsIlRlc3AuTWFwIiwiVGVzcC5NYXAuY29uc3RydWN0b3IiLCJUZXNwLk1hcC5nZXRFdmVudE5vZGUiLCJUZXNwLk1hcC50cmlnZ2VyQ29udGV4dE1lbnUiLCJUZXNwLk1hcC5pbml0RHJhZ1Njcm9sbCIsIlRlc3AuTWFwLnJlbmRlck5vZGVzIiwiVGVzcC5NYXAuZHJhd0NlbGxFZGdlIiwiVGVzcC5NYXAucmVuZGVyUGF0aCIsIlRlc3AuTWFwLnJlbmRlck1hcmsiLCJUZXNwLk1hcC5yZW5kZXJTb3VyY2UiLCJUZXNwLk1hcC5yZW5kZXJEZXN0aW5hdGlvbiIsIlRlc3AuTWFwLmFkZE9yVXBkYXRlTm9kZUVsZW0iLCJUZXNwLk1hcC5yZW5kZXJHcmlkIiwiVGVzcC5NYXAudXBkYXRlRmVhdHVyZXMiLCJUZXNwLk1hcC5kcmF3Tm9kZSIsIlRlc3AuTWFwLmRyYXdFZGdlIiwiVGVzcC5NZW51SXRlbSIsIlRlc3AuTWVudUl0ZW0uY29uc3RydWN0b3IiLCJUZXNwLk1lbnUiLCJUZXNwLk1lbnUuY29uc3RydWN0b3IiLCJUZXNwLk1lbnUuZGlzcG9zZSIsIlRlc3AuTWVudS5nZXRTdHlsZSIsIlRlc3AuTWVudS5zZXREYXRhIiwiVGVzcC5NZW51Lm9wZW4iLCJUZXNwLk1lbnUuaGlkZSIsIlRlc3AuUGF0aEVkZ2UiLCJUZXNwLlBhdGhFZGdlLmNvbnN0cnVjdG9yIiwiVGVzcC5QYXRoTm9kZSIsIlRlc3AuUGF0aE5vZGUuY29uc3RydWN0b3IiLCJUZXNwLlBhdGgiLCJUZXNwLlBhdGguY29uc3RydWN0b3IiLCJUZXNwLlBhdGguZmluZFBhdGgiLCJUZXNwLldvcmxkIiwiVGVzcC5Xb3JsZC5jb25zdHJ1Y3RvciIsIlRlc3AuV29ybGQubG9hZFRyYW5zcG9ydCIsIlRlc3AuV29ybGQubWFrZUFyZWEiLCJUZXNwLldvcmxkLmZpbmROb2RlQnlJZCIsIlRlc3AuV29ybGQuZ2V0UmVnaW9uTmFtZSIsIlRlc3AuV29ybGQuZ2V0TGFuZG1hcmtOYW1lIiwiVGVzcC5Xb3JsZC5nZXRBcmVhQnlDZWxsIl0sIm1hcHBpbmdzIjoiQUFBQSxBQUVBLHNEQUZzRDtBQUN0RCx3REFBd0Q7QUFDeEQsSUFBTyxJQUFJLENBeUZWO0FBekZELFdBQU8sSUFBSSxFQUFDLENBQUM7SUFFVEEsV0FBWUEsWUFBWUE7UUFDcEJDLCtDQUFVQSxDQUFBQTtRQUVWQSwrREFBa0JBLENBQUFBO1FBRWxCQSx5RUFBdUJBLENBQUFBO1FBRXZCQSwyREFBZ0JBLENBQUFBO1FBRWhCQSxpRUFBNkRBLENBQUFBO1FBRTdEQSxpRUFBbUJBLENBQUFBO1FBRW5CQSw0REFBaUJBLENBQUFBO1FBRWpCQSw0REFBaUJBLENBQUFBO1FBQ2pCQSw4Q0FBVUEsQ0FBQUE7SUFDZEEsQ0FBQ0EsRUFqQldELGlCQUFZQSxLQUFaQSxpQkFB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LElBQUlBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLGVBQWVBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLGFBQWFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3BGQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxLQUFLQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDdkJBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLEtBQUtBLENBQUNBO2dCQUNyQkEsSUFBSUEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsT0FBT0EsRUFBRUEsSUFBSUEsU0FBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsR0FBR0EsRUFBRUEsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdEVBLENBQUNBO1lBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLEtBQUtBLGFBQWFBLENBQUNBLENBQUNBLENBQUNBO2dCQUNuQ0EsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsa0JBQWtCQSxDQUFDQTtnQkFDbENBLElBQUlBLENBQUNBLGNBQWNBLENBQUNBLE9BQU9BLEVBQUVBLElBQUlBLFNBQUlBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLEVBQUVBLEdBQUdBLEVBQUVBLGFBQWFBLENBQUNBLENBQUNBLENBQUNBO1lBQzNFQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxLQUFLQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDNUJBLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLElBQUlBLFNBQUlBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLEVBQUVBLEdBQUdBLEVBQUVBLE1BQU1BLENBQUNBLENBQUNBO2dCQUNsREEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsaUJBQVlBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1lBQ3BEQSxDQUFD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Q3JEQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxJQUFJQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDbENBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBO29CQUNoQkEsQ0FBQ0E7Z0JBQ0xBLENBQUNBO1lBQ0xBLENBQUNBO1lBRURBLElBQUlBLEtBQUtBLEdBQWFBLEVBQUVBLENBQUNBO1lBQ3pCQSxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxlQUFlQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNuREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2ZBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLFFBQVFBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO2dCQUMvQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2ZBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO29CQUN2Q0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQzFCQSxDQUFDQTtnQkFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7b0JBQ0pBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO2dCQUM5QkEsQ0FBQ0E7Z0JBQ0RBLEVBQUVBLENBQUNBLENBQUNBLFFBQVFBLElBQUlBLElBQUlBLElBQUlBLFFBQVFBLEtBQUtBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO29CQUM3Q0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3pCQSxDQUFDQTtnQkFDREEsR0FBR0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0E7WUFDbkJBLENBQUNBO1lBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLFFBQVFBLElBQUlBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO2dCQUMxQkEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7WUFDekJBLENBQUNBO1lBQ0RBLElBQUlBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLGFBQWFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQy9DQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxJQUFJQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDakJBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLFNBQVNBLENBQUNBLENBQUNBO1lBQ25DQSxDQUFDQTtZQUVEQSxJQUFJQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUNmQSxJQUFJQSxDQUFDQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUVqQkEsSUFBSUEsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBQUEsQ0FBQ0EsSUFBSUEsT0FBQUEsSUFBSUEsYUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBZkEsQ0FBZUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFDL0RBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLFFBQVFBLElBQUlBLElBQUlBLENBQUNBO2dCQUNsQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7WUFDaENBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1lBQ3pCQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtZQUVqQkEsSUFBSUEsU0FBU0EsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsRUFBRUEsQ0FBQ0E7WUFDckNBLFNBQVNBLENBQUNBLElBQUlBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBO1lBQzlCQSxTQUFTQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUU3QkEsSUFBSUEsT0FBT0EsR0FBR0EsV0FBV0EsQ0FBQ0E7WUFDMUJBLElBQUlBLE9BQU9BLEdBQUdBLFdBQVdBLENBQUNBO1lBQzFCQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxxQkFBcUJBLEVBQUVBLENBQUNBO1lBQ3JEQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDakJBLE9BQU9BLEdBQUdBLFdBQVdBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLEVBQUVBLENBQUNBO1lBQzNDQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxVQUFVQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDdENBLE9BQU9BLEdBQUdBLFdBQVdBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLFVBQVVBLEdBQUdBLEVBQUVBLENBQUNBO1lBQ3pEQSxDQUFDQTtZQUVEQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDaEJBLE9BQU9BLEdBQUdBLFdBQVdBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLEdBQUdBLEVBQUVBLENBQUNB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LENBQUNBO29CQUNSQSxLQUFLQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxVQUFBQSxDQUFDQSxJQUFJQSxPQUFBQSxNQUFNQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFuQkEsQ0FBbUJBLENBQUNBLENBQUNBLENBQUNBO2dCQUMvREEsQ0FBQ0E7Z0JBRURBLElBQUlBLE9BQU9BLEdBQUdBLFdBQVdBO3FCQUNwQkEsTUFBTUEsQ0FBQ0EsVUFBQUEsQ0FBQ0E7b0JBQ0xBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO29CQUNWQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFBQSxDQUFDQTt3QkFDZkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBQUEsRUFBRUEsSUFBSUEsT0FBQUEsRUFBRUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsRUFBbkJBLENBQW1CQSxDQUFDQSxDQUFDQTs0QkFDOUNBLENBQUNBLEVBQUVBLENBQUNBO3dCQUNSQSxNQUFNQSxDQUFDQSxDQUFDQSxJQUFJQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQTtvQkFDOUJBLENBQUNBLENBQUNBLENBQUNBO2dCQUNQQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFFUEEsS0FBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBQUEsQ0FBQ0E7MkJBQ2pDQSxJQUFJQSxhQUFRQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQTt3QkFDN0JBLEtBQUlBLENBQUNBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO3dCQUNsQ0EsS0FBSUEsQ0FBQ0EsV0FBV0EsRUFB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QSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtZQUNsQ0EsT0FBT0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDckNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBO2dCQUNSQSxPQUFPQSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUNuQ0EsSUFBSUEsTUFBTUEsR0FBR0EsRUFBRUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFDN0JBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBO1lBQy9EQSxPQUFPQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUNuREEsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsR0FBR0EsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0E7WUFDcENBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLFNBQVNBLEdBQUdBLFlBQVVBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLFNBQU1BLENBQUNBO1lBQy9FQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQTtRQUNuQkEsQ0FBQ0E7UUFDTGYsVUFBQ0E7SUFBREEsQ0E1UEF0RCxBQTRQQ3NELElBQUF0RDtJQTVQWUEsUUFBR0EsTUE0UGZBLENBQUFBO0FBQ0xBLENBQUNBLEVBL1BNLElBQUksS0FBSixJQUFJLFFBK1BWO0FDL1BELElBQU8sSUFBSSxDQXVFVjtBQXZFRCxXQUFPLElBQUksRUFBQyxDQUFDO0lBQ1RBO1FBR0lzRSxrQkFBbUJBLEtBQWFBLEVBQVNBLElBQWlCQTtZQUF2Q0MsVUFBS0EsR0FBTEEsS0FBS0EsQ0FBUUE7WUFBU0EsU0FBSUEsR0FBSkEsSUFBSUEsQ0FBYUE7UUFBSUEsQ0FBQ0E7UUFGeERELGtCQUFTQSxHQUFHQSxJQUFJQSxRQUFRQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUd4Q0EsZUFBQ0E7SUFBREEsQ0FKQXRFLEFBSUNzRSxJQUFBdEU7SUFKWUEsYUFBUUEsV0FJcEJBLENBQUFBO0lBQ0RBO1FBTUl3RSxjQUFvQkEsR0FBZ0JBLEVBQUVBLEtBQWNBO1lBTnhEQyxpQkFnRUNBO1lBMUR1QkEsUUFBR0EsR0FBSEEsR0FBR0EsQ0FBYUE7WUFGNUJBLGFBQVFBLEdBQUdBLEtBQUtBLENBQUNBO1lBR3JCQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxpQkFBaUJBLENBQUNBLGlCQUFZQSxDQUFDQSxVQUFVQSxFQUFFQSxjQUFNQSxPQUFBQSxLQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxFQUFYQSxDQUFXQSxDQUFDQSxDQUFDQTtZQUN2RkEsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsUUFBUUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDNUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLFNBQVNBLEdBQUdBLE1BQU1BLENBQUNBO1lBQ2hDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQTtnQkFDTkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7WUFDeENBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLFdBQVdBLEdBQUdBLFVBQUFBLEVBQUVBLElBQUlBLE9BQUFBLEVBQUVBLENBQUNBLGVBQWVBLEVBQUVBLEVBQXBCQSxDQUFvQkEsQ0FBQ0E7WUFDdERBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLFdBQVdBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1FBQy9DQSxDQUFDQTtRQUNERCxzQkFBT0EsR0FBUEE7WUFDSUUsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7Z0JBQUNBLE1BQU1BLENBQUNBO1lBQzFCQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxvQkFBb0JBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO1lBQzdDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxhQUFhQSxDQUFDQSxXQUFXQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUNyREEsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDekJBLENBQUNBO1FBRURGLHVCQUFRQSxHQUFSQTtZQUNJRyxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxLQUFLQSxDQUFDQTtRQUNyREEsQ0FBQ0E7UUFFREgsc0JBQU9BLEdBQVBBLFVBQVFBLEtBQWlCQTtZQUF6QkksaUJBMEJDQTtZQXpCR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7Z0JBQUNBLE1BQU1BLENBQUNBO1lBRTFCQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtZQUNaQSxJQUFJQSxLQUFjQSxDQUFDQTtZQUNuQkEsT0FBT0EsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxJQUFJQSxJQUFJQSxFQUFFQSxDQUFDQTtnQkFDdERBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1lBQ3BDQSxDQUFDQTtZQUVEQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFBQSxJQUFJQTtnQkFDZEEsSUFBSUEsRUFBRUEsR0FBR0EsUUFBUUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3RDQSxLQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxXQUFXQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtnQkFDN0JBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLEtBQUtBLFFBQVFBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBO29CQUM5QkEsRUFBRUEsQ0FBQ0EsU0FBU0EsR0FBR0EsV0FBV0EsQ0FBQ0E7Z0JBQy9CQSxDQUFDQTtnQkFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7b0JBQ0pBLEVBQUVBLENBQUNBLFdBQVdBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBO29CQUM1QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3BCQSxFQUFFQSxDQUFDQSxTQUFTQSxHQUFHQSxNQUFNQSxDQUFDQTt3QkFDdEJBLEVBQUVBLENBQUNBLFdBQVdBLEdBQUdBLFVBQUFBLEVBQUVBOzRCQUNmQSxFQUFFQSxDQUFDQSxlQUFlQSxFQUFFQSxDQUFDQTs0QkFDckJBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBOzRCQUNaQSxLQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTt3QkFDaEJBLENBQUNBLENBQUNBO29CQUNOQSxDQUFDQTtnQkFDTEEsQ0FBQ0E7WUFDTEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDUEEsQ0FBQ0E7UUFFREosbUJBQUlBLEdBQUpBO1lBQ0lLLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBO2dCQUFDQSxNQUFNQSxDQUFDQTtZQUMxQkEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsaUJBQVlBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1lBQ2hEQSxFQUFFQSxDQUFBQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxpQkFBaUJBLElBQUlBLElBQUlBLENBQUNBO2dCQUN0Q0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsR0FBR0EsU0FBU0EsQ0FBQ0E7UUFDL0NBLENBQUNBO1FBQ0RMLG1CQUFJQSxHQUFKQTtZQUNJTSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQTtnQkFBQ0EsTUFBTUEsQ0FBQ0E7WUFDMUJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLEdBQUdBLE1BQU1BLENBQUNBO1FBQ3hDQSxDQUFDQTtRQUNMTixXQUFDQTtJQUFEQSxDQWhFQXhFLEFBZ0VDd0UsSUFBQXhFO0lBaEVZQSxTQUFJQSxPQWdFaEJBLENBQUFBO0FBQ0xBLENBQUNBLEVBdkVNLElBQUksS0FBSixJQUFJLFFBdUVWO0FDdkVELElBQU8sSUFBSSxDQTJIVjtBQTNIRCxXQUFPLElBQUksRUFBQyxDQUFDO0lBQ1RBO1FBQ0krRSxrQkFBbUJBLE1BQWdCQSxFQUFTQSxJQUFZQSxFQUFTQSxJQUFZQTtZQUExREMsV0FBTUEsR0FBTkEsTUFBTUEsQ0FBVUE7WUFBU0EsU0FBSUEsR0FBSkEsSUFBSUEsQ0FBUUE7WUFBU0EsU0FBSUEsR0FBSkEsSUFBSUEsQ0FBUUE7UUFBSUEsQ0FBQ0E7UUFDdEZELGVBQUNBO0lBQURBLENBRkEvRSxBQUVDK0UsSUFBQS9FO0lBRllBLGFBQVFBLFdBRXBCQSxDQUFBQTtJQUNEQTtRQU1JaUYsa0JBQW1CQSxJQUFVQTtZQUFWQyxTQUFJQSxHQUFKQSxJQUFJQSxDQUFNQTtZQUN6QkEsSUFBSUEsQ0FBQ0EsSUFBSUEsR0FBR0EsUUFBUUEsQ0FBQ0E7UUFDekJBLENBQUNBO1FBQ0xELGVBQUNBO0lBQURBLENBVEFqRixBQVNDaUYsSUFBQWpGO0lBVFlBLGFBQVFBLFdBU3BCQSxDQUFBQTtJQUVEQTtRQUFBbUY7UUEyR0FDLENBQUNBO1FBeEdVRCxhQUFRQSxHQUFmQSxVQUFnQkEsR0FBZ0JBO1lBQzVCRSxJQUFJQSxLQUFLQSxHQUFHQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQTtZQUN0QkEsSUFBSUEsT0FBT0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0E7WUFHMUJBLElBQUlBLE9BQU9BLEdBQWdDQSxFQUFFQSxDQUFDQTtZQUM5Q0EsSUFBSUEsS0FBS0EsR0FBR0EsR0FBR0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFDaENBLElBQUlBLEtBQUtBLEdBQWVBLEtBQUtBLENBQUNBLEtBQUtBO2lCQUM5QkEsTUFBTUEsQ0FBQ0EsVUFBQUEsQ0FBQ0EsSUFBSUEsT0FBQUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsSUFBSUEsQ0FBQ0EsS0FBS0EsT0FBT0EsQ0FBQ0EsVUFBVUEsSUFBSUEsQ0FBQ0EsS0FBS0EsT0FBT0EsQ0FBQ0EsUUFBUUEsRUFBN0VBLENBQTZFQSxDQUFDQTtpQkFDMUZBLEdBQUdBLENBQUNBLFVBQUFBLENBQUNBLElBQUlBLE9BQUFBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLElBQUlBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBLEVBQS9CQSxDQUErQkEsQ0FBQ0EsQ0FBQ0E7WUFFL0NBLElBQUlBLE1BQU1BLEdBQUdBLElBQUlBLFFBQVFBLENBQUNBLE9BQU9BLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1lBQzlDQSxNQUFNQSxDQUFDQSxJQUFJQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNoQkEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7WUFDbkJBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLFVBQVVBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLE1BQU1BLENBQUNBO1lBRXhDQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxRQUFRQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtZQUMxQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDakJBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLFFBQVFBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBO1lBRXBDQSxJQUFJQSxPQUFPQSxHQUFHQSxPQUFPQSxDQUFDQSxVQUFVQSxDQUFDQSxHQUFHQSxDQUFDQSxRQUFRQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUdwRUEsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQUEsQ0FBQ0E7dUJBQ1hBLENBQUNBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBO3FCQUNqQkEsTUFBTUEsQ0FBQ0EsVUFBQUEsQ0FBQ0EsSUFBSUEsT0FBQUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsRUFBaENBLENBQWdDQSxDQUFDQTtxQkFDN0NBLEdBQUdBLENBQUNBLFVBQUFBLENBQUNBLElBQUlBLE9BQUFBLElBQUlBLFFBQVFBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLEtBQUtBLENBQUNBLENBQUNBLElBQUlBLEdBQUdBLENBQUNBLENBQUNBLFFBQVFBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQTlGQSxDQUE4RkEsQ0FBQ0E7WUFGN0dBLENBRTZHQSxDQUFDQSxDQUFDQTtZQUduSEEsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQUEsQ0FBQ0E7dUJBQ1hBLENBQUNBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBO3FCQUN6QkEsTUFBTUEsQ0FBQ0EsVUFBQUEsRUFBRUEsSUFBSUEsT0FBQUEsRUFBRUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBQUEsQ0FBQ0EsSUFBSUEsT0FBQUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsS0FBS0EsRUFBRUEsRUFBZkEsQ0FBZUEsQ0FBQ0EsRUFBL0NBLENBQStDQSxDQUFDQTtxQkFDN0RBLEdBQUdBLENBQUNBLFVBQUFBLEVBQUVBLElBQUlBLE9BQUFBLElBQUlBLFFBQVFBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLFFBQVFBLENBQUNBLEVBQUVBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLE1BQU1BLENBQUNBLEVBQTFEQSxDQUEwREEsQ0FBQ0E7cUJBQ3JFQSxNQUFNQSxDQUFDQSxVQUFBQSxDQUFDQSxJQUFJQSxPQUFBQSxDQUFDQSxDQUFDQSxJQUFJQSxJQUFJQSxPQUFPQSxFQUFqQkEsQ0FBaUJBLENBQUNBLENBQUNBO1lBSHBDQSxDQUdvQ0EsQ0FBQ0EsQ0FBQ0E7WUFHMUNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFFBQVFBLElBQUlBLElBQUlBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBO2dCQUN0REEsSUFBSUEsRUFBRUEsR0FBR0EsSUFBSUEsUUFBUUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3hDQSxFQUFFQSxDQUFDQSxLQUFLQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxDQUFDQSxVQUFBQSxDQUFDQSxJQUFJQSxPQUFBQSxDQUFDQSxLQUFLQSxN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LG1CQUFhQSxHQUFXQSxFQUFFQSxDQUFDQTtRQXFGOUNBLFlBQUNBO0lBQURBLENBN0ZBdEYsQUE2RkNzRixJQUFBdEY7SUE3RllBLFVBQUtBLFFBNkZqQkEsQ0FBQUE7QUFDTEEsQ0FBQ0EsRUFoSE0sSUFBSSxLQUFKLElBQUksUUFnSFYiLCJmaWxlIjoidHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZC9lczYtcHJvbWlzZS9lczYtcHJvbWlzZS5kLnRzXCIvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZC93aGF0d2ctZmV0Y2gvd2hhdHdnLWZldGNoLmQudHNcIi8+XHJcbm1vZHVsZSBUZXNwIHtcclxuICAgIGV4cG9ydCB0eXBlIENoYW5nZUxpc3RlbmVyRnVuYyA9IChyZWFzb246IENoYW5nZVJlYXNvbikgPT4gdm9pZDtcclxuICAgIGV4cG9ydCBlbnVtIENoYW5nZVJlYXNvbiB7XHJcbiAgICAgICAgTm9uZSA9IDB4MCxcclxuICAgICAgICAvKiogVGhlIHNlbGVjdGVkIHNvdXJjZSBub2RlIGhhcyBjaGFuZ2VkICovXHJcbiAgICAgICAgU291cmNlQ2hhbmdlID0gMHgxLFxyXG4gICAgICAgIC8qKiBUaGUgc2VsZWN0ZWQgZGVzdGluYXRpb24gbm9kZSBoYXMgY2hhbmdlZCAqL1xyXG4gICAgICAgIERlc3RpbmF0aW9uQ2hhbmdlID0gMHgyLFxyXG4gICAgICAgIC8qKiBUaGUgbWFyayBub2RlIGxvY2F0aW9uIGhhcyBjaGFuZ2VkICovXHJcbiAgICAgICAgTWFya0NoYW5nZSA9IDB4NCxcclxuICAgICAgICAvKiogVGhlIGVpdGhlciB0aGUgc291cmNlLCBkZXN0aW5hdGlvbiBvciBtYXJrIGxvY2F0aW9uIGhhcyBjaGFuZ2VkICovXHJcbiAgICAgICAgQ29udGV4dENoYW5nZSA9IFNvdXJjZUNoYW5nZSB8IERlc3RpbmF0aW9uQ2hhbmdlIHwgTWFya0NoYW5nZSxcclxuICAgICAgICAvKiogVGhlIGVuYWJsZWQgc3RhdGUgb3IgdmlzaWJpbGl0eSBvZiBhIGZlYXR1cmUgaGFzIGNoYW5nZWQgKi9cclxuICAgICAgICBGZWF0dXJlQ2hhbmdlID0gMHg4LFxyXG4gICAgICAgIC8qKiBBIG5ldyBwYXRoIGhhcyBiZWVuIGNhbGN1bGF0ZWQgKi9cclxuICAgICAgICBQYXRoVXBkYXRlID0gMHgxMCxcclxuICAgICAgICAvKiogQW4gaW5wdXQgZXZlbnQgaGFzIHRyaWdnZXJlZCBtZW51cyB0byBjbG9zZSAqL1xyXG4gICAgICAgIENsZWFyTWVudXMgPSAweDIwLFxyXG4gICAgICAgIEFueSA9IDB4M2ZcclxuICAgIH1cclxuICAgIGV4cG9ydCBjbGFzcyBDaGFuZ2VMaXN0ZW5lciB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIHJlYXNvbnM6IENoYW5nZVJlYXNvbiwgcHVibGljIGZ1bmM6IENoYW5nZUxpc3RlbmVyRnVuYykgeyB9XHJcblxyXG4gICAgICAgIHRyaWdnZXIocmVhc29uOiBDaGFuZ2VSZWFzb24pIHtcclxuICAgICAgICAgICAgaWYgKCh0aGlzLnJlYXNvbnMgJiByZWFzb24pICE9PSAwKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5mdW5jKHJlYXNvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKiBDb3JlIFRFU1BhdGhmaW5kZXIgYXBwbGljYXRpb24gKi9cclxuICAgIGV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvbiB7XHJcbiAgICAgICAgbG9hZGVkOiBQcm9taXNlPEFwcGxpY2F0aW9uPjtcclxuICAgICAgICBlbGVtZW50OiBIVE1MRWxlbWVudDtcclxuICAgICAgICBjb250ZXh0OiBDb250ZXh0O1xyXG4gICAgICAgIGZlYXR1cmVzOiBJRmVhdHVyZUxpc3Q7XHJcbiAgICAgICAgd29ybGQ6IFdvcmxkO1xyXG4gICAgICAgIGNvbnRyb2xzOiBDb250cm9scztcclxuICAgICAgICBtYXA6IE1hcDtcclxuICAgICAgICBjdHhNZW51OiBDb250ZXh0TWVudTtcclxuXHJcbiAgICAgICAgcHJpdmF0ZSBsaXN0ZW5lcnM6IENoYW5nZUxpc3RlbmVyW10gPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XHJcbiAgICAgICAgICAgIHRoaXMubG9hZGVkID0gd2luZG93LmZldGNoKFwiZGF0YS9kYXRhLmpzb25cIilcclxuICAgICAgICAgICAgICAgIC50aGVuKHJlcyA9PiByZXMuanNvbigpKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gbmV3IENvbnRleHQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mZWF0dXJlcyA9IEZlYXR1cmVzLmluaXQoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndvcmxkID0gbmV3IFdvcmxkKHRoaXMsIDxJV29ybGRTb3VyY2U+PGFueT5kYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1hcCA9IG5ldyBNYXAodGhpcywgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYXBcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udHJvbHMgPSBuZXcgQ29udHJvbHModGhpcywgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250cm9sc1wiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdHhNZW51ID0gbmV3IENvbnRleHRNZW51KHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5Lm9ubW91c2Vkb3duID0gZG9jdW1lbnQuYm9keS5vbmNvbnRleHRtZW51ID0gKCkgPT4gdGhpcy50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5DbGVhck1lbnVzKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZUJvZHlDbGFzcyhcImxvYWRpbmdcIiwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogTGlzdGVuIGZvciBhcHBsaWNhdGlvbiBsZXZlbCBjaGFuZ2VzICovXHJcbiAgICAgICAgYWRkQ2hhbmdlTGlzdGVuZXIocmVhc29uczogQ2hhbmdlUmVhc29uLCBmdW5jOiBDaGFuZ2VMaXN0ZW5lckZ1bmMpOiBDaGFuZ2VMaXN0ZW5lciB7XHJcbiAgICAgICAgICAgIHZhciBsaXN0ZW5lciA9IG5ldyBDaGFuZ2VMaXN0ZW5lcihyZWFzb25zLCBmdW5jKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XHJcbiAgICAgICAgICAgIHJldHVybiBsaXN0ZW5lcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLyoqIFJlbW92ZSBhIHByZXZpb3VzbHkgYWRkZWQgbGlzdGVuZXIgKi9cclxuICAgICAgICByZW1vdmVDaGFuZ2VMaXN0ZW5lcihsaXN0ZW5lcjogQ2hhbmdlTGlzdGVuZXIpIHtcclxuICAgICAgICAgICAgdmFyIGl4ID0gdGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XHJcbiAgICAgICAgICAgIGlmIChpeCA+IC0xKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGl4LCAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLyoqIEluZm9ybSBhbGwgbGlzdGVuZXJzIGFib3V0IGEgbmV3IGNoYW5nZSAqL1xyXG4gICAgICAgIHRyaWdnZXJDaGFuZ2UocmVhc29uOiBDaGFuZ2VSZWFzb24pIHtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaChsID0+IGwudHJpZ2dlcihyZWFzb24pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBUb2dnbGUgYSBjbGFzcyBhdHRyaWJ1dGUgbmFtZSBpbiB0aGUgZG9jdW1lbnQgYm9keSAqL1xyXG4gICAgICAgIHRvZ2dsZUJvZHlDbGFzcyhuYW1lOiBzdHJpbmcsIGVuYWJsZWQ6IGJvb2xlYW4pIHtcclxuICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZChuYW1lKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShuYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKiogVGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhlIGFwcGxpY2F0aW9uLCBmb3IgZGVidWdnaW5nIHB1cnBvc2VzIG9ubHkgKi9cclxuICAgIGV4cG9ydCB2YXIgYXBwID0gbmV3IEFwcGxpY2F0aW9uKCk7XHJcbn0iLCJtb2R1bGUgVGVzcCB7XHJcbiAgICAvKiogMi1kaW1lbnNpb25hbCBmbG9hdGluZyBwb2ludCB2ZWN0b3IgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBWZWMyIHtcclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgeDogbnVtYmVyLCBwdWJsaWMgeTogbnVtYmVyKSB7IH1cclxuXHJcbiAgICAgICAgLyoqIENhbGN1bGF0ZSB0aGUgZXVjbGlkZWFuIGRpc3RhbmNlIGJldHdlZW4gdGhpcyB2ZWN0b3IgYW5kIGFub3RoZXIgKi9cclxuICAgICAgICBkaXN0YW5jZShvdGhlcjogVmVjMik6IG51bWJlciB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnNxcnQoKChvdGhlci54IC0gdGhpcy54KSAqIChvdGhlci54IC0gdGhpcy54KSkgKyAoKG90aGVyLnkgLSB0aGlzLnkpICogKG90aGVyLnkgLSB0aGlzLnkpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogQ2FsY3VsYXRlIHRoZSB0b3AtbGVmdCBjb3JuZXIgb2YgYSBjZWxsIGFzIGEgcG9zaXRpb24gdmVjdG9yICovXHJcbiAgICAgICAgc3RhdGljIGZyb21DZWxsKHg6IG51bWJlciwgeTogbnVtYmVyKTogVmVjMiB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgVmVjMih4ICogQ2VsbC53aWR0aCArIENlbGwud2lkdGhPZmZzZXQsIHkgKiBDZWxsLmhlaWdodCArIENlbGwuaGVpZ2h0T2Zmc2V0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIEEgc2luZ2xlIHNpZ25pZmljYW50IHBvaW50IGluIHRoZSB3b3JsZCAqL1xyXG4gICAgZXhwb3J0IGNsYXNzIE5vZGUge1xyXG4gICAgICAgIC8qKiBHbG9iYWxseSB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyBub2RlICovXHJcbiAgICAgICAgaWQ6IG51bWJlcjtcclxuICAgICAgICAvKiogVGhlIGlkIG9mIGEgbm9kZSB0aGlzIG5vZGUgd2FzIGNyZWF0ZWQgb24gKi9cclxuICAgICAgICByZWZlcmVuY2VJZDogbnVtYmVyO1xyXG4gICAgICAgIGVkZ2VzOiBFZGdlW107XHJcblxyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIGlkZW50aXR5OiBudW1iZXIgPSAxO1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcsIHB1YmxpYyBsb25nTmFtZTogc3RyaW5nLCBwdWJsaWMgcG9zOiBWZWMyLCBwdWJsaWMgdHlwZTogc3RyaW5nLCBwdWJsaWMgcGVybWFuZW50OiBib29sZWFuID0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdGhpcy5pZCA9IE5vZGUuaWRlbnRpdHkrKztcclxuICAgICAgICAgICAgdGhpcy5lZGdlcyA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKiogQSBsaW5rIGJldHdlZW4gdHdvIG5vZGVzICovXHJcbiAgICBleHBvcnQgY2xhc3MgRWRnZSB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIHNyY05vZGU6IE5vZGUsIHB1YmxpYyBkZXN0Tm9kZTogTm9kZSwgcHVibGljIGNvc3Q6IG51bWJlcikgeyB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIEEgbGFyZ2UgYXJlYSBpbiB0aGUgd29ybGQgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBDZWxsIHtcclxuICAgICAgICBzdGF0aWMgd2lkdGg6IG51bWJlciA9IDQ0LjU7XHJcbiAgICAgICAgc3RhdGljIGhlaWdodDogbnVtYmVyID0gNDQuNjtcclxuICAgICAgICBzdGF0aWMgd2lkdGhPZmZzZXQ6IG51bWJlciA9IDIwO1xyXG4gICAgICAgIHN0YXRpYyBoZWlnaHRPZmZzZXQ6IG51bWJlciA9IDM1O1xyXG4gICAgICAgIHN0YXRpYyBmcm9tUG9zaXRpb24ocG9zOiBWZWMyKTogVmVjMiB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgVmVjMigocG9zLnggLSBDZWxsLndpZHRoT2Zmc2V0KSAvIENlbGwud2lkdGgsIChwb3MueSAtIENlbGwuaGVpZ2h0T2Zmc2V0KSAvIENlbGwuaGVpZ2h0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKiogQSBzaW5nbGUgcm93IG9mIGNlbGxzICovXHJcbiAgICBleHBvcnQgY2xhc3MgQ2VsbFJvdyB7XHJcbiAgICAgICAgd2lkdGg6IG51bWJlcjtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIHk6IG51bWJlciwgcHVibGljIHgxOiBudW1iZXIsIHB1YmxpYyB4MjogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSB4MiAtIHgxICsgMTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKiogQW4gYXJlYSBvZiBvbmUgb3IgbW9yZSBjZWxscyAqL1xyXG4gICAgZXhwb3J0IGNsYXNzIEFyZWEge1xyXG4gICAgICAgIHByaXZhdGUgbWluWTogbnVtYmVyO1xyXG4gICAgICAgIHByaXZhdGUgbWF4WTogbnVtYmVyO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgdGFyZ2V0OiBOb2RlLCBwdWJsaWMgcm93czogQ2VsbFJvd1tdKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWluWSA9IHJvd3NbMF0ueTtcclxuICAgICAgICAgICAgdGhpcy5tYXhZID0gcm93c1tyb3dzLmxlbmd0aCAtIDFdLnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogQ2hlY2sgaWYgdGhpcyBjZWxsIGNvbnRhaW5zIHRoZSBzdXBwbGllZCBjb29yZGluYXRlcyAqL1xyXG4gICAgICAgIGNvbnRhaW5zQ2VsbChwb3M6IFZlYzIpOiBib29sZWFuIHtcclxuICAgICAgICAgICAgaWYgKHBvcy55ID49IHRoaXMubWluWSAmJiBwb3MueSA8IHRoaXMubWF4WSArIDEpIHtcclxuICAgICAgICAgICAgICAgIHZhciByb3cgPSB0aGlzLnJvd3NbTWF0aC5mbG9vcihwb3MueSkgLSB0aGlzLm1pblldO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBvcy54ID49IHJvdy54MSAmJiBwb3MueCA8IHJvdy54MiArIDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIm1vZHVsZSBUZXNwIHtcclxuICAgIC8qKiBUaGUgY3VycmVudCBtdXRhYmxlIHN0YXRlIG9mIHRoZSBhcHBsaWNhdGlvbiAqL1xyXG4gICAgZXhwb3J0IGNsYXNzIENvbnRleHQge1xyXG4gICAgICAgIHNvdXJjZU5vZGU6IE5vZGU7XHJcbiAgICAgICAgZGVzdE5vZGU6IE5vZGU7XHJcbiAgICAgICAgbWFya05vZGU6IE5vZGU7XHJcbiAgICAgICAgcGF0aEVuZDogUGF0aE5vZGU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXBwOiBBcHBsaWNhdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uQ29udGV4dENoYW5nZSB8IENoYW5nZVJlYXNvbi5NYXJrQ2hhbmdlIHwgQ2hhbmdlUmVhc29uLkZlYXR1cmVDaGFuZ2UsIHJlYXNvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmRQYXRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVhc29uID09PSBDaGFuZ2VSZWFzb24uTWFya0NoYW5nZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRvZ2dsZUJvZHlDbGFzcyhcImhhcy1tYXJrXCIsIHRoaXMubWFya05vZGUgIT0gbnVsbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0Q29udGV4dExvY2F0aW9uKGNvbnRleHQ6IHN0cmluZywgcG9zOiBWZWMyKSB7XHJcbiAgICAgICAgICAgIHZhciBuYW1lID0gdGhpcy5hcHAud29ybGQuZ2V0TGFuZG1hcmtOYW1lKHBvcykgfHwgdGhpcy5hcHAud29ybGQuZ2V0UmVnaW9uTmFtZShwb3MpO1xyXG4gICAgICAgICAgICBpZiAoY29udGV4dCA9PT0gXCJzb3VyY2VcIikge1xyXG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUgfHwgXCJZb3VcIjtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q29udGV4dE5vZGUoY29udGV4dCwgbmV3IE5vZGUobmFtZSwgbmFtZSwgcG9zLCBcInNvdXJjZVwiKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29udGV4dCA9PT0gXCJkZXN0aW5hdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICBuYW1lID0gbmFtZSB8fCBcIllvdXIgZGVzdGluYXRpb25cIjtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q29udGV4dE5vZGUoY29udGV4dCwgbmV3IE5vZGUobmFtZSwgbmFtZSwgcG9zLCBcImRlc3RpbmF0aW9uXCIpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb250ZXh0ID09PSBcIm1hcmtcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXJrTm9kZSA9IG5ldyBOb2RlKG5hbWUsIG5hbWUsIHBvcywgXCJtYXJrXCIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uTWFya0NoYW5nZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgc2V0Q29udGV4dE5vZGUoY29udGV4dDogc3RyaW5nLCBub2RlOiBOb2RlKSB7XHJcbiAgICAgICAgICAgIGlmIChjb250ZXh0ID09PSBcInNvdXJjZVwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZU5vZGUgPSBub2RlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uU291cmNlQ2hhbmdlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb250ZXh0ID09PSBcImRlc3RpbmF0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGVzdE5vZGUgPSBub2RlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uRGVzdGluYXRpb25DaGFuZ2UpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbnRleHQgPT09IFwibWFya1wiKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcG9zID0gbm9kZS5wb3M7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1hcmtOb2RlID0gbmV3IE5vZGUobm9kZS5sb25nTmFtZSwgbm9kZS5sb25nTmFtZSwgcG9zLCBcIm1hcmtcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1hcmtOb2RlLnJlZmVyZW5jZUlkID0gbm9kZS5yZWZlcmVuY2VJZCB8fCBub2RlLmlkO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uTWFya0NoYW5nZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY2xlYXJDb250ZXh0KGNvbnRleHQ6IHN0cmluZykge1xyXG4gICAgICAgICAgICBpZiAoY29udGV4dCA9PT0gXCJzb3VyY2VcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zb3VyY2VOb2RlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLlNvdXJjZUNoYW5nZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29udGV4dCA9PT0gXCJkZXN0aW5hdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlc3ROb2RlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLkRlc3RpbmF0aW9uQ2hhbmdlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb250ZXh0ID09PSBcIm1hcmtcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXJrTm9kZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5NYXJrQ2hhbmdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmluZFBhdGgoKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGF0aEVuZCA9IHRoaXMuc291cmNlTm9kZSAhPSBudWxsICYmIHRoaXMuZGVzdE5vZGUgIT0gbnVsbCAmJiB0aGlzLnNvdXJjZU5vZGUgIT09IHRoaXMuZGVzdE5vZGVcclxuICAgICAgICAgICAgICAgID8gUGF0aC5maW5kUGF0aCh0aGlzLmFwcClcclxuICAgICAgICAgICAgICAgIDogbnVsbDtcclxuICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uUGF0aFVwZGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwibW9kdWxlIFRlc3Age1xyXG4gICAgLyoqIE1hbmFnZXMgdGhlIGNvbnRleHQgbWVudSBvZiB0aGUgbWFwICovXHJcbiAgICBleHBvcnQgY2xhc3MgQ29udGV4dE1lbnUge1xyXG4gICAgICAgIHByaXZhdGUgbWVudTogTWVudTtcclxuICAgICAgICBwcml2YXRlIGxpbmtzOiBNZW51SXRlbVtdO1xyXG4gICAgICAgIHByaXZhdGUgdW5tYXJrTGluazogTWVudUl0ZW07XHJcblxyXG4gICAgICAgIHByaXZhdGUgcG9zOiBWZWMyO1xyXG4gICAgICAgIHByaXZhdGUgbm9kZTogTm9kZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcGxpY2F0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWVudSA9IG5ldyBNZW51KGFwcCwgZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5saW5rcyA9IFtcclxuICAgICAgICAgICAgICAgIE1lbnVJdGVtLnNlcGFyYXRvcixcclxuICAgICAgICAgICAgICAgIG5ldyBNZW51SXRlbShcIk5hdmlnYXRlIGZyb20gaGVyZVwiLCAoKSA9PiB0aGlzLnNldENvbnRleHQoXCJzb3VyY2VcIikpLFxyXG4gICAgICAgICAgICAgICAgbmV3IE1lbnVJdGVtKFwiTmF2aWdhdGUgdG8gaGVyZVwiLCAoKSA9PiB0aGlzLnNldENvbnRleHQoXCJkZXN0aW5hdGlvblwiKSksXHJcbiAgICAgICAgICAgICAgICBuZXcgTWVudUl0ZW0oXCJTZXQgTWFyayBoZXJlXCIsICgpID0+IHRoaXMuc2V0Q29udGV4dChcIm1hcmtcIikpXHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgIHRoaXMudW5tYXJrTGluayA9IG5ldyBNZW51SXRlbShcIlJlbW92ZSBtYXJrXCIsICgpID0+IHRoaXMuYXBwLmNvbnRleHQuY2xlYXJDb250ZXh0KFwibWFya1wiKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHNldENvbnRleHQoY29udGV4dDogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5vZGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuY29udGV4dC5zZXRDb250ZXh0Tm9kZShjb250ZXh0LCB0aGlzLm5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuY29udGV4dC5zZXRDb250ZXh0TG9jYXRpb24oY29udGV4dCwgdGhpcy5wb3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvcGVuTm9kZShub2RlOiBOb2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3Blbihub2RlLnBvcywgbm9kZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9wZW4ocG9zOiBWZWMyLCBub2RlOiBOb2RlKSB7XHJcbiAgICAgICAgICAgIC8vIHJlbW92ZSBub2RlIGlmIG5laXRoZXIgaXQgb3IgaXRzIHJlZmVyZW5jZSBhcmUgcGVybWFuZW50XHJcbiAgICAgICAgICAgIGlmIChub2RlICE9IG51bGwgJiYgIW5vZGUucGVybWFuZW50KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5yZWZlcmVuY2VJZCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLmFwcC53b3JsZC5maW5kTm9kZUJ5SWQobm9kZS5yZWZlcmVuY2VJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUgIT0gbnVsbCAmJiAhbm9kZS5wZXJtYW5lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbGluZXM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgICAgIHZhciBsYW5kbWFyayA9IHRoaXMuYXBwLndvcmxkLmdldExhbmRtYXJrTmFtZShwb3MpO1xyXG4gICAgICAgICAgICBpZiAobm9kZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmVhdCA9IHRoaXMuYXBwLmZlYXR1cmVzLmJ5TmFtZVtub2RlLnR5cGVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZlYXQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVzLnB1c2goZmVhdC5sb2NhdGlvbiB8fCBmZWF0Lm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVzLnB1c2gobm9kZS5uYW1lKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZXMucHVzaChub2RlLmxvbmdOYW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChsYW5kbWFyayAhPSBudWxsICYmIGxhbmRtYXJrICE9PSBub2RlLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKGxhbmRtYXJrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHBvcyA9IG5vZGUucG9zO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGxhbmRtYXJrICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGxpbmVzLnB1c2gobGFuZG1hcmspO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciByZWdpb24gPSB0aGlzLmFwcC53b3JsZC5nZXRSZWdpb25OYW1lKHBvcyk7XHJcbiAgICAgICAgICAgIGlmIChyZWdpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgbGluZXMucHVzaChyZWdpb24gKyBcIiBSZWdpb25cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMucG9zID0gcG9zO1xyXG4gICAgICAgICAgICB0aGlzLm5vZGUgPSBub2RlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGl0ZW1zID0gbGluZXMubWFwKGwgPT4gbmV3IE1lbnVJdGVtKGwpKS5jb25jYXQodGhpcy5saW5rcyk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFwcC5jb250ZXh0Lm1hcmtOb2RlICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICBpdGVtcy5wdXNoKHRoaXMudW5tYXJrTGluayk7XHJcbiAgICAgICAgICAgIHRoaXMubWVudS5zZXREYXRhKGl0ZW1zKTtcclxuICAgICAgICAgICAgdGhpcy5tZW51Lm9wZW4oKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBtZW51U3R5bGUgPSB0aGlzLm1lbnUuZ2V0U3R5bGUoKTtcclxuICAgICAgICAgICAgbWVudVN0eWxlLmxlZnQgPSBwb3MueCArIFwicHhcIjtcclxuICAgICAgICAgICAgbWVudVN0eWxlLnRvcCA9IHBvcy55ICsgXCJweFwiO1xyXG5cclxuICAgICAgICAgICAgdmFyIHNjcm9sbFggPSBwYWdlWE9mZnNldDtcclxuICAgICAgICAgICAgdmFyIHNjcm9sbFkgPSBwYWdlWU9mZnNldDtcclxuICAgICAgICAgICAgdmFyIHJlY3QgPSB0aGlzLm1lbnUuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgICAgICAgaWYgKHJlY3QubGVmdCA8IDEwKSB7XHJcbiAgICAgICAgICAgICAgICBzY3JvbGxYID0gcGFnZVhPZmZzZXQgKyByZWN0LmxlZnQgLSAxMDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZWN0LnJpZ2h0ID4gaW5uZXJXaWR0aCAtIDI3KSB7XHJcbiAgICAgICAgICAgICAgICBzY3JvbGxYID0gcGFnZVhPZmZzZXQgKyByZWN0LnJpZ2h0IC0gaW5uZXJXaWR0aCArIDI3O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVjdC50b3AgPCA1MCkge1xyXG4gICAgICAgICAgICAgICAgc2Nyb2xsWSA9IHBhZ2VZT2Zmc2V0ICsgcmVjdC50b3AgLSA1MDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZWN0LmJvdHRvbSA+IGlubmVySGVpZ2h0IC0gMjcpIHtcclxuICAgICAgICAgICAgICAgIHNjcm9sbFkgPSBwYWdlWU9mZnNldCArIHJlY3QuYm90dG9tIC0gaW5uZXJIZWlnaHQgKyAyNztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHNjcm9sbFggIT09IHBhZ2VYT2Zmc2V0IHx8IHNjcm9sbFkgIT09IHBhZ2VZT2Zmc2V0KVxyXG4gICAgICAgICAgICAgICAgc2Nyb2xsKHNjcm9sbFgsIHNjcm9sbFkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBoaWRlKCkge1xyXG4gICAgICAgICAgICB0aGlzLm1lbnUuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIm1vZHVsZSBUZXNwIHtcclxuICAgIC8qKiBVSSBjb250cm9scyBmb3Igc2VhcmNoIGFuZCBuYXZpZ2F0aW9uICovXHJcbiAgICBleHBvcnQgY2xhc3MgQ29udHJvbHMge1xyXG4gICAgICAgIHByaXZhdGUgcGF0aENvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBmZWF0dXJlc0NvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBzZWFyY2hJbnB1dDogSFRNTElucHV0RWxlbWVudDtcclxuICAgICAgICBwcml2YXRlIHNlYXJjaEJveDogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBzZWFyY2hNZW51OiBNZW51O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwbGljYXRpb24sIHByaXZhdGUgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLlNvdXJjZUNoYW5nZSwgKCkgPT4gdGhpcy51cGRhdGVOb2RlSW5mbyhcIi5jb250cm9sLXNvdXJjZS1pbmZvXCIsIHRoaXMuYXBwLmNvbnRleHQuc291cmNlTm9kZSkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uRGVzdGluYXRpb25DaGFuZ2UsICgpID0+IHRoaXMudXBkYXRlTm9kZUluZm8oXCIuY29udHJvbC1kZXN0aW5hdGlvbi1pbmZvXCIsIHRoaXMuYXBwLmNvbnRleHQuZGVzdE5vZGUpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLk1hcmtDaGFuZ2UsICgpID0+IHRoaXMudXBkYXRlTm9kZUluZm8oXCIuY29udHJvbC1tYXJrLWluZm9cIiwgdGhpcy5hcHAuY29udGV4dC5tYXJrTm9kZSkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uUGF0aFVwZGF0ZSwgKCkgPT4gdGhpcy51cGRhdGVQYXRoKCkpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wYXRoQ29udGFpbmVyID0gPEhUTUxFbGVtZW50PmVsZW1lbnQucXVlcnlTZWxlY3RvcihcIi5wYXRoLWNvbnRhaW5lclwiKTtcclxuICAgICAgICAgICAgdGhpcy5mZWF0dXJlc0NvbnRhaW5lciA9IDxIVE1MRWxlbWVudD5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZmVhdHVyZXMtY29udGFpbmVyXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaElucHV0ID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZWxlbWVudC5xdWVyeVNlbGVjdG9yKFwiLnNlYXJjaC1pbnB1dFwiKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBmZWF0dXJlc1Zpc2libGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgKDxIVE1MRWxlbWVudD5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZmVhdHVyZXMtaWNvblwiKSkub25jbGljayA9ICgpID0+IFxyXG4gICAgICAgICAgICAgICAgdGhpcy5mZWF0dXJlc0NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gKGZlYXR1cmVzVmlzaWJsZSA9ICFmZWF0dXJlc1Zpc2libGUpID8gXCJibG9ja1wiIDogXCJub25lXCI7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluaXRTZWFyY2goKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluaXRTZWFyY2goKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWFyY2hDb250YWluZXIgPSA8SFRNTElucHV0RWxlbWVudD50aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcihcIi5zZWFyY2gtY29udGFpbmVyXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaE1lbnUgPSBuZXcgTWVudShhcHAsIHRydWUpO1xyXG4gICAgICAgICAgICB2YXIgbWVudVN0eWxlID0gdGhpcy5zZWFyY2hNZW51LmdldFN0eWxlKCk7XHJcbiAgICAgICAgICAgIHZhciBpbnB1dCA9IHRoaXMuc2VhcmNoSW5wdXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgICAgIG1lbnVTdHlsZS5taW5XaWR0aCA9IFwiMjAwcHhcIjtcclxuICAgICAgICAgICAgbWVudVN0eWxlLnRvcCA9IChpbnB1dC50b3AgKyBpbnB1dC5oZWlnaHQpICsgXCJweFwiO1xyXG4gICAgICAgICAgICBtZW51U3R5bGUucmlnaHQgPSAoc2VhcmNoQ29udGFpbmVyLmNsaWVudFdpZHRoIC0gaW5wdXQucmlnaHQpICsgXCJweFwiO1xyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gcHJlcFRlcm0odGV4dDogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGV4dCAhPSBudWxsID8gdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1teYS16XSsvZywgXCIgXCIpIDogbnVsbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHNlYXJjaE5vZGVzID0gdGhpcy5hcHAud29ybGQubm9kZXNcclxuICAgICAgICAgICAgICAgIC5jb25jYXQodGhpcy5hcHAud29ybGQubGFuZG1hcmtzLm1hcChhID0+IGEudGFyZ2V0KSlcclxuICAgICAgICAgICAgICAgIC5tYXAobiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZlYXQgPSB0aGlzLmFwcC5mZWF0dXJlcy5ieU5hbWVbbi50eXBlXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmVhdE5hbWUgPSBmZWF0ICE9IG51bGwgPyBmZWF0LmxvY2F0aW9uIHx8IGZlYXQubmFtZSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlcm1zID0gW24ubmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZlYXROYW1lICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlcm1zLnB1c2goZmVhdE5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsYW5kbWFyayA9IHRoaXMuYXBwLndvcmxkLmdldExhbmRtYXJrTmFtZShuLnBvcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhbmRtYXJrICYmIGxhbmRtYXJrICE9PSBuLm5hbWUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlcm1zLnB1c2gobGFuZG1hcmspO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXJtczogdGVybXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaFRlcm1zOiB0ZXJtcy5tYXAodCA9PiBwcmVwVGVybSh0KSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGU6IG5cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0ID0gYS5zZWFyY2hUZXJtcywgYnQgPSBiLnNlYXJjaFRlcm1zO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtbCA9IE1hdGgubWF4KGF0Lmxlbmd0aCwgYnQubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1sOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGQgPSAoYXRbaV0gfHwgXCJcIikubG9jYWxlQ29tcGFyZShidFtpXSB8fCBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQgIT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0ZlYXR1cmVzKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaElucHV0Lm9uaW5wdXQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2VhcmNoID0gdGhpcy5zZWFyY2hJbnB1dC52YWx1ZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBzdGFydHM6IG51bWJlcltdID0gW107XHJcbiAgICAgICAgICAgICAgICB2YXIgdGVybXM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgICAgICAgICB2YXIgYWxwaGEgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VhcmNoLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBzZWFyY2guY2hhckNvZGVBdChpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYyA+IDk2ICYmIGMgPCAxMjMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhbHBoYSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRzLnB1c2goaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbHBoYSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFscGhhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlcm1zID0gdGVybXMuY29uY2F0KHN0YXJ0cy5tYXAocyA9PiBzZWFyY2guc3Vic3RyaW5nKHMsIGkpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFscGhhID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGFscGhhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGVybXMgPSB0ZXJtcy5jb25jYXQoc3RhcnRzLm1hcChzID0+IHNlYXJjaC5zdWJzdHJpbmcocykpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0cyA9IHNlYXJjaE5vZGVzXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihuID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGVybXMuc29tZSh0ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuLnNlYXJjaFRlcm1zLnNvbWUoc3QgPT4gc3QuaW5kZXhPZih0KSA9PT0gMCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYysrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMgPj0gc3RhcnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWFyY2hNZW51LnNldERhdGEocmVzdWx0cy5tYXAobiA9PlxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBNZW51SXRlbShuLnRlcm1zLmpvaW4oXCIsIFwiKSwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcC5jdHhNZW51Lm9wZW5Ob2RlKG4ubm9kZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJTZWFyY2goKTtcclxuICAgICAgICAgICAgICAgICAgICB9KSkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWFyY2hNZW51Lm9wZW4oKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLkNsZWFyTWVudXMsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSB0aGlzLnNlYXJjaElucHV0KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJTZWFyY2goKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNsZWFyU2VhcmNoKCkge1xyXG4gICAgICAgICAgICB0aGlzLnNlYXJjaElucHV0LnZhbHVlID0gXCJcIjtcclxuICAgICAgICAgICAgdGhpcy5zZWFyY2hNZW51LmhpZGUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgdXBkYXRlTm9kZUluZm8oc2VsZWN0b3I6IHN0cmluZywgbm9kZTogTm9kZSkge1xyXG4gICAgICAgICAgICB2YXIgZWwgPSA8SFRNTEVsZW1lbnQ+dGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAobm9kZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBlbC50ZXh0Q29udGVudCA9IG5vZGUubG9uZ05hbWU7XHJcbiAgICAgICAgICAgICAgICBlbC5vbmNsaWNrID0gKCkgPT4gdGhpcy5hcHAuY3R4TWVudS5vcGVuTm9kZShub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVsLnRleHRDb250ZW50ID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIGVsLm9uY2xpY2sgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHVwZGF0ZVBhdGgoKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZDogRWxlbWVudDtcclxuICAgICAgICAgICAgd2hpbGUgKChjaGlsZCA9IHRoaXMucGF0aENvbnRhaW5lci5maXJzdEVsZW1lbnRDaGlsZCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGF0aENvbnRhaW5lci5yZW1vdmVDaGlsZChjaGlsZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwYXRoTm9kZTogUGF0aE5vZGUgPSB0aGlzLmFwcC5jb250ZXh0LnBhdGhFbmQ7XHJcbiAgICAgICAgICAgIHRoaXMucGF0aENvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gcGF0aE5vZGUgPyBcImJsb2NrXCIgOiBcIm5vbmVcIjtcclxuICAgICAgICAgICAgd2hpbGUgKHBhdGhOb2RlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhdGhDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMuZHJhd1BhdGhOb2RlKHBhdGhOb2RlKSwgdGhpcy5wYXRoQ29udGFpbmVyLmZpcnN0RWxlbWVudENoaWxkKTtcclxuICAgICAgICAgICAgICAgIHBhdGhOb2RlID0gcGF0aE5vZGUucHJldjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgZHJhd1BhdGhOb2RlKHBhdGhOb2RlOiBQYXRoTm9kZSk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBpY29uOiBzdHJpbmcsIHRleHQ6IHN0cmluZywgbGlua1RleHQ6IHN0cmluZztcclxuICAgICAgICAgICAgdmFyIG5vZGUgPSBwYXRoTm9kZS5ub2RlO1xyXG4gICAgICAgICAgICB2YXIgZWRnZSA9IHBhdGhOb2RlLnByZXZFZGdlO1xyXG4gICAgICAgICAgICBpZiAoZWRnZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbjogc3RyaW5nO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVkZ2UudHlwZSA9PT0gXCJ3YWxrXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBcIldhbGtcIjtcclxuICAgICAgICAgICAgICAgICAgICBpY29uID0gXCJjb21wYXNzXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmZWF0ID0gdGhpcy5hcHAuZmVhdHVyZXMuYnlOYW1lW2VkZ2UudHlwZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZlYXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gZmVhdC52ZXJiIHx8IGZlYXQubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbiA9IGZlYXQuaWNvbjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBlZGdlLnR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb24gPSBcInF1ZXN0aW9uXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRleHQgPSBgICR7YWN0aW9ufSB0byBgO1xyXG4gICAgICAgICAgICAgICAgbGlua1RleHQgPSBub2RlLnR5cGUgPT09IGVkZ2UudHlwZSA/IG5vZGUubmFtZSA6IG5vZGUubG9uZ05hbWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpY29uID0gXCJtYXAtbWFya2VyXCI7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gXCIgXCI7XHJcbiAgICAgICAgICAgICAgICBsaW5rVGV4dCA9IG5vZGUubG9uZ05hbWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlcIik7XHJcbiAgICAgICAgICAgIGkuY2xhc3NMaXN0LmFkZChcInBhdGgtaWNvblwiKTtcclxuICAgICAgICAgICAgaS5jbGFzc0xpc3QuYWRkKFwiZmFcIik7XHJcbiAgICAgICAgICAgIGkuY2xhc3NMaXN0LmFkZChcImZhLVwiICsgaWNvbik7XHJcbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKGkpO1xyXG5cclxuICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dCkpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICAgICAgYS50ZXh0Q29udGVudCA9IGxpbmtUZXh0O1xyXG4gICAgICAgICAgICBhLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmFwcC5jdHhNZW51Lm9wZW5Ob2RlKG5vZGUpO1xyXG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChhKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBlbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgZHJhd0ZlYXR1cmVzKCkge1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5mZWF0dXJlcy5mb3JFYWNoKGYgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IFwiZmVhdHVyZS1yb3dcIjtcclxuICAgICAgICAgICAgICAgIGVsLnRleHRDb250ZW50ID0gZi5uYW1lICsgXCI6XCI7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gXCJmZWF0dXJlLXRvZ2dsZS1jb250YWluZXJcIjtcclxuICAgICAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XHJcblxyXG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZHJhd0NoZWNrYm94KHZhbCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZi5oaWRkZW4gPSAhdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLkZlYXR1cmVDaGFuZ2UpO1xyXG4gICAgICAgICAgICAgICAgfSwgIWYuaGlkZGVuLCBcImZhLWV5ZVwiLCBcImZhLWV5ZS1zbGFzaFwiKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWYudmlzdWFsT25seSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdDaGVja2JveCh2YWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmLmRpc2FibGVkID0gIXZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uRmVhdHVyZUNoYW5nZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgIWYuZGlzYWJsZWQsIFwiZmEtY2hlY2stY2lyY2xlLW9cIiwgXCJmYS1jaXJjbGUtb1wiKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgaS5jbGFzc05hbWUgPSBcImZhIGZhLWljb24gZmEtY2lyY2xlLW8gZmVhdHVyZS10b2dnbGUgaGlkZGVuXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuZmVhdHVyZXNDb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgZHJhd0NoZWNrYm94KG9uY2hhbmdlOiAodmFsdWU6IGJvb2xlYW4pID0+IHZvaWQsIGluaXRpYWw6IGJvb2xlYW4sIGNsYXNzT246IHN0cmluZywgY2xhc3NPZmY6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICAgICAgdmFyIGNoZWNrZWQgPSBpbml0aWFsO1xyXG4gICAgICAgICAgICB2YXIgaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpXCIpO1xyXG4gICAgICAgICAgICBpLmNsYXNzTmFtZSA9IFwiZmEgZmEtaWNvbiBmZWF0dXJlLXRvZ2dsZVwiO1xyXG4gICAgICAgICAgICBpLmNsYXNzTGlzdC5hZGQoY2hlY2tlZCA/IGNsYXNzT24gOiBjbGFzc09mZik7XHJcbiAgICAgICAgICAgIGkub25jbGljayA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA9ICFjaGVja2VkO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpLmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NPZmYpO1xyXG4gICAgICAgICAgICAgICAgICAgIGkuY2xhc3NMaXN0LmFkZChjbGFzc09uKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaS5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzT24pO1xyXG4gICAgICAgICAgICAgICAgICAgIGkuY2xhc3NMaXN0LmFkZChjbGFzc09mZik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBvbmNoYW5nZShjaGVja2VkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJtb2R1bGUgVGVzcCB7XHJcbiAgICBleHBvcnQgY2xhc3MgRmVhdHVyZSB7XHJcbiAgICAgICAgbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIHZlcmI6IHN0cmluZztcclxuICAgICAgICBsb2NhdGlvbjogc3RyaW5nO1xyXG4gICAgICAgIHR5cGU6IHN0cmluZztcclxuICAgICAgICBpY29uOiBzdHJpbmc7XHJcbiAgICAgICAgZGlzYWJsZWQ6IGJvb2xlYW47XHJcbiAgICAgICAgaGlkZGVuOiBib29sZWFuO1xyXG4gICAgICAgIHZpc3VhbE9ubHk6IGJvb2xlYW47XHJcbiAgICB9XHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElGZWF0dXJlTGlzdCBleHRlbmRzIEFycmF5PEZlYXR1cmU+IHtcclxuICAgICAgICBieU5hbWU6IHsgW2tleTogc3RyaW5nXTogRmVhdHVyZSB9O1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBGZWF0dXJlcyB7XHJcbiAgICAgICAgc3RhdGljIGluaXQoKTogSUZlYXR1cmVMaXN0IHtcclxuICAgICAgICAgICAgdmFyIGZlYXR1cmVzID0gPElGZWF0dXJlTGlzdD5bXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiTWFyay9SZWNhbGxcIiwgdmVyYjogXCJSZWNhbGxcIiwgdHlwZTogXCJtYXJrXCIsIGljb246IFwiYm9sdFwiIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiTWFnZXMgR3VpbGRcIiwgdmVyYjogXCJHdWlsZCBHdWlkZVwiLCB0eXBlOiBcIm1hZ2VzLWd1aWxkXCIsIGljb246IFwiZXllXCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJTaWx0IFN0cmlkZXJcIiwgdmVyYjogXCJTaWx0IFN0cmlkZXJcIiwgdHlwZTogXCJzaWx0LXN0cmlkZXJcIiwgaWNvbjogXCJidWdcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIkJvYXRcIiwgbG9jYXRpb246IFwiRG9ja3NcIiwgdHlwZTogXCJib2F0XCIsIGljb246IFwic2hpcFwiIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiSG9sYW1heWFuIEJvYXRcIiwgbG9jYXRpb246IFwiRG9ja3NcIiwgdmVyYjogXCJCb2F0XCIsIHR5cGU6IFwiaG9sYW1heWFuXCIsIGljb246IFwic2hpcFwiIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiUHJvcHlsb24gQ2hhbWJlclwiLCB0eXBlOiBcInByb3B5bG9uXCIsIGljb246IFwiY29nXCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJHb25kb2xhXCIsIHR5cGU6IFwiZ29uZG9sYVwiLCBpY29uOiBcInNoaXBcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIkRpdmluZSBJbnRlcnZlbnRpb25cIiwgbG9jYXRpb246IFwiSW1wZXJpYWwgQ3VsdCBTaHJpbmVcIiwgdHlwZTogXCJkaXZpbmVcIiwgaWNvbjogXCJib2x0XCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJBbG1zaXZpIEludGVydmVudGlvblwiLCBsb2NhdGlvbjogXCJUcmlidW5hbCBUZW1wbGVcIiwgdHlwZTogXCJhbG1zaXZpXCIsIGljb246IFwiYm9sdFwiIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiVHJhbnNwb3J0IGxpbmVzXCIsIHR5cGU6IFwidHJhbnNwb3J0LWVkZ2VcIiwgdmlzdWFsT25seTogdHJ1ZSB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIkxvY2F0aW9uc1wiLCB0eXBlOiBcIm5vZGVcIiwgdmlzdWFsT25seTogdHJ1ZSB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIkludGVydmVudGlvbiBhcmVhIGJvcmRlclwiLCB0eXBlOiBcImFyZWFcIiwgdmlzdWFsT25seTogdHJ1ZSB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIkdyaWRsaW5lc1wiLCB0eXBlOiBcImdyaWRcIiwgdmlzdWFsT25seTogdHJ1ZSB9XHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgIGZlYXR1cmVzLmJ5TmFtZSA9IHt9O1xyXG4gICAgICAgICAgICB2YXIgZklkeCA9IGZlYXR1cmVzLmJ5TmFtZTtcclxuICAgICAgICAgICAgZmVhdHVyZXMuZm9yRWFjaChmID0+IGZJZHhbZi50eXBlXSA9IGYpO1xyXG4gICAgICAgICAgICBmSWR4W1widHJhbnNwb3J0LWVkZ2VcIl0uaGlkZGVuID0gZklkeFtcImFyZWFcIl0uaGlkZGVuID0gZklkeFtcImdyaWRcIl0uaGlkZGVuID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIGZlYXR1cmVzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIm1vZHVsZSBUZXNwIHtcclxuICAgIC8qKiBUaGUgbWFwIFVJICovXHJcbiAgICBleHBvcnQgY2xhc3MgTWFwIHtcclxuICAgICAgICBwcml2YXRlIGVkZ2VDb250YWluZXI6IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIHByaXZhdGUgbm9kZUNvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBhcmVhQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcclxuICAgICAgICBwcml2YXRlIHBhdGhDb250YWluZXI6IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIHByaXZhdGUgZ3JpZENvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBzb3VyY2VFbGVtOiBIVE1MRWxlbWVudDtcclxuICAgICAgICBwcml2YXRlIGRlc3RFbGVtOiBIVE1MRWxlbWVudDtcclxuICAgICAgICBwcml2YXRlIG1hcmtFbGVtOiBIVE1MRWxlbWVudDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcGxpY2F0aW9uLCBwcml2YXRlIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmFkZENoYW5nZUxpc3RlbmVyKENoYW5nZVJlYXNvbi5Tb3VyY2VDaGFuZ2UsICgpID0+IHRoaXMucmVuZGVyU291cmNlKCkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uRGVzdGluYXRpb25DaGFuZ2UsICgpID0+IHRoaXMucmVuZGVyRGVzdGluYXRpb24oKSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmFkZENoYW5nZUxpc3RlbmVyKENoYW5nZVJlYXNvbi5NYXJrQ2hhbmdlLCAoKSA9PiB0aGlzLnJlbmRlck1hcmsoKSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmFkZENoYW5nZUxpc3RlbmVyKENoYW5nZVJlYXNvbi5QYXRoVXBkYXRlLCAoKSA9PiB0aGlzLnJlbmRlclBhdGgoKSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmFkZENoYW5nZUxpc3RlbmVyKENoYW5nZVJlYXNvbi5GZWF0dXJlQ2hhbmdlLCAoKSA9PiB0aGlzLnVwZGF0ZUZlYXR1cmVzKCkpO1xyXG5cclxuICAgICAgICAgICAgZWxlbWVudC5vbmNsaWNrID0gZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldEV2ZW50Tm9kZShldik7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyQ29udGV4dE1lbnUoZXYsIG5vZGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgZWxlbWVudC5vbmNvbnRleHRtZW51ID0gZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFldi5zaGlmdEtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyQ29udGV4dE1lbnUoZXYpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnJlbmRlck5vZGVzKCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyUGF0aCgpO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlck1hcmsoKTtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRmVhdHVyZXMoKTtcclxuICAgICAgICAgICAgdGhpcy5pbml0RHJhZ1Njcm9sbCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBnZXRFdmVudE5vZGUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IDxIVE1MRWxlbWVudD5ldmVudC50YXJnZXQ7XHJcbiAgICAgICAgICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwibWFwLW5vZGVcIikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZCA9IHRhcmdldC5kYXRhc2V0W1wibm9kZUlkXCJdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hcHAud29ybGQuZmluZE5vZGVCeUlkKCtpZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHRyaWdnZXJDb250ZXh0TWVudShldjogTW91c2VFdmVudCwgbm9kZT86IE5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5hcHAuY3R4TWVudS5vcGVuKG5ldyBWZWMyKGV2LnBhZ2VYLCBldi5wYWdlWSksIG5vZGUgfHwgdGhpcy5nZXRFdmVudE5vZGUoZXYpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgaW5pdERyYWdTY3JvbGwoKSB7XHJcbiAgICAgICAgICAgIHZhciBpbWcgPSA8SFRNTEVsZW1lbnQ+dGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbWdcIik7XHJcbiAgICAgICAgICAgIHZhciBtb3VzZWRvd24gPSBmYWxzZSwgcHJldlg6IG51bWJlciwgcHJldlk6IG51bWJlcjtcclxuICAgICAgICAgICAgdmFyIHN0b3AgPSAoZXY6IE1vdXNlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIG1vdXNlZG93biA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudG9nZ2xlQm9keUNsYXNzKFwic2Nyb2xsaW5nXCIsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHZhciBzdGFydCA9IChldjogTW91c2VFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbW91c2Vkb3duID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHByZXZYID0gZXYuY2xpZW50WDtcclxuICAgICAgICAgICAgICAgIHByZXZZID0gZXYuY2xpZW50WTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRvZ2dsZUJvZHlDbGFzcyhcInNjcm9sbGluZ1wiLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaW1nLm9ubW91c2Vkb3duID0gZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGV2LmJ1dHRvbiA9PT0gMCAmJiBldi50YXJnZXQgPT09IGltZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0KGV2KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaW1nLm9ubW91c2V1cCA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChtb3VzZWRvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICBzdG9wKGV2KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpbWcub25tb3VzZW1vdmUgPSBldiA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1vdXNlZG93biAmJiBldi53aGljaCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0KGV2KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChtb3VzZWRvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXYud2hpY2ggIT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcChldik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsKHBhZ2VYT2Zmc2V0ICsgcHJldlggLSBldi5jbGllbnRYLCBwYWdlWU9mZnNldCArIHByZXZZIC0gZXYuY2xpZW50WSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZYID0gZXYuY2xpZW50WDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldlkgPSBldi5jbGllbnRZO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgcmVuZGVyTm9kZXMoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5vZGVDb250YWluZXIgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHRoaXMubm9kZUNvbnRhaW5lci5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMubm9kZUNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgIHRoaXMubm9kZUNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLm5vZGVDb250YWluZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC53b3JsZC5ub2Rlc1xyXG4gICAgICAgICAgICAgICAgLy8uY29uY2F0KHRoaXMuYXBwLndvcmxkLmxhbmRtYXJrcy5tYXAobCA9PiBsLnRhcmdldCkpXHJcbiAgICAgICAgICAgICAgICAuZm9yRWFjaChuID0+IHRoaXMubm9kZUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdOb2RlKG4pKSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5lZGdlQ29udGFpbmVyICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVkZ2VDb250YWluZXIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmVkZ2VDb250YWluZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmVkZ2VDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5lZGdlQ29udGFpbmVyKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAud29ybGQuZWRnZXMuZm9yRWFjaChlID0+XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVkZ2VDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kcmF3RWRnZShlLnNyY05vZGUucG9zLCBlLmRlc3ROb2RlLnBvcywgZS5zcmNOb2RlLnR5cGUsIFwibWFwLXRyYW5zcG9ydC1lZGdlXCIpKSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5hcmVhQ29udGFpbmVyICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmFyZWFDb250YWluZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5hcmVhQ29udGFpbmVyKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAud29ybGQuYXJlYXNcclxuICAgICAgICAgICAgICAgIC8vLmNvbmNhdCh0aGlzLmFwcC53b3JsZC5yZWdpb25zKVxyXG4gICAgICAgICAgICAgICAgLy8uY29uY2F0KHRoaXMuYXBwLndvcmxkLmxhbmRtYXJrcylcclxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0eXBlID0gYS50YXJnZXQudHlwZTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJldjogQ2VsbFJvdyA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLnJvd3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvdyA9IGEucm93c1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXYgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvdy54MSAhPT0gcHJldi54MSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXJlYUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdDZWxsRWRnZShyb3cueDEsIHJvdy55LCBwcmV2LngxLCByb3cueSwgdHlwZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvdy54MiAhPT0gcHJldi54Mikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXJlYUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdDZWxsRWRnZShyb3cueDIgKyAxLCByb3cueSwgcHJldi54MiArIDEsIHJvdy55LCB0eXBlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kcmF3Q2VsbEVkZ2Uocm93LngxLCByb3cueSwgcm93LngyICsgMSwgcm93LnksIHR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kcmF3Q2VsbEVkZ2Uocm93LngxLCByb3cueSwgcm93LngxLCByb3cueSArIDEsIHR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcmVhQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZHJhd0NlbGxFZGdlKHJvdy54MiArIDEsIHJvdy55LCByb3cueDIgKyAxLCByb3cueSArIDEsIHR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldiA9IHJvdztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYocHJldiAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kcmF3Q2VsbEVkZ2UocHJldi54MSwgcHJldi55ICsgMSwgcHJldi54MiArIDEsIHByZXYueSArIDEsIHR5cGUpKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBkcmF3Q2VsbEVkZ2UoeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlciwgdHlwZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRyYXdFZGdlKFZlYzIuZnJvbUNlbGwoeDEsIHkxKSwgVmVjMi5mcm9tQ2VsbCh4MiwgeTIpLCB0eXBlLCBcIm1hcC1hcmVhXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSByZW5kZXJQYXRoKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wYXRoQ29udGFpbmVyICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhdGhDb250YWluZXIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLnBhdGhDb250YWluZXIpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHBhdGhOb2RlOiBQYXRoTm9kZSA9IHRoaXMuYXBwLmNvbnRleHQucGF0aEVuZDtcclxuICAgICAgICAgICAgaWYgKHBhdGhOb2RlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGF0aENvbnRhaW5lciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMucGF0aENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnBhdGhDb250YWluZXIpO1xyXG4gICAgICAgICAgICB3aGlsZSAocGF0aE5vZGUgJiYgcGF0aE5vZGUucHJldikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXRoQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZHJhd0VkZ2UocGF0aE5vZGUubm9kZS5wb3MsIHBhdGhOb2RlLnByZXYubm9kZS5wb3MsIFwicGF0aFwiLCBcIm1hcC1cIiArIHBhdGhOb2RlLnByZXZFZGdlLnR5cGUpKTtcclxuICAgICAgICAgICAgICAgIHBhdGhOb2RlID0gcGF0aE5vZGUucHJldjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSByZW5kZXJNYXJrKCkge1xyXG4gICAgICAgICAgICB0aGlzLm1hcmtFbGVtID0gdGhpcy5hZGRPclVwZGF0ZU5vZGVFbGVtKHRoaXMuYXBwLmNvbnRleHQubWFya05vZGUsIHRoaXMubWFya0VsZW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIHJlbmRlclNvdXJjZSgpIHtcclxuICAgICAgICAgICAgdGhpcy5zb3VyY2VFbGVtID0gdGhpcy5hZGRPclVwZGF0ZU5vZGVFbGVtKHRoaXMuYXBwLmNvbnRleHQuc291cmNlTm9kZSwgdGhpcy5zb3VyY2VFbGVtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSByZW5kZXJEZXN0aW5hdGlvbigpIHtcclxuICAgICAgICAgICAgdGhpcy5kZXN0RWxlbSA9IHRoaXMuYWRkT3JVcGRhdGVOb2RlRWxlbSh0aGlzLmFwcC5jb250ZXh0LmRlc3ROb2RlLCB0aGlzLmRlc3RFbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgYWRkT3JVcGRhdGVOb2RlRWxlbShub2RlOiBOb2RlLCBlbGVtOiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICAgICAgaWYgKGVsZW0pXHJcbiAgICAgICAgICAgICAgICBlbGVtLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlICE9IG51bGxcclxuICAgICAgICAgICAgICAgID8gPEhUTUxFbGVtZW50PnRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmRyYXdOb2RlKG5vZGUpKVxyXG4gICAgICAgICAgICAgICAgOiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSByZW5kZXJHcmlkKCkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuZ3JpZENvbnRhaW5lcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ncmlkQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmdyaWRDb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGk6IG51bWJlciwgZWw6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDM3OyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChcIm1hcC1ncmlkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoXCJtYXAtZ3JpZC12XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsLnN0eWxlLmxlZnQgPSAoaSAqIENlbGwud2lkdGggKyBDZWxsLndpZHRoT2Zmc2V0KSArIFwicHhcIjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyaWRDb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDQyOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChcIm1hcC1ncmlkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoXCJtYXAtZ3JpZC1oXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsLnN0eWxlLnRvcCA9IChpICogQ2VsbC5oZWlnaHQgKyBDZWxsLmhlaWdodE9mZnNldCkgKyBcInB4XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkQ29udGFpbmVyLmFwcGVuZENoaWxkKGVsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBzaG93IGdyaWQgY29vcmRpbmF0ZXNcclxuICAgICAgICAgICAgICAgIC8qZm9yIChpID0gMDsgaSA8IDM3OyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDQyOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnRleHRDb250ZW50ID0gaSArICcsJyArIGo7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZS5jb2xvciA9IFwicmdiYSgyNTUsMjU1LDI1NSwwLjc1KVwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZS5sZWZ0ID0gKGkgKiA0NC41ICsgMjIpICsgXCJweFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZS50b3AgPSAoaiAqIDQ0LjYgKyAzNykgKyBcInB4XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnN0eWxlLnpJbmRleCA9IFwiMTBcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc3R5bGUuZm9udCA9IFwiN3B0IHNhbnMtc2VyaWZcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkQ29udGFpbmVyLmFwcGVuZENoaWxkKGVsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9Ki9cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSB1cGRhdGVGZWF0dXJlcygpIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9IFwiXCI7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmZlYXR1cmVzLmZvckVhY2goZiA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZi5oaWRkZW4pXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJoaWRlLVwiICsgZi50eXBlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGRyYXdOb2RlKG5vZGU6IE5vZGUpOiBIVE1MRWxlbWVudCAge1xyXG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcIm1hcC1ub2RlXCIpO1xyXG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJtYXAtXCIgKyBub2RlLnR5cGUpO1xyXG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmxlZnQgPSBub2RlLnBvcy54ICsgXCJweFwiO1xyXG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLnRvcCA9IG5vZGUucG9zLnkgKyBcInB4XCI7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuZGF0YXNldFtcIm5vZGVJZFwiXSA9IChub2RlLnJlZmVyZW5jZUlkIHx8IG5vZGUuaWQpICsgXCJcIjtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGRyYXdFZGdlKG4xOiBWZWMyLCBuMjogVmVjMiwgdHlwZTogc3RyaW5nLCBzdWJ0eXBlPzogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xyXG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcIm1hcC1lZGdlXCIpO1xyXG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJtYXAtXCIgKyB0eXBlKTtcclxuICAgICAgICAgICAgaWYgKHN1YnR5cGUpXHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoc3VidHlwZSk7XHJcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBuMS5kaXN0YW5jZShuMik7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9ICgobjEueCArIG4yLngpIC8gMikgLSAobGVuZ3RoIC8gMikgKyBcInB4XCI7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUudG9wID0gKChuMS55ICsgbjIueSkgLyAyKSAtIDEgKyBcInB4XCI7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUud2lkdGggPSBsZW5ndGggKyBcInB4XCI7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gYHJvdGF0ZSgke01hdGguYXRhbjIobjEueSAtIG4yLnksIG4xLnggLSBuMi54KX1yYWQpYDtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwibW9kdWxlIFRlc3Age1xyXG4gICAgZXhwb3J0IGNsYXNzIE1lbnVJdGVtIHtcclxuICAgICAgICBzdGF0aWMgc2VwYXJhdG9yID0gbmV3IE1lbnVJdGVtKFwiXCIpO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbGFiZWw6IHN0cmluZywgcHVibGljIGZ1bmM/OiAoKSA9PiB2b2lkKSB7IH1cclxuICAgIH1cclxuICAgIGV4cG9ydCBjbGFzcyBNZW51IHtcclxuICAgICAgICBlbGVtZW50OiBIVE1MRWxlbWVudDtcclxuXHJcbiAgICAgICAgcHJpdmF0ZSBsaXN0ZW5lcjogQ2hhbmdlTGlzdGVuZXI7XHJcbiAgICAgICAgcHJpdmF0ZSBkaXNwb3NlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwbGljYXRpb24sIGZpeGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIgPSB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uQ2xlYXJNZW51cywgKCkgPT4gdGhpcy5oaWRlKCkpO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSBcIm1lbnVcIjtcclxuICAgICAgICAgICAgaWYgKGZpeGVkKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJmaXhlZFwiKTtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lm9ubW91c2Vkb3duID0gZXYgPT4gZXYuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5lbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGlzcG9zZWQpIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy5hcHAucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5saXN0ZW5lcik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0U3R5bGUoKTogQ1NTU3R5bGVEZWNsYXJhdGlvbiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRpc3Bvc2VkID8gbnVsbCA6IHRoaXMuZWxlbWVudC5zdHlsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldERhdGEoaXRlbXM6IE1lbnVJdGVtW10pIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGlzcG9zZWQpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xyXG4gICAgICAgICAgICB2YXIgY2hpbGQ6IEVsZW1lbnQ7XHJcbiAgICAgICAgICAgIHdoaWxlICgoY2hpbGQgPSB0aGlzLmVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQpICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5yZW1vdmVDaGlsZChjaGlsZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQobGkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gPT09IE1lbnVJdGVtLnNlcGFyYXRvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpLmNsYXNzTmFtZSA9IFwic2VwYXJhdG9yXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpLnRleHRDb250ZW50ID0gaXRlbS5sYWJlbDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5mdW5jICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGkuY2xhc3NOYW1lID0gXCJsaW5rXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpLm9ubW91c2Vkb3duID0gZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmZ1bmMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvcGVuKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5kaXNwb3NlZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5DbGVhck1lbnVzKTtcclxuICAgICAgICAgICAgaWYodGhpcy5lbGVtZW50LmZpcnN0RWxlbWVudENoaWxkICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwiaW5oZXJpdFwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBoaWRlKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5kaXNwb3NlZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIm1vZHVsZSBUZXNwIHtcclxuICAgIGV4cG9ydCBjbGFzcyBQYXRoRWRnZSB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIHRhcmdldDogUGF0aE5vZGUsIHB1YmxpYyBjb3N0OiBudW1iZXIsIHB1YmxpYyB0eXBlOiBzdHJpbmcpIHsgfVxyXG4gICAgfVxyXG4gICAgZXhwb3J0IGNsYXNzIFBhdGhOb2RlIHtcclxuICAgICAgICBkaXN0OiBudW1iZXI7XHJcbiAgICAgICAgcHJldjogUGF0aE5vZGU7XHJcbiAgICAgICAgcHJldkVkZ2U6IFBhdGhFZGdlO1xyXG4gICAgICAgIGVkZ2VzOiBQYXRoRWRnZVtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbm9kZTogTm9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLmRpc3QgPSBJbmZpbml0eTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFBhdGgge1xyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIHNwZWxsQ29zdDogbnVtYmVyID0gNTtcclxuXHJcbiAgICAgICAgc3RhdGljIGZpbmRQYXRoKGFwcDogQXBwbGljYXRpb24pIHtcclxuICAgICAgICAgICAgdmFyIHdvcmxkID0gYXBwLndvcmxkO1xyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IGFwcC5jb250ZXh0O1xyXG5cclxuICAgICAgICAgICAgLy8gY3JlYXRlIG5vZGVzXHJcbiAgICAgICAgICAgIHZhciBub2RlTWFwOiB7IFtrZXk6IG51bWJlcl06IFBhdGhOb2RlIH0gPSB7fTtcclxuICAgICAgICAgICAgdmFyIGZlYXRzID0gYXBwLmZlYXR1cmVzLmJ5TmFtZTtcclxuICAgICAgICAgICAgdmFyIG5vZGVzOiBQYXRoTm9kZVtdID0gd29ybGQubm9kZXNcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIobiA9PiAhZmVhdHNbbi50eXBlXS5kaXNhYmxlZCAmJiBuICE9PSBjb250ZXh0LnNvdXJjZU5vZGUgJiYgbiAhPT0gY29udGV4dC5kZXN0Tm9kZSlcclxuICAgICAgICAgICAgICAgIC5tYXAobiA9PiBub2RlTWFwW24uaWRdID0gbmV3IFBhdGhOb2RlKG4pKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBuZXcgUGF0aE5vZGUoY29udGV4dC5zb3VyY2VOb2RlKTtcclxuICAgICAgICAgICAgc291cmNlLmRpc3QgPSAwO1xyXG4gICAgICAgICAgICBub2Rlcy5wdXNoKHNvdXJjZSk7XHJcbiAgICAgICAgICAgIG5vZGVNYXBbY29udGV4dC5zb3VyY2VOb2RlLmlkXSA9IHNvdXJjZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkZXN0ID0gbmV3IFBhdGhOb2RlKGNvbnRleHQuZGVzdE5vZGUpO1xyXG4gICAgICAgICAgICBub2Rlcy5wdXNoKGRlc3QpO1xyXG4gICAgICAgICAgICBub2RlTWFwW2NvbnRleHQuZGVzdE5vZGUuaWRdID0gZGVzdDtcclxuXHJcbiAgICAgICAgICAgIHZhciBtYXhDb3N0ID0gY29udGV4dC5zb3VyY2VOb2RlLnBvcy5kaXN0YW5jZShjb250ZXh0LmRlc3ROb2RlLnBvcyk7XHJcblxyXG4gICAgICAgICAgICAvLyBleHBsaWNpdCBlZGdlcyAoc2VydmljZXMpXHJcbiAgICAgICAgICAgIG5vZGVzLmZvckVhY2gobiA9PlxyXG4gICAgICAgICAgICAgICAgbi5lZGdlcyA9IG4ubm9kZS5lZGdlc1xyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoZSA9PiAhZmVhdHNbZS5kZXN0Tm9kZS50eXBlXS5kaXNhYmxlZClcclxuICAgICAgICAgICAgICAgICAgICAubWFwKGUgPT4gbmV3IFBhdGhFZGdlKG5vZGVNYXBbKGUuc3JjTm9kZSA9PT0gbi5ub2RlID8gZS5kZXN0Tm9kZSA6IGUuc3JjTm9kZSkuaWRdLCBlLmNvc3QsIG4ubm9kZS50eXBlKSkpO1xyXG5cclxuICAgICAgICAgICAgLy8gaW1wbGljaXQgZWRnZXMgKHdhbGtpbmcpXHJcbiAgICAgICAgICAgIG5vZGVzLmZvckVhY2gobiA9PlxyXG4gICAgICAgICAgICAgICAgbi5lZGdlcyA9IG4uZWRnZXMuY29uY2F0KG5vZGVzXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihuMiA9PiBuMiAhPT0gbiAmJiAhbi5lZGdlcy5zb21lKGUgPT4gZS50YXJnZXQgPT09IG4yKSlcclxuICAgICAgICAgICAgICAgICAgICAubWFwKG4yID0+IG5ldyBQYXRoRWRnZShuMiwgbi5ub2RlLnBvcy5kaXN0YW5jZShuMi5ub2RlLnBvcyksIFwid2Fsa1wiKSlcclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGUgPT4gZS5jb3N0IDw9IG1heENvc3QpKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBtYXJrXHJcbiAgICAgICAgICAgIGlmIChjb250ZXh0Lm1hcmtOb2RlICE9IG51bGwgJiYgIWZlYXRzW1wibWFya1wiXS5kaXNhYmxlZCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1uID0gbmV3IFBhdGhOb2RlKGNvbnRleHQubWFya05vZGUpO1xyXG4gICAgICAgICAgICAgICAgbW4uZWRnZXMgPSBub2Rlcy5maWx0ZXIobiA9PiBuICE9PSBzb3VyY2UpXHJcbiAgICAgICAgICAgICAgICAgICAgLm1hcChuID0+IG5ldyBQYXRoRWRnZShuLCBtbi5ub2RlLnBvcy5kaXN0YW5jZShuLm5vZGUucG9zKSwgXCJ3YWxrXCIpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoZSA9PiBlLmNvc3QgPCBtYXhDb3N0KTtcclxuICAgICAgICAgICAgICAgIHNvdXJjZS5lZGdlcy5wdXNoKG5ldyBQYXRoRWRnZShtbiwgUGF0aC5zcGVsbENvc3QsIFwibWFya1wiKSk7XHJcbiAgICAgICAgICAgICAgICBub2Rlcy5wdXNoKG1uKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gaW50ZXJ2ZW50aW9uXHJcbiAgICAgICAgICAgIG5vZGVzLmZvckVhY2gobiA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2VsbCA9IENlbGwuZnJvbVBvc2l0aW9uKG4ubm9kZS5wb3MpO1xyXG4gICAgICAgICAgICAgICAgd29ybGQuYXJlYXMuZm9yRWFjaChhID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZlYXRzW2EudGFyZ2V0LnR5cGVdLmRpc2FibGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhLmNvbnRhaW5zQ2VsbChjZWxsKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm9kZSBpbnNpZGUgYXJlYSwgdGVsZXBvcnQgdG8gdGVtcGxlL3NocmluZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbi5lZGdlcy5wdXNoKG5ldyBQYXRoRWRnZShub2RlTWFwW2EudGFyZ2V0LmlkXSwgUGF0aC5zcGVsbENvc3QsIGEudGFyZ2V0LnR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vZGUgb3V0c2lkZSBhcmVhLCB3YWxrIHRvIGVkZ2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkaXN0OiBudW1iZXIgPSBJbmZpbml0eTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjbG9zZXN0OiBWZWMyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYS5yb3dzLmZvckVhY2gociA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdiBpcyBjbG9zZXN0IHBvaW50IChpbiBjZWxsIHVuaXRzKSBmcm9tIG5vZGUgdG8gcm93XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHYgPSBuZXcgVmVjMihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXgoTWF0aC5taW4oY2VsbC54LCByLngxICsgci53aWR0aCksIHIueDEpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1heChNYXRoLm1pbihjZWxsLnksIHIueSArIDEpLCByLnkpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWx0ID0gY2VsbC5kaXN0YW5jZSh2KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWx0IDwgZGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXN0ID0gYWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9zZXN0ID0gdjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwb3MgPSBWZWMyLmZyb21DZWxsKGNsb3Nlc3QueCwgY2xvc2VzdC55KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb3N0ID0gbi5ub2RlLnBvcy5kaXN0YW5jZShwb3MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvc3QgPCBtYXhDb3N0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV3IG5vZGUgdG8gYWxsb3cgdXMgdG8gdGVsZXBvcnQgb25jZSB3ZSdyZSBpbiB0aGUgYXJlYVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmZWF0ID0gYXBwLmZlYXR1cmVzLmJ5TmFtZVthLnRhcmdldC50eXBlXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IGAke2ZlYXQubmFtZX0gcmFuZ2Ugb2YgJHthLnRhcmdldC5uYW1lfWA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFuID0gbmV3IFBhdGhOb2RlKG5ldyBOb2RlKG5hbWUsIG5hbWUsIHBvcywgXCJhcmVhXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbi5lZGdlcyA9IFtuZXcgUGF0aEVkZ2Uobm9kZU1hcFthLnRhcmdldC5pZF0sIFBhdGguc3BlbGxDb3N0LCBhLnRhcmdldC50eXBlKV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZXMucHVzaChhbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbi5lZGdlcy5wdXNoKG5ldyBQYXRoRWRnZShhbiwgY29zdCwgXCJ3YWxrXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHZhciBxOiBQYXRoTm9kZVtdID0gbm9kZXMuc2xpY2UoKTtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChxLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHEuc29ydCgoYSwgYikgPT4gYi5kaXN0IC0gYS5kaXN0KTtcclxuICAgICAgICAgICAgICAgIHZhciB1ID0gcS5wb3AoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHUuZWRnZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZSA9IHUuZWRnZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHYgPSBlLnRhcmdldDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWx0ID0gdS5kaXN0ICsgZS5jb3N0O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhbHQgPCB2LmRpc3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdi5kaXN0ID0gYWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2LnByZXYgPSB1O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2LnByZXZFZGdlID0gZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIm1vZHVsZSBUZXNwIHtcclxuICAgIGV4cG9ydCB0eXBlIFRyYW5zcG9ydFNvdXJjZSA9IHsgW2tleTogc3RyaW5nXTogSU5vZGVTb3VyY2VbXSB9O1xyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJV29ybGRTb3VyY2Uge1xyXG4gICAgICAgIHRyYW5zcG9ydDogVHJhbnNwb3J0U291cmNlO1xyXG4gICAgICAgIHJlZ2lvbnM6IElOb2RlU291cmNlW107XHJcbiAgICAgICAgbGFuZG1hcmtzOiBJTm9kZVNvdXJjZVtdO1xyXG4gICAgfVxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJTm9kZVNvdXJjZSB7XHJcbiAgICAgICAgbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIHg6IG51bWJlcjtcclxuICAgICAgICB5OiBudW1iZXI7XHJcbiAgICAgICAgZWRnZXM6IG51bWJlcltdO1xyXG4gICAgICAgIG9uZVdheUVkZ2VzOiBudW1iZXJbXTtcclxuICAgICAgICB0b3A6IG51bWJlcjtcclxuICAgICAgICBjZWxsczogbnVtYmVyW11bXTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogU3RhdGljIGFzc2V0cyBhbmQgbG9jYXRpb25zICovXHJcbiAgICBleHBvcnQgY2xhc3MgV29ybGQge1xyXG4gICAgICAgIG5vZGVzOiBOb2RlW107XHJcbiAgICAgICAgZWRnZXM6IEVkZ2VbXTtcclxuICAgICAgICBhcmVhczogQXJlYVtdO1xyXG4gICAgICAgIHJlZ2lvbnM6IEFyZWFbXTtcclxuICAgICAgICBsYW5kbWFya3M6IEFyZWFbXTtcclxuXHJcbiAgICAgICAgcHJpdmF0ZSBub2Rlc0J5SWQ6IHsgW2tleTogbnVtYmVyXTogTm9kZSB9ID0ge307XHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgdHJhbnNwb3J0Q29zdDogbnVtYmVyID0gMTA7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXBwOiBBcHBsaWNhdGlvbiwgZGF0YTogSVdvcmxkU291cmNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMubm9kZXMgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5lZGdlcyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLmFyZWFzID0gW107XHJcblxyXG4gICAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhkYXRhLnRyYW5zcG9ydCkuZm9yRWFjaChrID0+IHRoaXMubG9hZFRyYW5zcG9ydChkYXRhLnRyYW5zcG9ydCwgaykpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZ2lvbnMgPSBkYXRhLnJlZ2lvbnMubWFwKGEgPT4gV29ybGQubWFrZUFyZWEobmV3IE5vZGUoYS5uYW1lLCBhLm5hbWUsIG5ldyBWZWMyKDAsIDApLCBcInJlZ2lvblwiKSwgYSkpO1xyXG4gICAgICAgICAgICB0aGlzLmxhbmRtYXJrcyA9IGRhdGEubGFuZG1hcmtzLm1hcChhID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBub2RlID0gbmV3IE5vZGUoYS5uYW1lLCBhLm5hbWUsIG5ldyBWZWMyKDAsIDApLCBcImxhbmRtYXJrXCIpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyZWEgPSBXb3JsZC5tYWtlQXJlYShub2RlLCBhKTtcclxuICAgICAgICAgICAgICAgIC8vIHNldCBub2RlIGxvY2F0aW9uIHRvIGF2ZXJhZ2UgY2VudGVyIHBvaW50IG9mIGFsbCBjZWxsc1xyXG4gICAgICAgICAgICAgICAgdmFyIHN1bVg6IG51bWJlciA9IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3VtWTogbnVtYmVyID0gMDtcclxuICAgICAgICAgICAgICAgIHZhciBjb3VudDogbnVtYmVyID0gMDtcclxuICAgICAgICAgICAgICAgIGFyZWEucm93cy5mb3JFYWNoKHIgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHN1bVggKz0gKHIueDEgKyByLndpZHRoIC8gMikgKiByLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgIHN1bVkgKz0gKHIueSArIDAuNSkgKiByLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvdW50ICs9IHIud2lkdGg7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIG5vZGUucG9zID0gVmVjMi5mcm9tQ2VsbChzdW1YIC8gY291bnQsIHN1bVkgLyBjb3VudCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJlYTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBpbmRleCBieSBpZFxyXG4gICAgICAgICAgICB0aGlzLm5vZGVzQnlJZCA9IHt9O1xyXG4gICAgICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2gobiA9PiB0aGlzLm5vZGVzQnlJZFtuLmlkXSA9IG4pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbG9hZFRyYW5zcG9ydChkYXRhOiBUcmFuc3BvcnRTb3VyY2UsIHR5cGU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgYXJyYXk6IElOb2RlU291cmNlW10gPSBkYXRhW3R5cGVdO1xyXG4gICAgICAgICAgICB2YXIgZmVhdCA9IHRoaXMuYXBwLmZlYXR1cmVzLmJ5TmFtZVt0eXBlXTtcclxuICAgICAgICAgICAgdmFyIHR5cGVOYW1lID0gZmVhdC5sb2NhdGlvbiB8fCBmZWF0Lm5hbWU7XHJcbiAgICAgICAgICAgIHZhciBub2RlczogTm9kZVtdID0gYXJyYXkubWFwKG4gPT4gbmV3IE5vZGUobi5uYW1lLCBgJHt0eXBlTmFtZX0sICR7bi5uYW1lfWAsIG5ldyBWZWMyKG4ueCwgbi55KSwgdHlwZSwgdHJ1ZSkpO1xyXG4gICAgICAgICAgICB0aGlzLm5vZGVzID0gdGhpcy5ub2Rlcy5jb25jYXQobm9kZXMpO1xyXG4gICAgICAgICAgICB2YXIgY29zdCA9IFdvcmxkLnRyYW5zcG9ydENvc3Q7XHJcbiAgICAgICAgICAgIGFycmF5LmZvckVhY2goKG4sIGkxKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbjEgPSBub2Rlc1tpMV07XHJcbiAgICAgICAgICAgICAgICBpZiAobi5lZGdlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIG4uZWRnZXMuZm9yRWFjaChpMiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuMiA9IG5vZGVzW2kyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVkZ2UgPSBuZXcgRWRnZShuMSwgbjIsIGNvc3QpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuMS5lZGdlcy5wdXNoKGVkZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuMi5lZGdlcy5wdXNoKGVkZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVkZ2VzLnB1c2goZWRnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobi5vbmVXYXlFZGdlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIG4ub25lV2F5RWRnZXMuZm9yRWFjaChpMiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlZGdlID0gbmV3IEVkZ2UobjEsIG5vZGVzW2kyXSwgY29zdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG4xLmVkZ2VzLnB1c2goZWRnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZWRnZXMucHVzaChlZGdlKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChuLmNlbGxzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcmVhcy5wdXNoKFdvcmxkLm1ha2VBcmVhKG4xLCBuKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgbWFrZUFyZWEobm9kZTogTm9kZSwgZGF0YTogSU5vZGVTb3VyY2UpIHtcclxuICAgICAgICAgICAgdmFyIHkgPSBkYXRhLnRvcCB8fCAwO1xyXG4gICAgICAgICAgICB2YXIgcm93cyA9IGRhdGEuY2VsbHMubWFwKGMgPT4gbmV3IENlbGxSb3coeSsrLCBjWzBdLCBjWzFdKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQXJlYShub2RlLCByb3dzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpbmROb2RlQnlJZChpZDogbnVtYmVyKTogTm9kZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5vZGVzQnlJZFtpZF0gfHwgbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldFJlZ2lvbk5hbWUocG9zOiBWZWMyKTogc3RyaW5nIHtcclxuICAgICAgICAgICAgdmFyIGFyZWEgPSBXb3JsZC5nZXRBcmVhQnlDZWxsKHRoaXMucmVnaW9ucywgQ2VsbC5mcm9tUG9zaXRpb24ocG9zKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBhcmVhICE9IG51bGwgPyBhcmVhLnRhcmdldC5uYW1lIDogbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZ2V0TGFuZG1hcmtOYW1lKHBvczogVmVjMik6IHN0cmluZyB7XHJcbiAgICAgICAgICAgIHZhciBhcmVhID0gV29ybGQuZ2V0QXJlYUJ5Q2VsbCh0aGlzLmxhbmRtYXJrcywgQ2VsbC5mcm9tUG9zaXRpb24ocG9zKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBhcmVhICE9IG51bGwgPyBhcmVhLnRhcmdldC5uYW1lIDogbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgZ2V0QXJlYUJ5Q2VsbChzb3VyY2U6IEFyZWFbXSwgY2VsbDogVmVjMik6IEFyZWEge1xyXG4gICAgICAgICAgICB2YXIgYXJlYTogQXJlYTtcclxuICAgICAgICAgICAgaWYgKHNvdXJjZS5zb21lKHIgPT4gci5jb250YWluc0NlbGwoY2VsbCkgJiYgKGFyZWEgPSByKSAhPSBudWxsKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBhcmVhO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iXSwic291cmNlUm9vdCI6Ii4uL3RzIn0=