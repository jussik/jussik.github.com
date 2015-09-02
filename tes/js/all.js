var Tesp;
(function (Tesp) {
    (function (ChangeReason) {
        ChangeReason[ChangeReason["SourceChange"] = 0] = "SourceChange";
        ChangeReason[ChangeReason["DestinationChange"] = 1] = "DestinationChange";
        ChangeReason[ChangeReason["MarkChange"] = 2] = "MarkChange";
        ChangeReason[ChangeReason["FeatureChange"] = 3] = "FeatureChange";
        ChangeReason[ChangeReason["PathUpdate"] = 4] = "PathUpdate";
    })(Tesp.ChangeReason || (Tesp.ChangeReason = {}));
    var ChangeReason = Tesp.ChangeReason;
    /** Core TESPathfinder application */
    var Application = (function () {
        function Application() {
            var _this = this;
            this.listeners = [];
            this.loaded = window.fetch("data/data.json")
                .then(function (res) { return res.json(); })
                .then(function (data) {
                _this.context = new Tesp.Context(_this);
                _this.features = Tesp.Features.init();
                _this.world = new Tesp.World(_this, data);
                _this.map = new Tesp.Map(_this, document.getElementById("map"));
                _this.controls = new Tesp.Controls(_this, document.getElementById("controls"));
                _this.menu = new Tesp.ContextMenu(_this, document.getElementById("context-menu"));
                document.body.onmousedown = document.body.oncontextmenu = function () {
                    // TODO: refactor into their respective classes
                    _this.menu.hide();
                    _this.controls.clearSearch();
                };
                _this.toggleBodyClass("loading", false);
                return _this;
            });
        }
        /** Listen for application level changes */
        Application.prototype.addChangeListener = function (listener) {
            this.listeners.push(listener);
        };
        /** Inform all listeners about a new change */
        Application.prototype.triggerChange = function (reason) {
            this.listeners.forEach(function (fn) { return fn(reason); });
        };
        /** Toggle a class attribute name in the document body */
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
    /** The current instance of the application, for debugging purposes only */
    Tesp.app = new Application();
})(Tesp || (Tesp = {}));
var Tesp;
(function (Tesp) {
    /** 2-dimensional floating point vector */
    var Vec2 = (function () {
        function Vec2(x, y) {
            this.x = x;
            this.y = y;
        }
        /** Calculate the euclidean distance between this vector and another */
        Vec2.prototype.distance = function (other) {
            return Math.sqrt(((other.x - this.x) * (other.x - this.x)) + ((other.y - this.y) * (other.y - this.y)));
        };
        /** Calculate the top-left corner of a cell as a position vector */
        Vec2.fromCell = function (x, y) {
            return new Vec2(x * Cell.width + Cell.widthOffset, y * Cell.height + Cell.heightOffset);
        };
        return Vec2;
    })();
    Tesp.Vec2 = Vec2;
    /** A single significant point in the world */
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
    /** A link between two nodes */
    var Edge = (function () {
        function Edge(srcNode, destNode, cost) {
            this.srcNode = srcNode;
            this.destNode = destNode;
            this.cost = cost;
        }
        return Edge;
    })();
    Tesp.Edge = Edge;
    /** A large area in the world */
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
    /** A single row of cells */
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
    /** An area of one or more cells */
    var Area = (function () {
        function Area(target, rows) {
            this.target = target;
            this.rows = rows;
            this.minY = rows[0].y;
            this.maxY = rows[rows.length - 1].y;
        }
        /** Check if this cell contains the supplied coordinates */
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
    /** The current mutable state of the application */
    var Context = (function () {
        function Context(app) {
            var _this = this;
            this.app = app;
            this.app.addChangeListener(function (reason) {
                if (reason === Tesp.ChangeReason.SourceChange
                    || reason === Tesp.ChangeReason.DestinationChange
                    || reason === Tesp.ChangeReason.FeatureChange) {
                    _this.findPath();
                }
                if (reason === Tesp.ChangeReason.MarkChange) {
                    _this.findPath();
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
    /** Manages the context menu of the map */
    var ContextMenu = (function () {
        function ContextMenu(app, element) {
            var _this = this;
            this.app = app;
            this.element = element;
            this.isOpen = false;
            this.element.oncontextmenu = this.element.onmousedown = function (ev) { return ev.stopPropagation(); };
            this.element.onclick = function (ev) {
                ev.stopPropagation();
                var item = event.target;
                if (item.classList.contains("link")) {
                    var context = item.dataset["contextSet"];
                    if (context !== undefined) {
                        var data = _this.element.dataset;
                        var nodeId = data["nodeId"];
                        var node;
                        if (nodeId !== undefined && (node = _this.app.world.findNodeById(+nodeId)) != null) {
                            _this.app.context.setContextNode(context, node);
                        }
                        else {
                            _this.app.context.setContextLocation(context, new Tesp.Vec2(+data["posX"], +data["posY"]));
                        }
                    }
                    else {
                        context = item.dataset["contextUnset"];
                        if (context !== undefined) {
                            _this.app.context.clearContext(context);
                        }
                    }
                    _this.hide();
                }
            };
        }
        ContextMenu.prototype.openNode = function (node) {
            this.open(node.pos, node);
        };
        ContextMenu.prototype.open = function (pos, node) {
            var _this = this;
            // remove node if neither it or its reference are permanent
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
            var separator = this.element.getElementsByClassName("separator")[0];
            var child;
            while ((child = this.element.firstElementChild) !== separator) {
                this.element.removeChild(child);
            }
            lines.forEach(function (l) {
                var item = document.createElement("li");
                item.className = "link";
                item.textContent = l;
                _this.element.insertBefore(item, separator);
            });
            this.element.style.left = pos.x + "px";
            this.element.style.top = pos.y + "px";
            var data = this.element.dataset;
            if (node != null) {
                data["nodeId"] = node.id + "";
                delete data["posX"];
                delete data["posY"];
            }
            else {
                data["posX"] = pos.x + "";
                data["posY"] = pos.y + "";
                delete data["nodeId"];
            }
            this.element.style.display = "inherit";
            var scrollX = pageXOffset, scrollY = pageYOffset;
            var rect = this.element.getBoundingClientRect();
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
            this.isOpen = true;
        };
        ContextMenu.prototype.hide = function () {
            if (this.isOpen) {
                this.element.style.display = "none";
                this.isOpen = false;
            }
        };
        return ContextMenu;
    })();
    Tesp.ContextMenu = ContextMenu;
})(Tesp || (Tesp = {}));
var Tesp;
(function (Tesp) {
    /** UI controls for search and navigation */
    var Controls = (function () {
        function Controls(app, element) {
            var _this = this;
            this.app = app;
            this.element = element;
            this.app.addChangeListener(function (reason) {
                if (reason === Tesp.ChangeReason.PathUpdate)
                    _this.updatePath();
                else if (reason === Tesp.ChangeReason.SourceChange)
                    _this.updateNodeInfo(".control-source-info", _this.app.context.sourceNode);
                else if (reason === Tesp.ChangeReason.DestinationChange)
                    _this.updateNodeInfo(".control-destination-info", _this.app.context.destNode);
                else if (reason === Tesp.ChangeReason.MarkChange)
                    _this.updateNodeInfo(".control-mark-info", _this.app.context.markNode);
            });
            this.pathContainer = element.querySelector(".path-container");
            this.featuresContainer = element.querySelector(".features-container");
            this.searchInput = element.querySelector(".search-input");
            this.searchBox = element.querySelector(".search-results");
            var featuresVisible = false;
            element.querySelector(".settings-icon").onclick = function () {
                return _this.featuresContainer.style.display = (featuresVisible = !featuresVisible) ? "block" : "none";
            };
            function prepTerm(text) {
                return text != null ? text.toLowerCase().replace(/[^a-z]+/g, " ") : null;
            }
            var searchNodes = this.app.world.nodes
                .concat(this.app.world.landmarks.map(function (a) { return a.target; }))
                .map(function (n) {
                var feat = _this.app.features.byName[n.type];
                var featName = feat != null ? feat.location || feat.name : null;
                return {
                    name: prepTerm(n.name),
                    location: prepTerm(featName),
                    node: n,
                    feature: featName
                };
            })
                .sort(function (a, b) { return a.name.localeCompare(b.name); })
                .sort(function (a, b) { return (a.location || "").localeCompare(b.location || ""); });
            this.drawFeatures();
            this.searchInput.oninput = function () {
                var child;
                while ((child = _this.searchBox.firstElementChild) != null) {
                    _this.searchBox.removeChild(child);
                }
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
                        if (n.name.indexOf(t) === 0 || n.location != null && n.location.indexOf(t) === 0)
                            c++;
                        return c >= starts.length;
                    });
                });
                _this.searchBox.style.display = results.length > 0 ? "inherit" : "none";
                results.forEach(function (n) {
                    var item = document.createElement("li");
                    item.className = "link";
                    item.textContent = n.feature ? n.node.name + ", " + n.feature : n.node.name;
                    item.onclick = function () {
                        _this.app.menu.openNode(n.node);
                        _this.clearSearch();
                    };
                    item.onmousedown = function (ev) { return ev.stopPropagation(); };
                    _this.searchBox.appendChild(item);
                });
                var input = _this.searchInput.getBoundingClientRect();
                _this.searchBox.style.top = (input.top + input.height) + "px";
                _this.searchBox.style.left = input.left + "px";
            };
        }
        Controls.prototype.clearSearch = function () {
            this.searchInput.value = "";
            this.searchBox.style.display = "none";
        };
        Controls.prototype.updateNodeInfo = function (selector, node) {
            var _this = this;
            var el = this.element.querySelector(selector);
            if (node != null) {
                el.textContent = node.longName;
                el.onclick = function () { return _this.app.menu.openNode(node); };
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
            a.onclick = function () { return _this.app.menu.openNode(node); };
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
                { name: "Transport lines", type: "edge", visualOnly: true },
                { name: "Locations", type: "node", visualOnly: true },
                { name: "Intervention area border", type: "area", visualOnly: true },
                { name: "Gridlines", type: "grid", visualOnly: true }
            ];
            features.byName = {};
            var fIdx = features.byName;
            features.forEach(function (f) { return fIdx[f.type] = f; });
            fIdx["edge"].hidden = fIdx["area"].hidden = fIdx["grid"].hidden = true;
            return features;
        };
        return Features;
    })();
    Tesp.Features = Features;
})(Tesp || (Tesp = {}));
var Tesp;
(function (Tesp) {
    /** The map UI */
    var Map = (function () {
        function Map(app, element) {
            var _this = this;
            this.app = app;
            this.element = element;
            this.app.addChangeListener(function (reason) {
                if (reason === Tesp.ChangeReason.PathUpdate)
                    _this.renderPath();
                else if (reason === Tesp.ChangeReason.SourceChange)
                    _this.renderSource();
                else if (reason === Tesp.ChangeReason.DestinationChange)
                    _this.renderDestination();
                else if (reason === Tesp.ChangeReason.MarkChange)
                    _this.renderMark();
                else if (reason === Tesp.ChangeReason.FeatureChange)
                    _this.updateFeatures();
            });
            element.onclick = function (ev) {
                var node = _this.getEventNode(ev);
                if (node != null) {
                    _this.triggerContextMenu(ev, node);
                }
            };
            element.oncontextmenu = function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                _this.triggerContextMenu(ev);
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
            this.app.menu.open(new Tesp.Vec2(ev.pageX, ev.pageY), node || this.getEventNode(ev));
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
            // create nodes
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
            // explicit edges (services)
            nodes.forEach(function (n) {
                return n.edges = n.node.edges
                    .filter(function (e) { return !feats[e.srcNode.type].disabled; })
                    .map(function (e) { return new PathEdge(nodeMap[(e.srcNode === n.node ? e.destNode : e.srcNode).id], e.cost, n.node.type); });
            });
            // implicit edges (walking)
            nodes.forEach(function (n) {
                return n.edges = n.edges.concat(nodes
                    .filter(function (n2) { return n2 !== n && !n.edges.some(function (e) { return e.target === n2; }); })
                    .map(function (n2) { return new PathEdge(n2, n.node.pos.distance(n2.node.pos), "walk"); })
                    .filter(function (e) { return e.cost <= maxCost; }));
            });
            // mark
            if (context.markNode != null && !feats["mark"].disabled) {
                var mn = new PathNode(context.markNode);
                mn.edges = nodes.filter(function (n) { return n !== source; })
                    .map(function (n) { return new PathEdge(n, mn.node.pos.distance(n.node.pos), "walk"); })
                    .filter(function (e) { return e.cost < maxCost; });
                source.edges.push(new PathEdge(mn, Path.spellCost, "mark"));
                nodes.push(mn);
            }
            // intervention
            nodes.forEach(function (n) {
                var cell = Tesp.Cell.fromPosition(n.node.pos);
                world.areas.forEach(function (a) {
                    if (!feats[a.target.type].disabled) {
                        if (a.containsCell(cell)) {
                            // node inside area, teleport to temple/shrine
                            n.edges.push(new PathEdge(nodeMap[a.target.id], Path.spellCost, a.target.type));
                        }
                        else {
                            // node outside area, walk to edge
                            var dist = Infinity;
                            var closest;
                            a.rows.forEach(function (r) {
                                // v is closest point (in cell units) from node to row
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
                                // new node to allow us to teleport once we're in the area
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
    /** Static assets and locations */
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
                // set node location to average center point of all cells
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
            // index by id
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
//# sourceMappingURL=all.js.map