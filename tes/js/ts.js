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
            element.dataset["nodeId"] = (node.referenceId || node.id) + "";
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi50cyIsImNvbnRleHQudHMiLCJjb250ZXh0bWVudS50cyIsImNvbnRyb2xzLnRzIiwiZmVhdHVyZXMudHMiLCJtYXAudHMiLCJtZW51LnRzIiwicGF0aC50cyIsIndvcmxkLnRzIiwiX3JlZnMudHMiLCJhcHAudHMiXSwibmFtZXMiOlsiVGVzcCIsIlRlc3AuVmVjMiIsIlRlc3AuVmVjMi5jb25zdHJ1Y3RvciIsIlRlc3AuVmVjMi5kaXN0YW5jZSIsIlRlc3AuVmVjMi5mcm9tQ2VsbCIsIlRlc3AuTm9kZSIsIlRlc3AuTm9kZS5jb25zdHJ1Y3RvciIsIlRlc3AuRWRnZSIsIlRlc3AuRWRnZS5jb25zdHJ1Y3RvciIsIlRlc3AuQ2VsbCIsIlRlc3AuQ2VsbC5jb25zdHJ1Y3RvciIsIlRlc3AuQ2VsbC5mcm9tUG9zaXRpb24iLCJUZXNwLkNlbGxSb3ciLCJUZXNwLkNlbGxSb3cuY29uc3RydWN0b3IiLCJUZXNwLkFyZWEiLCJUZXNwLkFyZWEuY29uc3RydWN0b3IiLCJUZXNwLkFyZWEuY29udGFpbnNDZWxsIiwiVGVzcC5Db250ZXh0IiwiVGVzcC5Db250ZXh0LmNvbnN0cnVjdG9yIiwiVGVzcC5Db250ZXh0LnNldENvbnRleHRMb2NhdGlvbiIsIlRlc3AuQ29udGV4dC5zZXRDb250ZXh0Tm9kZSIsIlRlc3AuQ29udGV4dC5jbGVhckNvbnRleHQiLCJUZXNwLkNvbnRleHRNZW51IiwiVGVzcC5Db250ZXh0TWVudS5jb25zdHJ1Y3RvciIsIlRlc3AuQ29udGV4dE1lbnUuc2V0Q29udGV4dCIsIlRlc3AuQ29udGV4dE1lbnUub3Blbk5vZGUiLCJUZXNwLkNvbnRleHRNZW51Lm9wZW4iLCJUZXNwLkNvbnRleHRNZW51LmhpZGUiLCJUZXNwLkNvbnRyb2xzIiwiVGVzcC5Db250cm9scy5jb25zdHJ1Y3RvciIsIlRlc3AuQ29udHJvbHMuaW5pdFNlYXJjaCIsIlRlc3AuQ29udHJvbHMuaW5pdFNlYXJjaC5wcmVwVGVybSIsIlRlc3AuQ29udHJvbHMuY2xlYXJTZWFyY2giLCJUZXNwLkNvbnRyb2xzLnVwZGF0ZU5vZGVJbmZvIiwiVGVzcC5Db250cm9scy51cGRhdGVQYXRoIiwiVGVzcC5Db250cm9scy5kcmF3UGF0aE5vZGUiLCJUZXNwLkNvbnRyb2xzLmRyYXdGZWF0dXJlcyIsIlRlc3AuQ29udHJvbHMuZHJhd0NoZWNrYm94IiwiVGVzcC5GZWF0dXJlIiwiVGVzcC5GZWF0dXJlLmNvbnN0cnVjdG9yIiwiVGVzcC5GZWF0dXJlcyIsIlRlc3AuRmVhdHVyZXMuY29uc3RydWN0b3IiLCJUZXNwLkZlYXR1cmVzLmluaXQiLCJUZXNwLk1hcCIsIlRlc3AuTWFwLmNvbnN0cnVjdG9yIiwiVGVzcC5NYXAuZ2V0RXZlbnROb2RlIiwiVGVzcC5NYXAudHJpZ2dlckNvbnRleHRNZW51IiwiVGVzcC5NYXAuaW5pdERyYWdTY3JvbGwiLCJUZXNwLk1hcC5yZW5kZXJOb2RlcyIsIlRlc3AuTWFwLmRyYXdDZWxsRWRnZSIsIlRlc3AuTWFwLnJlbmRlclBhdGgiLCJUZXNwLk1hcC5yZW5kZXJNYXJrIiwiVGVzcC5NYXAucmVuZGVyU291cmNlIiwiVGVzcC5NYXAucmVuZGVyRGVzdGluYXRpb24iLCJUZXNwLk1hcC5hZGRPclVwZGF0ZU5vZGVFbGVtIiwiVGVzcC5NYXAucmVuZGVyR3JpZCIsIlRlc3AuTWFwLnVwZGF0ZUZlYXR1cmVzIiwiVGVzcC5NYXAuZHJhd05vZGUiLCJUZXNwLk1hcC5kcmF3RWRnZSIsIlRlc3AuTWVudUl0ZW0iLCJUZXNwLk1lbnVJdGVtLmNvbnN0cnVjdG9yIiwiVGVzcC5NZW51IiwiVGVzcC5NZW51LmNvbnN0cnVjdG9yIiwiVGVzcC5NZW51LmRpc3Bvc2UiLCJUZXNwLk1lbnUuZ2V0U3R5bGUiLCJUZXNwLk1lbnUuc2V0RGF0YSIsIlRlc3AuTWVudS5vcGVuIiwiVGVzcC5NZW51LmhpZGUiLCJUZXNwLlBhdGgiLCJUZXNwLlBhdGguY29uc3RydWN0b3IiLCJUZXNwLlBhdGguZmluZFBhdGgiLCJUZXNwLldvcmxkIiwiVGVzcC5Xb3JsZC5jb25zdHJ1Y3RvciIsIlRlc3AuV29ybGQubG9hZFRyYW5zcG9ydCIsIlRlc3AuV29ybGQubWFrZUFyZWEiLCJUZXNwLldvcmxkLmZpbmROb2RlQnlJZCIsIlRlc3AuV29ybGQuZ2V0UmVnaW9uTmFtZSIsIlRlc3AuV29ybGQuZ2V0TGFuZG1hcmtOYW1lIiwiVGVzcC5Xb3JsZC5nZXRBcmVhQnlDZWxsIiwiVGVzcC5DaGFuZ2VSZWFzb24iLCJUZXNwLkNoYW5nZUxpc3RlbmVyIiwiVGVzcC5DaGFuZ2VMaXN0ZW5lci5jb25zdHJ1Y3RvciIsIlRlc3AuQ2hhbmdlTGlzdGVuZXIudHJpZ2dlciIsIlRlc3AuQXBwbGljYXRpb24iLCJUZXNwLkFwcGxpY2F0aW9uLmNvbnN0cnVjdG9yIiwiVGVzcC5BcHBsaWNhdGlvbi5hZGRDaGFuZ2VMaXN0ZW5lciIsIlRlc3AuQXBwbGljYXRpb24ucmVtb3ZlQ2hhbmdlTGlzdGVuZXIiLCJUZXNwLkFwcGxpY2F0aW9uLnRyaWdnZXJDaGFuZ2UiLCJUZXNwLkFwcGxpY2F0aW9uLnRvZ2dsZUJvZHlDbGFzcyJdLCJtYXBwaW5ncyI6IkFBQUEsSUFBTyxJQUFJLENBd0dWO0FBeEdELFdBQU8sSUFBSSxFQUFDLENBQUM7SUFNVEE7UUFDSUMsY0FBbUJBLENBQWFBLEVBQVNBLENBQWFBO1lBQTFDQyxpQkFBb0JBLEdBQXBCQSxLQUFvQkE7WUFBRUEsaUJBQW9CQSxHQUFwQkEsS0FBb0JBO1lBQW5DQSxNQUFDQSxHQUFEQSxDQUFDQSxDQUFZQTtZQUFTQSxNQUFDQSxHQUFEQSxDQUFDQSxDQUFZQTtRQUFJQSxDQUFDQTtRQUdwREQsYUFBUUEsR0FBZkEsVUFBZ0JBLEdBQVVBLEVBQUVBLEdBQVVBO1lBQ2xDRSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNoR0EsQ0FBQ0E7UUFHTUYsYUFBUUEsR0FBZkEsVUFBZ0JBLENBQVNBLEVBQUVBLENBQVNBO1lBQ2hDRyxNQUFNQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQTtRQUM1RkEsQ0FBQ0E7UUFDTEgsV0FBQ0E7SUFBREEsQ0FaQUQsQUFZQ0MsSUFBQUQ7SUFaWUEsU0FBSUEsT0FZaEJBLENBQUFBO0lBYURBO1FBUUlLLGNBQW1CQSxJQUFZQSxFQUFTQSxRQUFnQkEsRUFBU0EsR0FBVUEsRUFBU0EsSUFBWUEsRUFBU0EsU0FBMEJBO1lBQWpDQyx5QkFBaUNBLEdBQWpDQSxpQkFBaUNBO1lBQWhIQSxTQUFJQSxHQUFKQSxJQUFJQSxDQUFRQTtZQUFTQSxhQUFRQSxHQUFSQSxRQUFRQSxDQUFRQTtZQUFTQSxRQUFHQSxHQUFIQSxHQUFHQSxDQUFPQTtZQUFTQSxTQUFJQSxHQUFKQSxJQUFJQSxDQUFRQTtZQUFTQSxjQUFTQSxHQUFUQSxTQUFTQSxDQUFpQkE7WUFDL0hBLElBQUlBLENBQUNBLEVBQUVBLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLEVBQUVBLENBQUNBO1lBQzFCQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNwQkEsQ0FBQ0E7UUFKY0QsYUFBUUEsR0FBV0EsQ0FBQ0EsQ0FBQ0E7UUFLeENBLFdBQUNBO0lBQURBLENBWkFMLEFBWUNLLElBQUFMO0lBWllBLFNBQUlBLE9BWWhCQSxDQUFBQTtJQUdEQTtRQUNJTyxjQUFtQkEsT0FBYUEsRUFBU0EsUUFBY0EsRUFBU0EsSUFBWUE7WUFBekRDLFlBQU9BLEdBQVBBLE9BQU9BLENBQU1BO1lBQVNBLGFBQVFBLEdBQVJBLFFBQVFBLENBQU1BO1lBQVNBLFNBQUlBLEdBQUpBLElBQUlBLENBQVFBO1FBQUlBLENBQUNBO1FBQ3JGRCxXQUFDQTtJQUFEQSxDQUZBUCxBQUVDTyxJQUFBUDtJQUZZQSxTQUFJQSxPQUVoQkEsQ0FBQUE7SUFHREE7UUFBQVM7UUFRQUMsQ0FBQ0E7UUFIVUQsaUJBQVlBLEdBQW5CQSxVQUFvQkEsR0FBVUE7WUFDMUJFLE1BQU1BLENBQUNBLElBQUlBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLFlBQVlBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQ3hHQSxDQUFDQTtRQU5NRixVQUFLQSxHQUFXQSxJQUFJQSxDQUFDQTtRQUNyQkEsV0FBTUEsR0FBV0EsSUFBSUEsQ0FBQ0E7UUFDdEJBLGdCQUFXQSxHQUFXQSxFQUFFQSxDQUFDQTtRQUN6QkEsaUJBQVlBLEdBQVdBLEVBQUVBLENBQUNBO1FBSXJDQSxXQUFDQTtJQUFEQSxDQVJBVCxBQVFDUyxJQUFBVDtJQVJZQSxTQUFJQSxPQVFoQkEsQ0FBQUE7SUFTREE7UUFHSVksaUJBQW1CQSxDQUFTQSxFQUFTQSxFQUFVQSxFQUFTQSxFQUFVQTtZQUEvQ0MsTUFBQ0EsR0FBREEsQ0FBQ0EsQ0FBUUE7WUFBU0EsT0FBRUEsR0FBRkEsRUFBRUEsQ0FBUUE7WUFBU0EsT0FBRUEsR0FBRkEsRUFBRUEsQ0FBUUE7WUFDOURBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLEVBQUVBLEdBQUdBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBO1FBQzdCQSxDQUFDQTtRQUNMRCxjQUFDQTtJQUFEQSxDQU5BWixBQU1DWSxJQUFBWjtJQU5ZQSxZQUFPQSxVQU1uQkEsQ0FBQUE7SUFTREE7UUFJSWMsY0FBbUJBLE1BQVlBLEVBQVNBLElBQWdCQTtZQUFyQ0MsV0FBTUEsR0FBTkEsTUFBTUEsQ0FBTUE7WUFBU0EsU0FBSUEsR0FBSkEsSUFBSUEsQ0FBWUE7WUFDcERBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxDQUFDQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN4Q0EsQ0FBQ0E7UUFHREQsMkJBQVlBLEdBQVpBLFVBQWFBLEdBQVVBO1lBQ25CRSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxJQUFJQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUN4Q0EsQ0FBQ0E7UUFDTUYsaUJBQVlBLEdBQW5CQSxVQUFvQkEsSUFBV0EsRUFBRUEsR0FBVUE7WUFDdkNFLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUM5Q0EsSUFBSUEsR0FBR0EsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ25EQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxJQUFJQSxHQUFHQSxDQUFDQSxFQUFFQSxJQUFJQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNqREEsQ0FBQ0E7WUFDREEsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0E7UUFDakJBLENBQUNBO1FBQ0xGLFdBQUNBO0lBQURBLENBcEJBZCxBQW9CQ2MsSUFBQWQ7SUFwQllBLFNBQUlBLE9Bb0JoQkEsQ0FBQUE7QUFDTEEsQ0FBQ0EsRUF4R00sSUFBSSxLQUFKLElBQUksUUF3R1Y7QUN4R0QsQUFDQSxnQ0FEZ0M7QUFDaEMsSUFBTyxJQUFJLENBcURWO0FBckRELFdBQU8sSUFBSSxFQUFDLENBQUM7SUFFVEE7UUFLSWlCLGlCQUFvQkEsR0FBZ0JBO1lBTHhDQyxpQkFrRENBO1lBN0N1QkEsUUFBR0EsR0FBSEEsR0FBR0EsQ0FBYUE7WUFDaENBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLGlCQUFpQkEsQ0FBQ0EsaUJBQVlBLENBQUNBLFVBQVVBLEVBQUVBO2dCQUNoREEsS0FBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsVUFBVUEsRUFBRUEsS0FBSUEsQ0FBQ0EsUUFBUUEsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDaEVBLENBQUNBLENBQUNBLENBQUNBO1FBQ1BBLENBQUNBO1FBRURELG9DQUFrQkEsR0FBbEJBLFVBQW1CQSxPQUFlQSxFQUFFQSxHQUFVQTtZQUMxQ0UsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDcEZBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLEtBQUtBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBO2dCQUN2QkEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsS0FBS0EsQ0FBQ0E7Z0JBQ3JCQSxJQUFJQSxDQUFDQSxjQUFjQSxDQUFDQSxPQUFPQSxFQUFFQSxJQUFJQSxTQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxHQUFHQSxFQUFFQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN0RUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsS0FBS0EsYUFBYUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ25DQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxrQkFBa0JBLENBQUNBO2dCQUNsQ0EsSUFBSUEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsT0FBT0EsRUFBRUEsSUFBSUEsU0FBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsR0FBR0EsRUFBRUEsYUFBYUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0VBLENBQUNBO1lBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLEtBQUtBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO2dCQUM1QkEsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsSUFBSUEsU0FBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsR0FBR0EsRUFBRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2xEQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxhQUFhQSxDQUFDQSxpQkFBWUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7WUFDcERBLENBQUNBO1FBQ0xBLENBQUNBO1FBQ0RGLGdDQUFjQSxHQUFkQSxVQUFlQSxPQUFlQSxFQUFFQSxJQUFXQTtZQUN2Q0csRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsS0FBS0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3ZCQSxJQUFJQSxDQUFDQSxVQUFVQSxHQUFHQSxJQUFJQSxDQUFDQTtnQkFDdkJBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLGFBQWFBLENBQUNBLGlCQUFZQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQTtZQUN0REEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsS0FBS0EsYUFBYUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ25DQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQTtnQkFDckJBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLGFBQWFBLENBQUNBLGlCQUFZQSxDQUFDQSxpQkFBaUJBLENBQUNBLENBQUNBO1lBQzNEQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxLQUFLQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDNUJBLElBQUlBLEdBQUdBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBO2dCQUNuQkEsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsSUFBSUEsU0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsUUFBUUEsRUFBRUEsR0FBR0EsRUFBRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3BFQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxXQUFXQSxHQUFHQSxJQUFJQSxDQUFDQSxXQUFXQSxJQUFJQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQTtnQkFDeERBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLGFBQWFBLENBQUNBLGlCQUFZQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtZQUNwREEsQ0FBQ0E7UUFDTEEsQ0FBQ0E7UUFDREgsOEJBQVlBLEdBQVpBLFVBQWFBLE9BQWVBO1lBQ3hCSSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxLQUFLQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDdkJBLElBQUlBLENBQUNBLFVBQVVBLEdBQUdBLElBQUlBLENBQUNBO2dCQUN2QkEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsaUJBQVlBLENBQUNBLFlBQVlBLENBQUNBLENBQUNBO1lBQ3REQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxLQUFLQSxhQUFhQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDbkNBLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBO2dCQUNyQkEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsaUJBQVlBLENBQUNBLGlCQUFpQkEsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLENBQUNBO1lBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLEtBQUtBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO2dCQUM1QkEsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0E7Z0JBQ3JCQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxhQUFhQSxDQUFDQSxpQkFBWUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7WUFDcERBLENBQUNBO1FBQ0xBLENBQUNBO1FBQ0xKLGNBQUNBO0lBQURBLENBbERBakIsQUFrRENpQixJQUFBakI7SUFsRFlBLFlBQU9BLFVBa0RuQkEsQ0FBQUE7QUFDTEEsQ0FBQ0EsRUFyRE0sSUFBSSxLQUFKLElBQUksUUFxRFY7QUN0REQsQUFDQSxnQ0FEZ0M7QUFDaEMsSUFBTyxJQUFJLENBdUdWO0FBdkdELFdBQU8sSUFBSSxFQUFDLENBQUM7SUFFVEE7UUFRSXNCLHFCQUFvQkEsR0FBZ0JBO1lBUnhDQyxpQkFvR0NBO1lBNUZ1QkEsUUFBR0EsR0FBSEEsR0FBR0EsQ0FBYUE7WUFDaENBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLElBQUlBLFNBQUlBLENBQUNBLEdBQUdBLEVBQUVBLEtBQUtBLENBQUNBLENBQUNBO1lBRWpDQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQTtnQkFDVEEsYUFBUUEsQ0FBQ0EsU0FBU0E7Z0JBQ2xCQSxJQUFJQSxhQUFRQSxDQUFDQSxvQkFBb0JBLEVBQUVBLGNBQU1BLE9BQUFBLEtBQUlBLENBQUNBLFVBQVVBLENBQUNBLFFBQVFBLENBQUNBLEVBQXpCQSxDQUF5QkEsQ0FBQ0E7Z0JBQ25FQSxJQUFJQSxhQUFRQSxDQUFDQSxrQkFBa0JBLEVBQUVBLGNBQU1BLE9BQUFBLEtBQUlBLENBQUNBLFVBQVVBLENBQUNBLGFBQWFBLENBQUNBLEVBQTlCQSxDQUE4QkEsQ0FBQ0E7Z0JBQ3RFQSxJQUFJQSxhQUFRQSxDQUFDQSxlQUFlQSxFQUFFQSxjQUFNQSxPQUFBQSxLQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxNQUFNQSxDQUFDQSxFQUF2QkEsQ0FBdUJBLENBQUNBO2FBQy9EQSxDQUFDQTtZQUNGQSxJQUFJQSxDQUFDQSxVQUFVQSxHQUFHQSxJQUFJQSxhQUFRQSxDQUFDQSxhQUFhQSxFQUFFQSxjQUFNQSxPQUFBQSxLQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxZQUFZQSxDQUFDQSxNQUFNQSxDQUFDQSxFQUFyQ0EsQ0FBcUNBLENBQUNBLENBQUNBO1FBQy9GQSxDQUFDQTtRQUVPRCxnQ0FBVUEsR0FBbEJBLFVBQW1CQSxPQUFlQTtZQUM5QkUsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3BCQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxjQUFjQSxDQUFDQSxPQUFPQSxFQUFFQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUN4REEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLGtCQUFrQkEsQ0FBQ0EsT0FBT0EsRUFBRUEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLENBQUNBO1FBQ0xBLENBQUNBO1FBRURGLDhCQUFRQSxHQUFSQSxVQUFTQSxJQUFXQTtZQUNoQkcsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDOUJBLENBQUNBO1FBQ0RILDBCQUFJQSxHQUFKQSxVQUFLQSxHQUFVQSxFQUFFQSxJQUFXQTtZQUV4QkksRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsSUFBSUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2xDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxXQUFXQSxJQUFJQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDM0JBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBO2dCQUNoQkEsQ0FBQ0E7Z0JBQUNBLElBQUlBLENBQUNBLENBQUNBO29CQUNKQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxZQUFZQSxDQUFDQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtvQkFDckRBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLElBQUlBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBO3dCQUNsQ0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7b0JBQ2hCQSxDQUFDQTtnQkFDTEEsQ0FBQ0E7WUFDTEEsQ0FBQ0E7WUFFREEsSUFBSUEsS0FBS0EsR0FBYUEsRUFBRUEsQ0FBQ0E7WUFDekJBLElBQUlBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLGVBQWVBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ25EQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxJQUFJQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDZkEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQy9DQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxJQUFJQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDZkEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7b0JBQ3ZDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDMUJBLENBQUNBO2dCQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtvQkFDSkEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7Z0JBQzlCQSxDQUFDQTtnQkFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsSUFBSUEsSUFBSUEsSUFBSUEsUUFBUUEsS0FBS0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQzdDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtnQkFDekJBLENBQUNBO2dCQUNEQSxHQUFHQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQTtZQUNuQkEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzFCQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtZQUN6QkEsQ0FBQ0E7WUFDREEsSUFBSUEsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDL0NBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLElBQUlBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO2dCQUNqQkEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7WUFDbkNBLENBQUNBO1lBRURBLElBQUlBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ2ZBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBO1lBRWpCQSxJQUFJQSxLQUFLQSxHQUFHQSxLQUFLQSxDQUFDQSxHQUFHQSxDQUFDQSxVQUFBQSxDQUFDQSxJQUFJQSxPQUFBQSxJQUFJQSxhQUFRQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFmQSxDQUFlQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtZQUMvREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsUUFBUUEsSUFBSUEsSUFBSUEsQ0FBQ0E7Z0JBQ2xDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtZQUNoQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFDekJBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO1lBRWpCQSxJQUFJQSxTQUFTQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQTtZQUNyQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0E7WUFDOUJBLFNBQVNBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBO1lBRTdCQSxJQUFJQSxPQUFPQSxHQUFHQSxXQUFXQSxDQUFDQTtZQUMxQkEsSUFBSUEsT0FBT0EsR0FBR0EsV0FBV0EsQ0FBQ0E7WUFDMUJBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLHFCQUFxQkEsRUFBRUEsQ0FBQ0E7WUFDckRBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO2dCQUNqQkEsT0FBT0EsR0FBR0EsV0FBV0EsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDM0NBLENBQUNBO1lBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLFVBQVVBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO2dCQUN0Q0EsT0FBT0EsR0FBR0EsV0FBV0EsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsVUFBVUEsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDekRBLENBQUNBO1lBRURBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO2dCQUNoQkEsT0FBT0EsR0FBR0EsV0FBV0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDMUNBLENBQUNBO1lBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLFdBQVdBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO2dCQUN4Q0EsT0FBT0EsR0FBR0EsV0FBV0EsR0FBR0EsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsV0FBV0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDM0RBLENBQUNBO1lBRURBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLEtBQUtBLFdBQVdBLElBQUlBLE9BQU9BLEtBQUtBLFdBQVdBLENBQUNBO2dCQUNuREEsTUFBTUEsQ0FBQ0EsT0FBT0EsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDakNBLENBQUNBO1FBQ0RKLDBCQUFJQSxHQUFKQTtZQUNJSyxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtRQUNyQkEsQ0FBQ0E7UUFDTEwsa0JBQUNBO0lBQURBLENBcEdBdEIsQUFvR0NzQixJQUFBdEI7SUFwR1lBLGdCQUFXQSxjQW9HdkJBLENBQUFBO0FBQ0xBLENBQUNBLEVBdkdNLElBQUksS0FBSixJQUFJLFFBdUdWO0FDeEdELEFBQ0EsZ0NBRGdDO0FBQ2hDLElBQU8sSUFBSSxDQXNQVjtBQXRQRCxXQUFPLElBQUksRUFBQyxDQUFDO0lBRVRBO1FBT0k0QixrQkFBb0JBLEdBQWdCQSxFQUFVQSxPQUFvQkE7WUFQdEVDLGlCQW1QQ0E7WUE1T3VCQSxRQUFHQSxHQUFIQSxHQUFHQSxDQUFhQTtZQUFVQSxZQUFPQSxHQUFQQSxPQUFPQSxDQUFhQTtZQUM5REEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxpQkFBWUEsQ0FBQ0EsWUFBWUEsRUFBRUEsY0FBTUEsT0FBQUEsS0FBSUEsQ0FBQ0EsY0FBY0EsQ0FBQ0Esc0JBQXNCQSxFQUFFQSxLQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFVQSxDQUFDQSxFQUF4RUEsQ0FBd0VBLENBQUNBLENBQUNBO1lBQ3RJQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxpQkFBaUJBLENBQUNBLGlCQUFZQSxDQUFDQSxpQkFBaUJBLEVBQUVBLGNBQU1BLE9BQUFBLEtBQUlBLENBQUNBLGNBQWNBLENBQUNBLDJCQUEyQkEsRUFBRUEsS0FBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsRUFBM0VBLENBQTJFQSxDQUFDQSxDQUFDQTtZQUM5SUEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxpQkFBWUEsQ0FBQ0EsVUFBVUEsRUFBRUEsY0FBTUEsT0FBQUEsS0FBSUEsQ0FBQ0EsY0FBY0EsQ0FBQ0Esb0JBQW9CQSxFQUFFQSxLQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxDQUFDQSxFQUFwRUEsQ0FBb0VBLENBQUNBLENBQUNBO1lBQ2hJQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxpQkFBaUJBLENBQUNBLGlCQUFZQSxDQUFDQSxVQUFVQSxFQUFFQSxVQUFDQSxNQUFNQSxFQUFFQSxRQUFRQSxJQUFLQSxPQUFBQSxLQUFJQSxDQUFDQSxVQUFVQSxDQUFZQSxRQUFRQSxDQUFDQSxFQUFwQ0EsQ0FBb0NBLENBQUNBLENBQUNBO1lBRWhIQSxJQUFJQSxDQUFDQSxhQUFhQSxHQUFnQkEsT0FBT0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxDQUFDQTtZQUMzRUEsSUFBSUEsQ0FBQ0EsaUJBQWlCQSxHQUFnQkEsT0FBT0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EscUJBQXFCQSxDQUFDQSxDQUFDQTtZQUNuRkEsSUFBSUEsQ0FBQ0EsV0FBV0EsR0FBcUJBLE9BQU9BLENBQUNBLGFBQWFBLENBQUNBLGVBQWVBLENBQUNBLENBQUNBO1lBQzVFQSxJQUFJQSxhQUFhQSxHQUFxQkEsT0FBT0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EseUJBQXlCQSxDQUFDQSxDQUFDQTtZQUN2RkEsYUFBYUEsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsWUFBWUEsRUFBRUEsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDeEVBLGFBQWFBLENBQUNBLE9BQU9BLEdBQUdBO2dCQUNwQkEsS0FBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsWUFBWUEsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsS0FBS0EsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JFQSxLQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxhQUFhQSxDQUFDQSxpQkFBWUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0E7WUFDdkRBLENBQUNBLENBQUNBO1lBRUZBLElBQUlBLGVBQWVBLEdBQUdBLEtBQUtBLENBQUNBO1lBQ2RBLE9BQU9BLENBQUNBLGFBQWFBLENBQUNBLGdCQUFnQkEsQ0FBRUEsQ0FBQ0EsT0FBT0EsR0FBR0E7dUJBQzdEQSxLQUFJQSxDQUFDQSxpQkFBaUJBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLEdBQUdBLENBQUNBLGVBQWVBLEdBQUdBLENBQUNBLGVBQWVBLENBQUNBLEdBQUdBLE9BQU9BLEdBQUdBLE1BQU1BO1lBQTlGQSxDQUE4RkEsQ0FBQ0E7WUFFbkdBLElBQUlBLENBQUNBLFVBQVVBLEVBQUVBLENBQUNBO1FBQ3RCQSxDQUFDQTtRQUVERCw2QkFBVUEsR0FBVkE7WUFBQUUsaUJBd0ZDQTtZQXZGR0EsSUFBSUEsZUFBZUEsR0FBcUJBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLGFBQWFBLENBQUNBLG1CQUFtQkEsQ0FBQ0EsQ0FBQ0E7WUFDeEZBLElBQUlBLENBQUNBLFVBQVVBLEdBQUdBLElBQUlBLFNBQUlBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1lBQzNDQSxJQUFJQSxTQUFTQSxHQUFHQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQTtZQUMzQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EscUJBQXFCQSxFQUFFQSxDQUFDQTtZQUNyREEsU0FBU0EsQ0FBQ0EsUUFBUUEsR0FBR0EsT0FBT0EsQ0FBQ0E7WUFDN0JBLFNBQVNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLEdBQUdBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLElBQUlBLENBQUNBO1lBQ2xEQSxTQUFTQSxDQUFDQSxLQUFLQSxHQUFHQSxDQUFDQSxlQUFlQSxDQUFDQSxXQUFXQSxHQUFHQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUVyRUEsa0JBQWtCQSxJQUFZQTtnQkFDMUJDLE1BQU1BLENBQUNBLElBQUlBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLFdBQVdBLEVBQUVBLENBQUNBLE9BQU9BLENBQUNBLFVBQVVBLEVBQUVBLEdBQUdBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBO1lBQzdFQSxDQUFDQTtZQUVERCxJQUFJQSxXQUFXQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQTtpQkFDakNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLFVBQUFBLENBQUNBLElBQUlBLE9BQUFBLENBQUNBLENBQUNBLE1BQU1BLEVBQVJBLENBQVFBLENBQUNBLENBQUNBO2lCQUNuREEsR0FBR0EsQ0FBQ0EsVUFBQUEsQ0FBQ0E7Z0JBQ0ZBLElBQUlBLElBQUlBLEdBQUdBLEtBQUlBLENBQUNBLEdBQUdBLENBQUNBLFFBQVFBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO2dCQUM1Q0EsSUFBSUEsUUFBUUEsR0FBR0EsSUFBSUEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsUUFBUUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7Z0JBQ2hFQSxJQUFJQSxLQUFLQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDckJBLEVBQUVBLENBQUNBLENBQUNBLFFBQVFBLElBQUlBLElBQUlBLENBQUNBO29CQUNqQkEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3pCQSxJQUFJQSxRQUFRQSxHQUFHQSxLQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxlQUFlQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtnQkFDckRBLEVBQUVBLENBQUNBLENBQUNBLFFBQVFBLElBQUlBLFFBQVFBLEtBQUtBLENBQUNBLENBQUNBLElBQUlBLENBQUNBO29CQUNoQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7Z0JBRXpCQSxNQUFNQSxDQUFDQTtvQkFDSEEsS0FBS0EsRUFBRUEsS0FBS0E7b0JBQ1pBLFdBQVdBLEVBQUVBLEtBQUtBLENBQUNBLEdBQUdBLENBQUNBLFVBQUFBLENBQUNBLElBQUlBLE9BQUFBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBLEVBQVhBLENBQVdBLENBQUNBO29CQUN4Q0EsSUFBSUEsRUFBRUEsQ0FBQ0E7aUJBQ1ZBLENBQUNBO1lBQ05BLENBQUNBLENBQUNBO2lCQUNEQSxJQUFJQSxDQUFDQSxVQUFDQSxDQUFDQSxFQUFFQSxDQUFDQTtnQkFDUEEsSUFBSUEsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsV0FBV0EsRUFBRUEsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsV0FBV0EsQ0FBQ0E7Z0JBQzNDQSxJQUFJQSxFQUFFQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxNQUFNQSxFQUFFQSxFQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtnQkFDeENBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEVBQUVBLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO29CQUMxQkEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7b0JBQ2pEQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTt3QkFDUkEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2pCQSxDQUFDQTtnQkFDREEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDYkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFFUEEsSUFBSUEsQ0FBQ0EsWUFBWUEsRUFBRUEsQ0FBQ0E7WUFFcEJBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLE9BQU9BLEdBQUdBO2dCQUN2QkEsSUFBSUEsTUFBTUEsR0FBR0EsS0FBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsV0FBV0EsRUFBRUEsQ0FBQ0E7Z0JBRWxEQSxJQUFJQSxNQUFNQSxHQUFhQSxFQUFFQSxDQUFDQTtnQkFDMUJBLElBQUlBLEtBQUtBLEdBQWFBLEVBQUVBLENBQUNBO2dCQUN6QkEsSUFBSUEsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0E7Z0JBQ2xCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtvQkFDckNBLElBQUlBLENBQUNBLEdBQUdBLE1BQU1BLENBQUNBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUM3QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsSUFBSUEsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3BCQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDVEEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQ2ZBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBO3dCQUNqQkEsQ0FBQ0E7b0JBQ0xBLENBQUNBO29CQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDZkEsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBQUEsQ0FBQ0EsSUFBSUEsT0FBQUEsTUFBTUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsRUFBdEJBLENBQXNCQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDOURBLEtBQUtBLEdBQUdBLEtBQUtBLENBQUNBO29CQUNsQkEsQ0FBQ0E7Z0JBQ0xBLENBQUNBO2dCQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDUkEsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBQUEsQ0FBQ0EsSUFBSUEsT0FB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Q0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsS0FBS0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3ZCQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQTtvQkFDaEJBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBO2dCQUNyQkEsQ0FBQ0E7Z0JBQUNBLElBQUlBLENBQUNBLENBQUNBO29CQUNKQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtvQkFDL0NBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO3dCQUNQQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQTt3QkFDaENBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLENBQUNBO29CQUNyQkEsQ0FBQ0E7b0JBQUNBLElBQUlBLENBQUNBLENBQUNBO3dCQUNKQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQTt3QkFDbkJBLElBQUlBLEdBQUdBLFVBQVVBLENBQUNBO29CQUN0QkEsQ0FBQ0E7Z0JBQ0xBLENBQUNBO2dCQUVEQSxJQUFJQSxHQUFHQSxNQUFJQSxNQUFNQSxTQUFNQSxDQUFDQTtnQkFDeEJBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLEtBQUtBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBO1lBQ25FQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDSkEsSUFBSUEsR0FBR0EsWUFBWUEsQ0FBQ0E7Z0JBQ3BCQSxJQUFJQSxHQUFHQSxHQUFHQSxDQUFDQTtnQkFDWEEsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7WUFDN0JBLENBQUNBO1lBRURBLElBQUlBLENBQUNB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RUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0E7Z0JBQ1JBLE9BQU9BLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1lBQ25DQSxJQUFJQSxNQUFNQSxHQUFHQSxTQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUNuQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0E7WUFDL0RBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBO1lBQ25EQSxPQUFPQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxHQUFHQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUNwQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsU0FBU0EsR0FBR0EsWUFBVUEsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsU0FBTUEsQ0FBQ0E7WUFDL0VBLE1BQU1BLENBQUNBLE9BQU9BLENBQUNBO1FBQ25CQSxDQUFDQTtRQUNMZixVQUFDQTtJQUFEQSxDQTFQQTNDLEFBMFBDMkMsSUFBQTNDO0lBMVBZQSxRQUFHQSxNQTBQZkEsQ0FBQUE7QUFDTEEsQ0FBQ0EsRUE3UE0sSUFBSSxLQUFKLElBQUksUUE2UFY7QUM5UEQsQUFD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RUEsQ0FBQ0EsQ0FBQ0EsRUFBckVBLENBQXFFQSxDQUFDQSxDQUFDQTtZQUM1R0EsSUFBSUEsQ0FBQ0EsU0FBU0EsR0FBR0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBQUEsQ0FBQ0E7Z0JBQ2pDQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxTQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxTQUFJQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQTtnQkFDaEVBLElBQUlBLElBQUlBLEdBQUdBLEtBQUtBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO2dCQUVuQ0EsSUFBSUEsSUFBSUEsR0FBV0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JCQSxJQUFJQSxJQUFJQSxHQUFXQSxDQUFDQSxDQUFDQTtnQkFDckJBLElBQUlBLEtBQUtBLEdBQVdBLENBQUNBLENBQUNBO2dCQUN0QkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQUEsQ0FBQ0E7b0JBQ2ZBLElBQUlBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBO29CQUN2Q0EsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0E7b0JBQzlCQSxLQUFLQSxJQUFJQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQTtnQkFDckJBLENBQUNBLENBQUNBLENBQUNBO2dCQUNIQSxJQUFJQSxDQUFDQSxHQUFHQSxHQUFHQSxTQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxHQUFHQSxLQUFLQSxFQUFFQSxJQUFJQSxHQUFHQSxLQUFL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LE9BQU9BLENBQUNBLFVBQUFBLENBQUNBLElBQUlBLE9BQUFBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLEVBQXZCQSxDQUF1QkEsQ0FBQ0EsQ0FBQ0E7UUFDekRBLENBQUNBO1FBR0RKLHFDQUFlQSxHQUFmQSxVQUFnQkEsSUFBWUEsRUFBRUEsT0FBZ0JBO1lBQzFDSyxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDVkEsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDdENBLENBQUNBO1lBQUNBLElBQUlBLENBQUNBLENBQUNBO2dCQUNKQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUN6Q0EsQ0FBQ0E7UUFDTEEsQ0FBQ0E7UUFDTEwsa0JBQUNBO0lBQURBLENBekRBbkYsQUF5RENtRixJQUFBbkY7SUF6RFlBLGdCQUFXQSxjQXlEdkJBLENBQUFBO0lBR1VBLGdCQUFXQSxHQUFHQSxJQUFJQSxXQUFXQSxFQUFFQSxDQUFDQTtBQUMvQ0EsQ0FBQ0EsRUE1Rk0sSUFBSSxLQUFKLElBQUksUUE0RlYiLCJmaWxlIjoidHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUgVGVzcCB7XHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElWZWMyIHtcclxuICAgICAgICB4OiBudW1iZXI7XHJcbiAgICAgICAgeTogbnVtYmVyO1xyXG4gICAgfVxyXG4gICAgLyoqIDItZGltZW5zaW9uYWwgZmxvYXRpbmcgcG9pbnQgdmVjdG9yICovXHJcbiAgICBleHBvcnQgY2xhc3MgVmVjMiBpbXBsZW1lbnRzIElWZWMyIHtcclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgeDogbnVtYmVyID0gMCwgcHVibGljIHk6IG51bWJlciA9IDApIHsgfVxyXG5cclxuICAgICAgICAvKiogQ2FsY3VsYXRlIHRoZSBldWNsaWRlYW4gZGlzdGFuY2UgYmV0d2VlbiB0aGlzIHZlY3RvciBhbmQgYW5vdGhlciAqL1xyXG4gICAgICAgIHN0YXRpYyBkaXN0YW5jZShzcmM6IElWZWMyLCBkc3Q6IElWZWMyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnNxcnQoKChkc3QueCAtIHNyYy54KSAqIChkc3QueCAtIHNyYy54KSkgKyAoKGRzdC55IC0gc3JjLnkpICogKGRzdC55IC0gc3JjLnkpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogQ2FsY3VsYXRlIHRoZSB0b3AtbGVmdCBjb3JuZXIgb2YgYSBjZWxsIGFzIGEgcG9zaXRpb24gdmVjdG9yICovXHJcbiAgICAgICAgc3RhdGljIGZyb21DZWxsKHg6IG51bWJlciwgeTogbnVtYmVyKTogVmVjMiB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgVmVjMih4ICogQ2VsbC53aWR0aCArIENlbGwud2lkdGhPZmZzZXQsIHkgKiBDZWxsLmhlaWdodCArIENlbGwuaGVpZ2h0T2Zmc2V0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJTm9kZSB7XHJcbiAgICAgICAgaWQ6IG51bWJlcjtcclxuICAgICAgICByZWZlcmVuY2VJZDogbnVtYmVyO1xyXG4gICAgICAgIGVkZ2VzOiBFZGdlW107XHJcbiAgICAgICAgbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIGxvbmdOYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgcG9zOiBJVmVjMjtcclxuICAgICAgICB0eXBlOiBzdHJpbmc7XHJcbiAgICAgICAgcGVybWFuZW50OiBib29sZWFuO1xyXG4gICAgfVxyXG4gICAgLyoqIEEgc2luZ2xlIHNpZ25pZmljYW50IHBvaW50IGluIHRoZSB3b3JsZCAqL1xyXG4gICAgZXhwb3J0IGNsYXNzIE5vZGUgaW1wbGVtZW50cyBJTm9kZSB7XHJcbiAgICAgICAgLyoqIEdsb2JhbGx5IHVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGlzIG5vZGUgKi9cclxuICAgICAgICBpZDogbnVtYmVyO1xyXG4gICAgICAgIC8qKiBUaGUgaWQgb2YgYSBub2RlIHRoaXMgbm9kZSB3YXMgY3JlYXRlZCBvbiAqL1xyXG4gICAgICAgIHJlZmVyZW5jZUlkOiBudW1iZXI7XHJcbiAgICAgICAgZWRnZXM6IEVkZ2VbXTtcclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgaWRlbnRpdHk6IG51bWJlciA9IDE7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIGxvbmdOYW1lOiBzdHJpbmcsIHB1YmxpYyBwb3M6IElWZWMyLCBwdWJsaWMgdHlwZTogc3RyaW5nLCBwdWJsaWMgcGVybWFuZW50OiBib29sZWFuID0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdGhpcy5pZCA9IE5vZGUuaWRlbnRpdHkrKztcclxuICAgICAgICAgICAgdGhpcy5lZGdlcyA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKiogQSBsaW5rIGJldHdlZW4gdHdvIG5vZGVzICovXHJcbiAgICBleHBvcnQgY2xhc3MgRWRnZSB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIHNyY05vZGU6IE5vZGUsIHB1YmxpYyBkZXN0Tm9kZTogTm9kZSwgcHVibGljIGNvc3Q6IG51bWJlcikgeyB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIEEgbGFyZ2UgYXJlYSBpbiB0aGUgd29ybGQgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBDZWxsIHtcclxuICAgICAgICBzdGF0aWMgd2lkdGg6IG51bWJlciA9IDQ0LjU7XHJcbiAgICAgICAgc3RhdGljIGhlaWdodDogbnVtYmVyID0gNDQuNjtcclxuICAgICAgICBzdGF0aWMgd2lkdGhPZmZzZXQ6IG51bWJlciA9IDIwO1xyXG4gICAgICAgIHN0YXRpYyBoZWlnaHRPZmZzZXQ6IG51bWJlciA9IDM1O1xyXG4gICAgICAgIHN0YXRpYyBmcm9tUG9zaXRpb24ocG9zOiBJVmVjMik6IFZlYzIge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFZlYzIoKHBvcy54IC0gQ2VsbC53aWR0aE9mZnNldCkgLyBDZWxsLndpZHRoLCAocG9zLnkgLSBDZWxsLmhlaWdodE9mZnNldCkgLyBDZWxsLmhlaWdodCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSUNlbGxSb3cge1xyXG4gICAgICAgIHk6IG51bWJlcjtcclxuICAgICAgICB4MTogbnVtYmVyO1xyXG4gICAgICAgIHgyOiBudW1iZXI7XHJcbiAgICAgICAgd2lkdGg6IG51bWJlcjtcclxuICAgIH1cclxuICAgIC8qKiBBIHNpbmdsZSByb3cgb2YgY2VsbHMgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBDZWxsUm93IHtcclxuICAgICAgICB3aWR0aDogbnVtYmVyO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgeTogbnVtYmVyLCBwdWJsaWMgeDE6IG51bWJlciwgcHVibGljIHgyOiBudW1iZXIpIHtcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IHgyIC0geDEgKyAxO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElBcmVhIHtcclxuICAgICAgICB0YXJnZXQ6IElOb2RlO1xyXG4gICAgICAgIHJvd3M6IElDZWxsUm93W107XHJcbiAgICAgICAgbWluWTogbnVtYmVyO1xyXG4gICAgICAgIG1heFk6IG51bWJlcjtcclxuICAgIH1cclxuICAgIC8qKiBBbiBhcmVhIG9mIG9uZSBvciBtb3JlIGNlbGxzICovXHJcbiAgICBleHBvcnQgY2xhc3MgQXJlYSBpbXBsZW1lbnRzIElBcmVhIHtcclxuICAgICAgICBtaW5ZOiBudW1iZXI7XHJcbiAgICAgICAgbWF4WTogbnVtYmVyO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgdGFyZ2V0OiBOb2RlLCBwdWJsaWMgcm93czogSUNlbGxSb3dbXSkge1xyXG4gICAgICAgICAgICB0aGlzLm1pblkgPSByb3dzWzBdLnk7XHJcbiAgICAgICAgICAgIHRoaXMubWF4WSA9IHJvd3Nbcm93cy5sZW5ndGggLSAxXS55O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIENoZWNrIGlmIHRoaXMgY2VsbCBjb250YWlucyB0aGUgc3VwcGxpZWQgY29vcmRpbmF0ZXMgKi9cclxuICAgICAgICBjb250YWluc0NlbGwocG9zOiBJVmVjMik6IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICByZXR1cm4gQXJlYS5jb250YWluc0NlbGwodGhpcywgcG9zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhdGljIGNvbnRhaW5zQ2VsbChhcmVhOiBJQXJlYSwgcG9zOiBJVmVjMikge1xyXG4gICAgICAgICAgICBpZiAocG9zLnkgPj0gYXJlYS5taW5ZICYmIHBvcy55IDwgYXJlYS5tYXhZICsgMSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJvdyA9IGFyZWEucm93c1tNYXRoLmZsb29yKHBvcy55KSAtIGFyZWEubWluWV07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcG9zLnggPj0gcm93LngxICYmIHBvcy54IDwgcm93LngyICsgMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIl9yZWZzLnRzXCIvPlxyXG5tb2R1bGUgVGVzcCB7XHJcbiAgICAvKiogVGhlIGN1cnJlbnQgbXV0YWJsZSBzdGF0ZSBvZiB0aGUgYXBwbGljYXRpb24gKi9cclxuICAgIGV4cG9ydCBjbGFzcyBDb250ZXh0IHtcclxuICAgICAgICBzb3VyY2VOb2RlOiBJTm9kZTtcclxuICAgICAgICBkZXN0Tm9kZTogSU5vZGU7XHJcbiAgICAgICAgbWFya05vZGU6IElOb2RlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwbGljYXRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLk1hcmtDaGFuZ2UsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRvZ2dsZUJvZHlDbGFzcyhcImhhcy1tYXJrXCIsIHRoaXMubWFya05vZGUgIT0gbnVsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0Q29udGV4dExvY2F0aW9uKGNvbnRleHQ6IHN0cmluZywgcG9zOiBJVmVjMikge1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IHRoaXMuYXBwLndvcmxkLmdldExhbmRtYXJrTmFtZShwb3MpIHx8IHRoaXMuYXBwLndvcmxkLmdldFJlZ2lvbk5hbWUocG9zKTtcclxuICAgICAgICAgICAgaWYgKGNvbnRleHQgPT09IFwic291cmNlXCIpIHtcclxuICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lIHx8IFwiWW91XCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldENvbnRleHROb2RlKGNvbnRleHQsIG5ldyBOb2RlKG5hbWUsIG5hbWUsIHBvcywgXCJzb3VyY2VcIikpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbnRleHQgPT09IFwiZGVzdGluYXRpb25cIikge1xyXG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUgfHwgXCJZb3VyIGRlc3RpbmF0aW9uXCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldENvbnRleHROb2RlKGNvbnRleHQsIG5ldyBOb2RlKG5hbWUsIG5hbWUsIHBvcywgXCJkZXN0aW5hdGlvblwiKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29udGV4dCA9PT0gXCJtYXJrXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFya05vZGUgPSBuZXcgTm9kZShuYW1lLCBuYW1lLCBwb3MsIFwibWFya1wiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLk1hcmtDaGFuZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNldENvbnRleHROb2RlKGNvbnRleHQ6IHN0cmluZywgbm9kZTogSU5vZGUpIHtcclxuICAgICAgICAgICAgaWYgKGNvbnRleHQgPT09IFwic291cmNlXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc291cmNlTm9kZSA9IG5vZGU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5Tb3VyY2VDaGFuZ2UpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbnRleHQgPT09IFwiZGVzdGluYXRpb25cIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kZXN0Tm9kZSA9IG5vZGU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5EZXN0aW5hdGlvbkNoYW5nZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29udGV4dCA9PT0gXCJtYXJrXCIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwb3MgPSBub2RlLnBvcztcclxuICAgICAgICAgICAgICAgIHRoaXMubWFya05vZGUgPSBuZXcgTm9kZShub2RlLmxvbmdOYW1lLCBub2RlLmxvbmdOYW1lLCBwb3MsIFwibWFya1wiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFya05vZGUucmVmZXJlbmNlSWQgPSBub2RlLnJlZmVyZW5jZUlkIHx8IG5vZGUuaWQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC50cmlnZ2VyQ2hhbmdlKENoYW5nZVJlYXNvbi5NYXJrQ2hhbmdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjbGVhckNvbnRleHQoY29udGV4dDogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIGlmIChjb250ZXh0ID09PSBcInNvdXJjZVwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZU5vZGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uU291cmNlQ2hhbmdlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb250ZXh0ID09PSBcImRlc3RpbmF0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGVzdE5vZGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uRGVzdGluYXRpb25DaGFuZ2UpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbnRleHQgPT09IFwibWFya1wiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1hcmtOb2RlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLk1hcmtDaGFuZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIl9yZWZzLnRzXCIvPlxyXG5tb2R1bGUgVGVzcCB7XHJcbiAgICAvKiogTWFuYWdlcyB0aGUgY29udGV4dCBtZW51IG9mIHRoZSBtYXAgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBDb250ZXh0TWVudSB7XHJcbiAgICAgICAgcHJpdmF0ZSBtZW51OiBNZW51O1xyXG4gICAgICAgIHByaXZhdGUgbGlua3M6IE1lbnVJdGVtW107XHJcbiAgICAgICAgcHJpdmF0ZSB1bm1hcmtMaW5rOiBNZW51SXRlbTtcclxuXHJcbiAgICAgICAgcHJpdmF0ZSBwb3M6IElWZWMyO1xyXG4gICAgICAgIHByaXZhdGUgbm9kZTogSU5vZGU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXBwOiBBcHBsaWNhdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLm1lbnUgPSBuZXcgTWVudShhcHAsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGlua3MgPSBbXHJcbiAgICAgICAgICAgICAgICBNZW51SXRlbS5zZXBhcmF0b3IsXHJcbiAgICAgICAgICAgICAgICBuZXcgTWVudUl0ZW0oXCJOYXZpZ2F0ZSBmcm9tIGhlcmVcIiwgKCkgPT4gdGhpcy5zZXRDb250ZXh0KFwic291cmNlXCIpKSxcclxuICAgICAgICAgICAgICAgIG5ldyBNZW51SXRlbShcIk5hdmlnYXRlIHRvIGhlcmVcIiwgKCkgPT4gdGhpcy5zZXRDb250ZXh0KFwiZGVzdGluYXRpb25cIikpLFxyXG4gICAgICAgICAgICAgICAgbmV3IE1lbnVJdGVtKFwiU2V0IE1hcmsgaGVyZVwiLCAoKSA9PiB0aGlzLnNldENvbnRleHQoXCJtYXJrXCIpKVxyXG4gICAgICAgICAgICBdO1xyXG4gICAgICAgICAgICB0aGlzLnVubWFya0xpbmsgPSBuZXcgTWVudUl0ZW0oXCJSZW1vdmUgbWFya1wiLCAoKSA9PiB0aGlzLmFwcC5jb250ZXh0LmNsZWFyQ29udGV4dChcIm1hcmtcIikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzZXRDb250ZXh0KGNvbnRleHQ6IHN0cmluZykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5ub2RlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLmNvbnRleHQuc2V0Q29udGV4dE5vZGUoY29udGV4dCwgdGhpcy5ub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLmNvbnRleHQuc2V0Q29udGV4dExvY2F0aW9uKGNvbnRleHQsIHRoaXMucG9zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb3Blbk5vZGUobm9kZTogSU5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5vcGVuKG5vZGUucG9zLCBub2RlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgb3Blbihwb3M6IElWZWMyLCBub2RlOiBJTm9kZSkge1xyXG4gICAgICAgICAgICAvLyByZW1vdmUgbm9kZSBpZiBuZWl0aGVyIGl0IG9yIGl0cyByZWZlcmVuY2UgYXJlIHBlcm1hbmVudFxyXG4gICAgICAgICAgICBpZiAobm9kZSAhPSBudWxsICYmICFub2RlLnBlcm1hbmVudCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUucmVmZXJlbmNlSWQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBub2RlID0gdGhpcy5hcHAud29ybGQuZmluZE5vZGVCeUlkKG5vZGUucmVmZXJlbmNlSWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlICE9IG51bGwgJiYgIW5vZGUucGVybWFuZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgbGFuZG1hcmsgPSB0aGlzLmFwcC53b3JsZC5nZXRMYW5kbWFya05hbWUocG9zKTtcclxuICAgICAgICAgICAgaWYgKG5vZGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZlYXQgPSB0aGlzLmFwcC5mZWF0dXJlcy5ieU5hbWVbbm9kZS50eXBlXTtcclxuICAgICAgICAgICAgICAgIGlmIChmZWF0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKGZlYXQubG9jYXRpb24gfHwgZmVhdC5uYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKG5vZGUubmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVzLnB1c2gobm9kZS5sb25nTmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobGFuZG1hcmsgIT0gbnVsbCAmJiBsYW5kbWFyayAhPT0gbm9kZS5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZXMucHVzaChsYW5kbWFyayk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBwb3MgPSBub2RlLnBvcztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChsYW5kbWFyayAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKGxhbmRtYXJrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcmVnaW9uID0gdGhpcy5hcHAud29ybGQuZ2V0UmVnaW9uTmFtZShwb3MpO1xyXG4gICAgICAgICAgICBpZiAocmVnaW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGxpbmVzLnB1c2gocmVnaW9uICsgXCIgUmVnaW9uXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBvcyA9IHBvcztcclxuICAgICAgICAgICAgdGhpcy5ub2RlID0gbm9kZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBpdGVtcyA9IGxpbmVzLm1hcChsID0+IG5ldyBNZW51SXRlbShsKSkuY29uY2F0KHRoaXMubGlua3MpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hcHAuY29udGV4dC5tYXJrTm9kZSAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgaXRlbXMucHVzaCh0aGlzLnVubWFya0xpbmspO1xyXG4gICAgICAgICAgICB0aGlzLm1lbnUuc2V0RGF0YShpdGVtcyk7XHJcbiAgICAgICAgICAgIHRoaXMubWVudS5vcGVuKCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgbWVudVN0eWxlID0gdGhpcy5tZW51LmdldFN0eWxlKCk7XHJcbiAgICAgICAgICAgIG1lbnVTdHlsZS5sZWZ0ID0gcG9zLnggKyBcInB4XCI7XHJcbiAgICAgICAgICAgIG1lbnVTdHlsZS50b3AgPSBwb3MueSArIFwicHhcIjtcclxuXHJcbiAgICAgICAgICAgIHZhciBzY3JvbGxYID0gcGFnZVhPZmZzZXQ7XHJcbiAgICAgICAgICAgIHZhciBzY3JvbGxZID0gcGFnZVlPZmZzZXQ7XHJcbiAgICAgICAgICAgIHZhciByZWN0ID0gdGhpcy5tZW51LmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgICAgIGlmIChyZWN0LmxlZnQgPCAxMCkge1xyXG4gICAgICAgICAgICAgICAgc2Nyb2xsWCA9IHBhZ2VYT2Zmc2V0ICsgcmVjdC5sZWZ0IC0gMTA7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVjdC5yaWdodCA+IGlubmVyV2lkdGggLSAyNykge1xyXG4gICAgICAgICAgICAgICAgc2Nyb2xsWCA9IHBhZ2VYT2Zmc2V0ICsgcmVjdC5yaWdodCAtIGlubmVyV2lkdGggKyAyNztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHJlY3QudG9wIDwgNTApIHtcclxuICAgICAgICAgICAgICAgIHNjcm9sbFkgPSBwYWdlWU9mZnNldCArIHJlY3QudG9wIC0gNTA7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVjdC5ib3R0b20gPiBpbm5lckhlaWdodCAtIDI3KSB7XHJcbiAgICAgICAgICAgICAgICBzY3JvbGxZID0gcGFnZVlPZmZzZXQgKyByZWN0LmJvdHRvbSAtIGlubmVySGVpZ2h0ICsgMjc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzY3JvbGxYICE9PSBwYWdlWE9mZnNldCB8fCBzY3JvbGxZICE9PSBwYWdlWU9mZnNldClcclxuICAgICAgICAgICAgICAgIHNjcm9sbChzY3JvbGxYLCBzY3JvbGxZKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaGlkZSgpIHtcclxuICAgICAgICAgICAgdGhpcy5tZW51LmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiX3JlZnMudHNcIi8+XHJcbm1vZHVsZSBUZXNwIHtcclxuICAgIC8qKiBVSSBjb250cm9scyBmb3Igc2VhcmNoIGFuZCBuYXZpZ2F0aW9uICovXHJcbiAgICBleHBvcnQgY2xhc3MgQ29udHJvbHMge1xyXG4gICAgICAgIHByaXZhdGUgcGF0aENvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBmZWF0dXJlc0NvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBzZWFyY2hJbnB1dDogSFRNTElucHV0RWxlbWVudDtcclxuICAgICAgICBwcml2YXRlIHNlYXJjaEJveDogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBzZWFyY2hNZW51OiBNZW51O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwbGljYXRpb24sIHByaXZhdGUgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLlNvdXJjZUNoYW5nZSwgKCkgPT4gdGhpcy51cGRhdGVOb2RlSW5mbyhcIi5jb250cm9sLXNvdXJjZS1pbmZvXCIsIHRoaXMuYXBwLmNvbnRleHQuc291cmNlTm9kZSkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uRGVzdGluYXRpb25DaGFuZ2UsICgpID0+IHRoaXMudXBkYXRlTm9kZUluZm8oXCIuY29udHJvbC1kZXN0aW5hdGlvbi1pbmZvXCIsIHRoaXMuYXBwLmNvbnRleHQuZGVzdE5vZGUpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLk1hcmtDaGFuZ2UsICgpID0+IHRoaXMudXBkYXRlTm9kZUluZm8oXCIuY29udHJvbC1tYXJrLWluZm9cIiwgdGhpcy5hcHAuY29udGV4dC5tYXJrTm9kZSkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uUGF0aFVwZGF0ZSwgKHJlYXNvbiwgcGF0aE5vZGUpID0+IHRoaXMudXBkYXRlUGF0aCg8SVBhdGhOb2RlPnBhdGhOb2RlKSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBhdGhDb250YWluZXIgPSA8SFRNTEVsZW1lbnQ+ZWxlbWVudC5xdWVyeVNlbGVjdG9yKFwiLnBhdGgtY29udGFpbmVyXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmZlYXR1cmVzQ29udGFpbmVyID0gPEhUTUxFbGVtZW50PmVsZW1lbnQucXVlcnlTZWxlY3RvcihcIi5mZWF0dXJlcy1jb250YWluZXJcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoSW5wdXQgPSA8SFRNTElucHV0RWxlbWVudD5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2VhcmNoLWlucHV0XCIpO1xyXG4gICAgICAgICAgICB2YXIgb3ZlcmhlYWRJbnB1dCA9IDxIVE1MSW5wdXRFbGVtZW50PmVsZW1lbnQucXVlcnlTZWxlY3RvcihcIi5mZWF0dXJlLW92ZXJoZWFkIGlucHV0XCIpO1xyXG4gICAgICAgICAgICBvdmVyaGVhZElucHV0LnZhbHVlID0gTWF0aC5wb3coYXBwLmZlYXR1cmVzLm5vZGVPdmVyaGVhZCwgMSAvIDEuNSkgKyBcIlwiO1xyXG4gICAgICAgICAgICBvdmVyaGVhZElucHV0Lm9uaW5wdXQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5mZWF0dXJlcy5ub2RlT3ZlcmhlYWQgPSBNYXRoLnBvdygrb3ZlcmhlYWRJbnB1dC52YWx1ZSwgMS41KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLkZlYXR1cmVDaGFuZ2UpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdmFyIGZlYXR1cmVzVmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAoPEhUTUxFbGVtZW50PmVsZW1lbnQucXVlcnlTZWxlY3RvcihcIi5mZWF0dXJlcy1pY29uXCIpKS5vbmNsaWNrID0gKCkgPT4gXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZlYXR1cmVzQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAoZmVhdHVyZXNWaXNpYmxlID0gIWZlYXR1cmVzVmlzaWJsZSkgPyBcImJsb2NrXCIgOiBcIm5vbmVcIjtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaW5pdFNlYXJjaCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5pdFNlYXJjaCgpIHtcclxuICAgICAgICAgICAgdmFyIHNlYXJjaENvbnRhaW5lciA9IDxIVE1MSW5wdXRFbGVtZW50PnRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKFwiLnNlYXJjaC1jb250YWluZXJcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoTWVudSA9IG5ldyBNZW51KHRoaXMuYXBwLCB0cnVlKTtcclxuICAgICAgICAgICAgdmFyIG1lbnVTdHlsZSA9IHRoaXMuc2VhcmNoTWVudS5nZXRTdHlsZSgpO1xyXG4gICAgICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLnNlYXJjaElucHV0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgICAgICBtZW51U3R5bGUubWluV2lkdGggPSBcIjIwMHB4XCI7XHJcbiAgICAgICAgICAgIG1lbnVTdHlsZS50b3AgPSAoaW5wdXQudG9wICsgaW5wdXQuaGVpZ2h0KSArIFwicHhcIjtcclxuICAgICAgICAgICAgbWVudVN0eWxlLnJpZ2h0ID0gKHNlYXJjaENvbnRhaW5lci5jbGllbnRXaWR0aCAtIGlucHV0LnJpZ2h0KSArIFwicHhcIjtcclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIHByZXBUZXJtKHRleHQ6IHN0cmluZykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRleHQgIT0gbnVsbCA/IHRleHQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXmEtel0rL2csIFwiIFwiKSA6IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBzZWFyY2hOb2RlcyA9IHRoaXMuYXBwLndvcmxkLm5vZGVzXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0KHRoaXMuYXBwLndvcmxkLmxhbmRtYXJrcy5tYXAoYSA9PiBhLnRhcmdldCkpXHJcbiAgICAgICAgICAgICAgICAubWFwKG4gPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmZWF0ID0gdGhpcy5hcHAuZmVhdHVyZXMuYnlOYW1lW24udHlwZV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZlYXROYW1lID0gZmVhdCAhPSBudWxsID8gZmVhdC5sb2NhdGlvbiB8fCBmZWF0Lm5hbWUgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZXJtcyA9IFtuLm5hbWVdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmZWF0TmFtZSAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXJtcy5wdXNoKGZlYXROYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGFuZG1hcmsgPSB0aGlzLmFwcC53b3JsZC5nZXRMYW5kbWFya05hbWUobi5wb3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYW5kbWFyayAmJiBsYW5kbWFyayAhPT0gbi5uYW1lKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXJtcy5wdXNoKGxhbmRtYXJrKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGVybXM6IHRlcm1zLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2hUZXJtczogdGVybXMubWFwKHQgPT4gcHJlcFRlcm0odCkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlOiBuXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuc29ydCgoYSwgYikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdCA9IGEuc2VhcmNoVGVybXMsIGJ0ID0gYi5zZWFyY2hUZXJtcztcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbWwgPSBNYXRoLm1heChhdC5sZW5ndGgsIGJ0Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtbDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkID0gKGF0W2ldIHx8IFwiXCIpLmxvY2FsZUNvbXBhcmUoYnRbaV0gfHwgXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkICE9PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmRyYXdGZWF0dXJlcygpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZWFyY2hJbnB1dC5vbmlucHV0ID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNlYXJjaCA9IHRoaXMuc2VhcmNoSW5wdXQudmFsdWUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnRzOiBudW1iZXJbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHRlcm1zOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFscGhhID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlYXJjaC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gc2VhcmNoLmNoYXJDb2RlQXQoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGMgPiA5NiAmJiBjIDwgMTIzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYWxwaGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0cy5wdXNoKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxwaGEgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhbHBoYSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXJtcyA9IHRlcm1zLmNvbmNhdChzdGFydHMubWFwKHMgPT4gc2VhcmNoLnN1YnN0cmluZyhzLCBpKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbHBoYSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChhbHBoYSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRlcm1zID0gdGVybXMuY29uY2F0KHN0YXJ0cy5tYXAocyA9PiBzZWFyY2guc3Vic3RyaW5nKHMpKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBzZWFyY2hOb2Rlc1xyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIobiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRlcm1zLnNvbWUodCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobi5zZWFyY2hUZXJtcy5zb21lKHN0ID0+IHN0LmluZGV4T2YodCkgPT09IDApKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjID49IHN0YXJ0cy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuc2VhcmNoTWVudS5zZXREYXRhKHJlc3VsdHMubWFwKG4gPT5cclxuICAgICAgICAgICAgICAgICAgICBuZXcgTWVudUl0ZW0obi50ZXJtcy5qb2luKFwiLCBcIiksICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAuY3R4TWVudS5vcGVuTm9kZShuLm5vZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyU2VhcmNoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VhcmNoTWVudS5vcGVuKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmFkZENoYW5nZUxpc3RlbmVyKENoYW5nZVJlYXNvbi5DbGVhck1lbnVzLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gdGhpcy5zZWFyY2hJbnB1dClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyU2VhcmNoKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjbGVhclNlYXJjaCgpIHtcclxuICAgICAgICAgICAgdGhpcy5zZWFyY2hJbnB1dC52YWx1ZSA9IFwiXCI7XHJcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoTWVudS5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHVwZGF0ZU5vZGVJbmZvKHNlbGVjdG9yOiBzdHJpbmcsIG5vZGU6IE5vZGUpIHtcclxuICAgICAgICAgICAgdmFyIGVsID0gPEhUTUxFbGVtZW50PnRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKG5vZGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZWwudGV4dENvbnRlbnQgPSBub2RlLmxvbmdOYW1lO1xyXG4gICAgICAgICAgICAgICAgZWwub25jbGljayA9ICgpID0+IHRoaXMuYXBwLmN0eE1lbnUub3Blbk5vZGUobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBlbC50ZXh0Q29udGVudCA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICBlbC5vbmNsaWNrID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSB1cGRhdGVQYXRoKHBhdGhOb2RlOiBJUGF0aE5vZGUpIHtcclxuICAgICAgICAgICAgdmFyIGNoaWxkOiBFbGVtZW50O1xyXG4gICAgICAgICAgICB3aGlsZSAoKGNoaWxkID0gdGhpcy5wYXRoQ29udGFpbmVyLmZpcnN0RWxlbWVudENoaWxkKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXRoQ29udGFpbmVyLnJlbW92ZUNoaWxkKGNoaWxkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5wYXRoQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBwYXRoTm9kZSA/IFwiYmxvY2tcIiA6IFwibm9uZVwiO1xyXG4gICAgICAgICAgICB3aGlsZSAocGF0aE5vZGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGF0aENvbnRhaW5lci5pbnNlcnRCZWZvcmUodGhpcy5kcmF3UGF0aE5vZGUocGF0aE5vZGUpLCB0aGlzLnBhdGhDb250YWluZXIuZmlyc3RFbGVtZW50Q2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgcGF0aE5vZGUgPSBwYXRoTm9kZS5wcmV2O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBkcmF3UGF0aE5vZGUocGF0aE5vZGU6IElQYXRoTm9kZSk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBpY29uOiBzdHJpbmcsIHRleHQ6IHN0cmluZywgbGlua1RleHQ6IHN0cmluZztcclxuICAgICAgICAgICAgdmFyIG5vZGUgPSBwYXRoTm9kZS5ub2RlO1xyXG4gICAgICAgICAgICB2YXIgZWRnZSA9IHBhdGhOb2RlLnByZXZFZGdlO1xyXG4gICAgICAgICAgICBpZiAoZWRnZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbjogc3RyaW5nO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVkZ2UudHlwZSA9PT0gXCJ3YWxrXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBcIldhbGtcIjtcclxuICAgICAgICAgICAgICAgICAgICBpY29uID0gXCJjb21wYXNzXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmZWF0ID0gdGhpcy5hcHAuZmVhdHVyZXMuYnlOYW1lW2VkZ2UudHlwZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZlYXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gZmVhdC52ZXJiIHx8IGZlYXQubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbiA9IGZlYXQuaWNvbjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBlZGdlLnR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb24gPSBcInF1ZXN0aW9uXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRleHQgPSBgICR7YWN0aW9ufSB0byBgO1xyXG4gICAgICAgICAgICAgICAgbGlua1RleHQgPSBub2RlLnR5cGUgPT09IGVkZ2UudHlwZSA/IG5vZGUubmFtZSA6IG5vZGUubG9uZ05hbWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpY29uID0gXCJtYXAtbWFya2VyXCI7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gXCIgXCI7XHJcbiAgICAgICAgICAgICAgICBsaW5rVGV4dCA9IG5vZGUubG9uZ05hbWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlcIik7XHJcbiAgICAgICAgICAgIGkuY2xhc3NMaXN0LmFkZChcInBhdGgtaWNvblwiKTtcclxuICAgICAgICAgICAgaS5jbGFzc0xpc3QuYWRkKFwiZmFcIik7XHJcbiAgICAgICAgICAgIGkuY2xhc3NMaXN0LmFkZChcImZhLVwiICsgaWNvbik7XHJcbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKGkpO1xyXG5cclxuICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dCkpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICAgICAgYS50ZXh0Q29udGVudCA9IGxpbmtUZXh0O1xyXG4gICAgICAgICAgICBhLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmFwcC5jdHhNZW51Lm9wZW5Ob2RlKG5vZGUpO1xyXG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChhKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBlbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgZHJhd0ZlYXR1cmVzKCkge1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5mZWF0dXJlcy5mb3JFYWNoKGYgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IFwiZmVhdHVyZS1yb3dcIjtcclxuICAgICAgICAgICAgICAgIGVsLnRleHRDb250ZW50ID0gZi5uYW1lICsgXCI6XCI7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gXCJmZWF0dXJlLXRvZ2dsZS1jb250YWluZXJcIjtcclxuICAgICAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XHJcblxyXG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZHJhd0NoZWNrYm94KHZhbCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZi5oaWRkZW4gPSAhdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLkZlYXR1cmVDaGFuZ2UpO1xyXG4gICAgICAgICAgICAgICAgfSwgIWYuaGlkZGVuLCBcImZhLWV5ZVwiLCBcImZhLWV5ZS1zbGFzaFwiKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWYudmlzdWFsT25seSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdDaGVja2JveCh2YWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmLmRpc2FibGVkID0gIXZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uRmVhdHVyZUNoYW5nZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgIWYuZGlzYWJsZWQsIFwiZmEtY2hlY2stY2lyY2xlLW9cIiwgXCJmYS1jaXJjbGUtb1wiKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgaS5jbGFzc05hbWUgPSBcImZhIGZhLWljb24gZmEtY2lyY2xlLW8gZmVhdHVyZS10b2dnbGUgaGlkZGVuXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuZmVhdHVyZXNDb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgZHJhd0NoZWNrYm94KG9uY2hhbmdlOiAodmFsdWU6IGJvb2xlYW4pID0+IHZvaWQsIGluaXRpYWw6IGJvb2xlYW4sIGNsYXNzT246IHN0cmluZywgY2xhc3NPZmY6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICAgICAgdmFyIGNoZWNrZWQgPSBpbml0aWFsO1xyXG4gICAgICAgICAgICB2YXIgaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpXCIpO1xyXG4gICAgICAgICAgICBpLmNsYXNzTmFtZSA9IFwiZmEgZmEtaWNvbiBmZWF0dXJlLXRvZ2dsZVwiO1xyXG4gICAgICAgICAgICBpLmNsYXNzTGlzdC5hZGQoY2hlY2tlZCA/IGNsYXNzT24gOiBjbGFzc09mZik7XHJcbiAgICAgICAgICAgIGkub25jbGljayA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA9ICFjaGVja2VkO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpLmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NPZmYpO1xyXG4gICAgICAgICAgICAgICAgICAgIGkuY2xhc3NMaXN0LmFkZChjbGFzc09uKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaS5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzT24pO1xyXG4gICAgICAgICAgICAgICAgICAgIGkuY2xhc3NMaXN0LmFkZChjbGFzc09mZik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBvbmNoYW5nZShjaGVja2VkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiX3JlZnMudHNcIi8+XHJcbm1vZHVsZSBUZXNwIHtcclxuICAgIGV4cG9ydCBjbGFzcyBGZWF0dXJlIHtcclxuICAgICAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgdmVyYjogc3RyaW5nO1xyXG4gICAgICAgIGxvY2F0aW9uOiBzdHJpbmc7XHJcbiAgICAgICAgdHlwZTogc3RyaW5nO1xyXG4gICAgICAgIGljb246IHN0cmluZztcclxuICAgICAgICBkaXNhYmxlZDogYm9vbGVhbjtcclxuICAgICAgICBoaWRkZW46IGJvb2xlYW47XHJcbiAgICAgICAgdmlzdWFsT25seTogYm9vbGVhbjtcclxuICAgIH1cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSUZlYXR1cmVMaXN0IGV4dGVuZHMgQXJyYXk8RmVhdHVyZT4ge1xyXG4gICAgICAgIG5vZGVPdmVyaGVhZDogbnVtYmVyO1xyXG4gICAgICAgIGJ5TmFtZTogeyBba2V5OiBzdHJpbmddOiBGZWF0dXJlIH07XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEZlYXR1cmVzIHtcclxuICAgICAgICBzdGF0aWMgaW5pdCgpOiBJRmVhdHVyZUxpc3Qge1xyXG4gICAgICAgICAgICB2YXIgZmVhdHVyZXMgPSA8SUZlYXR1cmVMaXN0PltcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJNYXJrL1JlY2FsbFwiLCB2ZXJiOiBcIlJlY2FsbFwiLCB0eXBlOiBcIm1hcmtcIiwgaWNvbjogXCJib2x0XCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJNYWdlcyBHdWlsZFwiLCB2ZXJiOiBcIkd1aWxkIEd1aWRlXCIsIHR5cGU6IFwibWFnZXMtZ3VpbGRcIiwgaWNvbjogXCJleWVcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIlNpbHQgU3RyaWRlclwiLCB2ZXJiOiBcIlNpbHQgU3RyaWRlclwiLCB0eXBlOiBcInNpbHQtc3RyaWRlclwiLCBpY29uOiBcImJ1Z1wiIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiQm9hdFwiLCBsb2NhdGlvbjogXCJEb2Nrc1wiLCB0eXBlOiBcImJvYXRcIiwgaWNvbjogXCJzaGlwXCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJIb2xhbWF5YW4gQm9hdFwiLCBsb2NhdGlvbjogXCJEb2Nrc1wiLCB2ZXJiOiBcIkJvYXRcIiwgdHlwZTogXCJob2xhbWF5YW5cIiwgaWNvbjogXCJzaGlwXCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJQcm9weWxvbiBDaGFtYmVyXCIsIHR5cGU6IFwicHJvcHlsb25cIiwgaWNvbjogXCJjb2dcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIkdvbmRvbGFcIiwgdHlwZTogXCJnb25kb2xhXCIsIGljb246IFwic2hpcFwiIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiRGl2aW5lIEludGVydmVudGlvblwiLCBsb2NhdGlvbjogXCJJbXBlcmlhbCBDdWx0IFNocmluZVwiLCB0eXBlOiBcImRpdmluZVwiLCBpY29uOiBcImJvbHRcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcIkFsbXNpdmkgSW50ZXJ2ZW50aW9uXCIsIGxvY2F0aW9uOiBcIlRyaWJ1bmFsIFRlbXBsZVwiLCB0eXBlOiBcImFsbXNpdmlcIiwgaWNvbjogXCJib2x0XCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJUcmFuc3BvcnQgbGluZXNcIiwgdHlwZTogXCJ0cmFuc3BvcnQtZWRnZVwiLCB2aXN1YWxPbmx5OiB0cnVlIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiTG9jYXRpb25zXCIsIHR5cGU6IFwibm9kZVwiLCB2aXN1YWxPbmx5OiB0cnVlIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiSW50ZXJ2ZW50aW9uIGFyZWEgYm9yZGVyXCIsIHR5cGU6IFwiYXJlYVwiLCB2aXN1YWxPbmx5OiB0cnVlIH0sXHJcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiR3JpZGxpbmVzXCIsIHR5cGU6IFwiZ3JpZFwiLCB2aXN1YWxPbmx5OiB0cnVlIH1cclxuICAgICAgICAgICAgXTtcclxuICAgICAgICAgICAgZmVhdHVyZXMubm9kZU92ZXJoZWFkID0gMTU7XHJcbiAgICAgICAgICAgIGZlYXR1cmVzLmJ5TmFtZSA9IHt9O1xyXG4gICAgICAgICAgICB2YXIgZklkeCA9IGZlYXR1cmVzLmJ5TmFtZTtcclxuICAgICAgICAgICAgZmVhdHVyZXMuZm9yRWFjaChmID0+IGZJZHhbZi50eXBlXSA9IGYpO1xyXG4gICAgICAgICAgICBmSWR4W1widHJhbnNwb3J0LWVkZ2VcIl0uaGlkZGVuID0gZklkeFtcImFyZWFcIl0uaGlkZGVuID0gZklkeFtcImdyaWRcIl0uaGlkZGVuID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIGZlYXR1cmVzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJfcmVmcy50c1wiLz5cclxubW9kdWxlIFRlc3Age1xyXG4gICAgLyoqIFRoZSBtYXAgVUkgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBNYXAge1xyXG4gICAgICAgIHByaXZhdGUgZWRnZUNvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBub2RlQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcclxuICAgICAgICBwcml2YXRlIGFyZWFDb250YWluZXI6IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIHByaXZhdGUgcGF0aENvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBncmlkQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcclxuICAgICAgICBwcml2YXRlIHNvdXJjZUVsZW06IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIHByaXZhdGUgZGVzdEVsZW06IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIHByaXZhdGUgbWFya0VsZW06IEhUTUxFbGVtZW50O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwbGljYXRpb24sIHByaXZhdGUgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLlNvdXJjZUNoYW5nZSwgKCkgPT4gdGhpcy5yZW5kZXJTb3VyY2UoKSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmFkZENoYW5nZUxpc3RlbmVyKENoYW5nZVJlYXNvbi5EZXN0aW5hdGlvbkNoYW5nZSwgKCkgPT4gdGhpcy5yZW5kZXJEZXN0aW5hdGlvbigpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLk1hcmtDaGFuZ2UsICgpID0+IHRoaXMucmVuZGVyTWFyaygpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLlBhdGhVcGRhdGUsIChyZWFzb24sIHBhdGhOb2RlKSA9PiB0aGlzLnJlbmRlclBhdGgoPElQYXRoTm9kZT5wYXRoTm9kZSkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5hZGRDaGFuZ2VMaXN0ZW5lcihDaGFuZ2VSZWFzb24uRmVhdHVyZUNoYW5nZSwgKCkgPT4gdGhpcy51cGRhdGVGZWF0dXJlcygpKTtcclxuXHJcbiAgICAgICAgICAgIGVsZW1lbnQub25jbGljayA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5nZXRFdmVudE5vZGUoZXYpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlckNvbnRleHRNZW51KGV2LCBub2RlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGVsZW1lbnQub25jb250ZXh0bWVudSA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghZXYuc2hpZnRLZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlckNvbnRleHRNZW51KGV2KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJOb2RlcygpO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlck1hcmsoKTtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRmVhdHVyZXMoKTtcclxuICAgICAgICAgICAgdGhpcy5pbml0RHJhZ1Njcm9sbCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBnZXRFdmVudE5vZGUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IDxIVE1MRWxlbWVudD5ldmVudC50YXJnZXQ7XHJcbiAgICAgICAgICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwibWFwLW5vZGVcIikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZCA9IHRhcmdldC5kYXRhc2V0W1wibm9kZUlkXCJdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hcHAud29ybGQuZmluZE5vZGVCeUlkKCtpZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHRyaWdnZXJDb250ZXh0TWVudShldjogTW91c2VFdmVudCwgbm9kZT86IE5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5hcHAuY3R4TWVudS5vcGVuKG5ldyBWZWMyKGV2LnBhZ2VYLCBldi5wYWdlWSksIG5vZGUgfHwgdGhpcy5nZXRFdmVudE5vZGUoZXYpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgaW5pdERyYWdTY3JvbGwoKSB7XHJcbiAgICAgICAgICAgIHZhciBpbWcgPSA8SFRNTEVsZW1lbnQ+dGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbWdcIik7XHJcbiAgICAgICAgICAgIHZhciBtb3VzZWRvd24gPSBmYWxzZSwgcHJldlg6IG51bWJlciwgcHJldlk6IG51bWJlcjtcclxuICAgICAgICAgICAgdmFyIHN0b3AgPSAoZXY6IE1vdXNlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIG1vdXNlZG93biA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudG9nZ2xlQm9keUNsYXNzKFwic2Nyb2xsaW5nXCIsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHZhciBzdGFydCA9IChldjogTW91c2VFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbW91c2Vkb3duID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHByZXZYID0gZXYuY2xpZW50WDtcclxuICAgICAgICAgICAgICAgIHByZXZZID0gZXYuY2xpZW50WTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRvZ2dsZUJvZHlDbGFzcyhcInNjcm9sbGluZ1wiLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaW1nLm9ubW91c2Vkb3duID0gZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGV2LmJ1dHRvbiA9PT0gMCAmJiBldi50YXJnZXQgPT09IGltZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0KGV2KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaW1nLm9ubW91c2V1cCA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChtb3VzZWRvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICBzdG9wKGV2KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpbWcub25tb3VzZW1vdmUgPSBldiA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1vdXNlZG93biAmJiBldi53aGljaCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0KGV2KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChtb3VzZWRvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXYud2hpY2ggIT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcChldik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsKHBhZ2VYT2Zmc2V0ICsgcHJldlggLSBldi5jbGllbnRYLCBwYWdlWU9mZnNldCArIHByZXZZIC0gZXYuY2xpZW50WSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZYID0gZXYuY2xpZW50WDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldlkgPSBldi5jbGllbnRZO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgcmVuZGVyTm9kZXMoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5vZGVDb250YWluZXIgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHRoaXMubm9kZUNvbnRhaW5lci5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMubm9kZUNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgIHRoaXMubm9kZUNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLm5vZGVDb250YWluZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC53b3JsZC5ub2Rlc1xyXG4gICAgICAgICAgICAgICAgLy8uY29uY2F0KHRoaXMuYXBwLndvcmxkLmxhbmRtYXJrcy5tYXAobCA9PiBsLnRhcmdldCkpXHJcbiAgICAgICAgICAgICAgICAuZm9yRWFjaChuID0+IHRoaXMubm9kZUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdOb2RlKG4pKSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5lZGdlQ29udGFpbmVyICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVkZ2VDb250YWluZXIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmVkZ2VDb250YWluZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmVkZ2VDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5lZGdlQ29udGFpbmVyKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAud29ybGQuZWRnZXMuZm9yRWFjaChlID0+XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVkZ2VDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kcmF3RWRnZShlLnNyY05vZGUucG9zLCBlLmRlc3ROb2RlLnBvcywgZS5zcmNOb2RlLnR5cGUsIFwibWFwLXRyYW5zcG9ydC1lZGdlXCIpKSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5hcmVhQ29udGFpbmVyICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmFyZWFDb250YWluZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5hcmVhQ29udGFpbmVyKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAud29ybGQuYXJlYXNcclxuICAgICAgICAgICAgICAgIC8vLmNvbmNhdCh0aGlzLmFwcC53b3JsZC5yZWdpb25zKVxyXG4gICAgICAgICAgICAgICAgLy8uY29uY2F0KHRoaXMuYXBwLndvcmxkLmxhbmRtYXJrcylcclxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0eXBlID0gYS50YXJnZXQudHlwZTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJldjogQ2VsbFJvdyA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLnJvd3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvdyA9IGEucm93c1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXYgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvdy54MSAhPT0gcHJldi54MSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXJlYUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdDZWxsRWRnZShyb3cueDEsIHJvdy55LCBwcmV2LngxLCByb3cueSwgdHlwZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvdy54MiAhPT0gcHJldi54Mikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXJlYUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdDZWxsRWRnZShyb3cueDIgKyAxLCByb3cueSwgcHJldi54MiArIDEsIHJvdy55LCB0eXBlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kcmF3Q2VsbEVkZ2Uocm93LngxLCByb3cueSwgcm93LngyICsgMSwgcm93LnksIHR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kcmF3Q2VsbEVkZ2Uocm93LngxLCByb3cueSwgcm93LngxLCByb3cueSArIDEsIHR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcmVhQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZHJhd0NlbGxFZGdlKHJvdy54MiArIDEsIHJvdy55LCByb3cueDIgKyAxLCByb3cueSArIDEsIHR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldiA9IHJvdztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYocHJldiAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFyZWFDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kcmF3Q2VsbEVkZ2UocHJldi54MSwgcHJldi55ICsgMSwgcHJldi54MiArIDEsIHByZXYueSArIDEsIHR5cGUpKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBkcmF3Q2VsbEVkZ2UoeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlciwgdHlwZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRyYXdFZGdlKFZlYzIuZnJvbUNlbGwoeDEsIHkxKSwgVmVjMi5mcm9tQ2VsbCh4MiwgeTIpLCB0eXBlLCBcIm1hcC1hcmVhXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSByZW5kZXJQYXRoKHBhdGhOb2RlOiBJUGF0aE5vZGUpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucGF0aENvbnRhaW5lciAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXRoQ29udGFpbmVyLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5wYXRoQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChwYXRoTm9kZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhdGhDb250YWluZXIgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBhdGhDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5wYXRoQ29udGFpbmVyKTtcclxuICAgICAgICAgICAgd2hpbGUgKHBhdGhOb2RlICYmIHBhdGhOb2RlLnByZXYpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGF0aENvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRyYXdFZGdlKHBhdGhOb2RlLm5vZGUucG9zLCBwYXRoTm9kZS5wcmV2Lm5vZGUucG9zLCBcInBhdGhcIiwgXCJtYXAtXCIgKyBwYXRoTm9kZS5wcmV2RWRnZS50eXBlKSk7XHJcbiAgICAgICAgICAgICAgICBwYXRoTm9kZSA9IHBhdGhOb2RlLnByZXY7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgcmVuZGVyTWFyaygpIHtcclxuICAgICAgICAgICAgdGhpcy5tYXJrRWxlbSA9IHRoaXMuYWRkT3JVcGRhdGVOb2RlRWxlbSh0aGlzLmFwcC5jb250ZXh0Lm1hcmtOb2RlLCB0aGlzLm1hcmtFbGVtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSByZW5kZXJTb3VyY2UoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc291cmNlRWxlbSA9IHRoaXMuYWRkT3JVcGRhdGVOb2RlRWxlbSh0aGlzLmFwcC5jb250ZXh0LnNvdXJjZU5vZGUsIHRoaXMuc291cmNlRWxlbSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgcmVuZGVyRGVzdGluYXRpb24oKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGVzdEVsZW0gPSB0aGlzLmFkZE9yVXBkYXRlTm9kZUVsZW0odGhpcy5hcHAuY29udGV4dC5kZXN0Tm9kZSwgdGhpcy5kZXN0RWxlbSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGFkZE9yVXBkYXRlTm9kZUVsZW0obm9kZTogSU5vZGUsIGVsZW06IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQge1xyXG4gICAgICAgICAgICBpZiAoZWxlbSlcclxuICAgICAgICAgICAgICAgIGVsZW0ucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChlbGVtKTtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGUgIT0gbnVsbFxyXG4gICAgICAgICAgICAgICAgPyA8SFRNTEVsZW1lbnQ+dGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZHJhd05vZGUobm9kZSkpXHJcbiAgICAgICAgICAgICAgICA6IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHJlbmRlckdyaWQoKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5ncmlkQ29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdyaWRDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZ3JpZENvbnRhaW5lcik7XHJcbiAgICAgICAgICAgICAgICB2YXIgaTogbnVtYmVyLCBlbDogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMzc7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKFwibWFwLWdyaWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChcIm1hcC1ncmlkLXZcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZWwuc3R5bGUubGVmdCA9IChpICogQ2VsbC53aWR0aCArIENlbGwud2lkdGhPZmZzZXQpICsgXCJweFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JpZENvbnRhaW5lci5hcHBlbmRDaGlsZChlbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNDI7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKFwibWFwLWdyaWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChcIm1hcC1ncmlkLWhcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZWwuc3R5bGUudG9wID0gKGkgKiBDZWxsLmhlaWdodCArIENlbGwuaGVpZ2h0T2Zmc2V0KSArIFwicHhcIjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyaWRDb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIHNob3cgZ3JpZCBjb29yZGluYXRlc1xyXG4gICAgICAgICAgICAgICAgLypmb3IgKGkgPSAwOyBpIDwgMzc7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgNDI7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWwudGV4dENvbnRlbnQgPSBpICsgJywnICsgajtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnN0eWxlLmNvbG9yID0gXCJyZ2JhKDI1NSwyNTUsMjU1LDAuNzUpXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnN0eWxlLmxlZnQgPSAoaSAqIDQ0LjUgKyAyMikgKyBcInB4XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnN0eWxlLnRvcCA9IChqICogNDQuNiArIDM3KSArIFwicHhcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc3R5bGUuekluZGV4ID0gXCIxMFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZS5mb250ID0gXCI3cHQgc2Fucy1zZXJpZlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyaWRDb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0qL1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHVwZGF0ZUZlYXR1cmVzKCkge1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgICAgICAgICAgdGhpcy5hcHAuZmVhdHVyZXMuZm9yRWFjaChmID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChmLmhpZGRlbilcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImhpZGUtXCIgKyBmLnR5cGUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgZHJhd05vZGUobm9kZTogSU5vZGUpOiBIVE1MRWxlbWVudCAge1xyXG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcIm1hcC1ub2RlXCIpO1xyXG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJtYXAtXCIgKyBub2RlLnR5cGUpO1xyXG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmxlZnQgPSBub2RlLnBvcy54ICsgXCJweFwiO1xyXG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLnRvcCA9IG5vZGUucG9zLnkgKyBcInB4XCI7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuZGF0YXNldFtcIm5vZGVJZFwiXSA9IChub2RlLnJlZmVyZW5jZUlkIHx8IG5vZGUuaWQpICsgXCJcIjtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGRyYXdFZGdlKG4xOiBJVmVjMiwgbjI6IElWZWMyLCB0eXBlOiBzdHJpbmcsIHN1YnR5cGU/OiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XHJcbiAgICAgICAgICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwibWFwLWVkZ2VcIik7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcIm1hcC1cIiArIHR5cGUpO1xyXG4gICAgICAgICAgICBpZiAoc3VidHlwZSlcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChzdWJ0eXBlKTtcclxuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IFZlYzIuZGlzdGFuY2UobjEsIG4yKTtcclxuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0gKChuMS54ICsgbjIueCkgLyAyKSAtIChsZW5ndGggLyAyKSArIFwicHhcIjtcclxuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS50b3AgPSAoKG4xLnkgKyBuMi55KSAvIDIpIC0gMSArIFwicHhcIjtcclxuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS53aWR0aCA9IGxlbmd0aCArIFwicHhcIjtcclxuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSBgcm90YXRlKCR7TWF0aC5hdGFuMihuMS55IC0gbjIueSwgbjEueCAtIG4yLngpfXJhZClgO1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiX3JlZnMudHNcIi8+XHJcbm1vZHVsZSBUZXNwIHtcclxuICAgIGV4cG9ydCBjbGFzcyBNZW51SXRlbSB7XHJcbiAgICAgICAgc3RhdGljIHNlcGFyYXRvciA9IG5ldyBNZW51SXRlbShcIlwiKTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIGxhYmVsOiBzdHJpbmcsIHB1YmxpYyBmdW5jPzogKCkgPT4gdm9pZCkgeyB9XHJcbiAgICB9XHJcbiAgICBleHBvcnQgY2xhc3MgTWVudSB7XHJcbiAgICAgICAgZWxlbWVudDogSFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgICAgIHByaXZhdGUgbGlzdGVuZXI6IENoYW5nZUxpc3RlbmVyO1xyXG4gICAgICAgIHByaXZhdGUgZGlzcG9zZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcGxpY2F0aW9uLCBmaXhlZDogYm9vbGVhbikge1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyID0gdGhpcy5hcHAuYWRkQ2hhbmdlTGlzdGVuZXIoQ2hhbmdlUmVhc29uLkNsZWFyTWVudXMsICgpID0+IHRoaXMuaGlkZSgpKTtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gXCJtZW51XCI7XHJcbiAgICAgICAgICAgIGlmIChmaXhlZClcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiZml4ZWRcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5vbm1vdXNlZG93biA9IGV2ID0+IGV2LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmRpc3Bvc2VkKSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMubGlzdGVuZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnQpO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2VkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldFN0eWxlKCk6IENTU1N0eWxlRGVjbGFyYXRpb24ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kaXNwb3NlZCA/IG51bGwgOiB0aGlzLmVsZW1lbnQuc3R5bGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZXREYXRhKGl0ZW1zOiBNZW51SXRlbVtdKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmRpc3Bvc2VkKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB0aGlzLmhpZGUoKTtcclxuICAgICAgICAgICAgdmFyIGNoaWxkOiBFbGVtZW50O1xyXG4gICAgICAgICAgICB3aGlsZSAoKGNoaWxkID0gdGhpcy5lbGVtZW50LmZpcnN0RWxlbWVudENoaWxkKSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQ2hpbGQoY2hpbGQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGxpKTtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtID09PSBNZW51SXRlbS5zZXBhcmF0b3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBsaS5jbGFzc05hbWUgPSBcInNlcGFyYXRvclwiO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsaS50ZXh0Q29udGVudCA9IGl0ZW0ubGFiZWw7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uZnVuYyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpLmNsYXNzTmFtZSA9IFwibGlua1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaS5vbm1vdXNlZG93biA9IGV2ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5mdW5jKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb3BlbigpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGlzcG9zZWQpIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uQ2xlYXJNZW51cyk7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuZWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZCAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcImluaGVyaXRcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaGlkZSgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGlzcG9zZWQpIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiX3JlZnMudHNcIi8+XHJcbm1vZHVsZSBUZXNwIHtcclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSVBhdGhFZGdlIHtcclxuICAgICAgICB0YXJnZXQ6IElQYXRoTm9kZTtcclxuICAgICAgICBjb3N0OiBudW1iZXI7XHJcbiAgICAgICAgdHlwZTogc3RyaW5nO1xyXG4gICAgfVxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJUGF0aE5vZGUge1xyXG4gICAgICAgIG5vZGU6IElOb2RlO1xyXG4gICAgICAgIGRpc3Q6IG51bWJlcjtcclxuICAgICAgICBwcmV2OiBJUGF0aE5vZGU7XHJcbiAgICAgICAgcHJldkVkZ2U6IElQYXRoRWRnZTtcclxuICAgICAgICBlZGdlczogSVBhdGhFZGdlW107XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJUGF0aFdvcmtlckRhdGEge1xyXG4gICAgICAgIG5vZGVzOiBJTm9kZVtdO1xyXG4gICAgICAgIGFyZWFzOiBJQXJlYVtdO1xyXG4gICAgICAgIHNvdXJjZTogSU5vZGU7XHJcbiAgICAgICAgZGVzdGluYXRpb246IElOb2RlO1xyXG4gICAgICAgIG1hcms6IElOb2RlO1xyXG4gICAgICAgIGZlYXR1cmVzOiBJRmVhdHVyZUxpc3Q7XHJcbiAgICB9XHJcbiAgICAvKiogQ2FsY3VsYXRlcyB0aGUgYmVzdCBwYXRoIGluIHRoZSBjdXJyZW50IGNvbnRleHQgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBQYXRoIHtcclxuICAgICAgICBwcml2YXRlIHdvcmtlcjogV29ya2VyO1xyXG4gICAgICAgIHByaXZhdGUgd29ya2luZzogUHJvbWlzZTxJUGF0aE5vZGU+O1xyXG4gICAgICAgIHByaXZhdGUgcXVldWU6IFByb21pc2U8SVBhdGhOb2RlPjtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcGxpY2F0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmFkZENoYW5nZUxpc3RlbmVyKENoYW5nZVJlYXNvbi5Db250ZXh0Q2hhbmdlIHwgQ2hhbmdlUmVhc29uLk1hcmtDaGFuZ2UgfCBDaGFuZ2VSZWFzb24uRmVhdHVyZUNoYW5nZSwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maW5kUGF0aCgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgZmluZFBhdGgoKTogUHJvbWlzZTxJUGF0aE5vZGU+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucXVldWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLndvcmtpbmcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXVlID0gPFByb21pc2U8SVBhdGhOb2RlPj48YW55PnRoaXMud29ya2luZy50aGVuKCgpID0+IHRoaXMuZmluZFBhdGgoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gdGhpcy5hcHAuY29udGV4dDtcclxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGNvbnRleHQuc291cmNlTm9kZTtcclxuICAgICAgICAgICAgdmFyIGRlc3RpbmF0aW9uID0gY29udGV4dC5kZXN0Tm9kZTtcclxuICAgICAgICAgICAgaWYgKHNvdXJjZSA9PSBudWxsIHx8IGRlc3RpbmF0aW9uID09IG51bGwgfHwgc291cmNlID09PSBkZXN0aW5hdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uUGF0aFVwZGF0ZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiSW52YWxpZCBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uIGNvbmZpZ3VyYXRpb25cIikpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgd29ybGQgPSB0aGlzLmFwcC53b3JsZDtcclxuICAgICAgICAgICAgdmFyIGRhdGE6IElQYXRoV29ya2VyRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIG5vZGVzOiB3b3JsZC5ub2RlcyxcclxuICAgICAgICAgICAgICAgIGFyZWFzOiB3b3JsZC5hcmVhcyxcclxuICAgICAgICAgICAgICAgIHNvdXJjZTogc291cmNlLFxyXG4gICAgICAgICAgICAgICAgZGVzdGluYXRpb246IGRlc3RpbmF0aW9uLFxyXG4gICAgICAgICAgICAgICAgbWFyazogY29udGV4dC5tYXJrTm9kZSxcclxuICAgICAgICAgICAgICAgIGZlYXR1cmVzOiB0aGlzLmFwcC5mZWF0dXJlc1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMud29ya2luZyA9IG5ldyBQcm9taXNlPElQYXRoTm9kZT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMud29ya2VyID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndvcmtlciA9IG5ldyBXb3JrZXIoXCJqcy9wYXRoLndvcmtlci5qc1wiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLndvcmtlci5vbm1lc3NhZ2UgPSBldiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWV1ZSA9IHRoaXMud29ya2luZyA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uUGF0aFVwZGF0ZSwgZXYuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShldi5kYXRhKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB0aGlzLndvcmtlci5vbmVycm9yID0gZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucXVldWUgPSB0aGlzLndvcmtpbmcgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLnRyaWdnZXJDaGFuZ2UoQ2hhbmdlUmVhc29uLlBhdGhVcGRhdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChldik7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoZGF0YSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJfcmVmcy50c1wiLz5cclxubW9kdWxlIFRlc3Age1xyXG4gICAgZXhwb3J0IHR5cGUgVHJhbnNwb3J0U291cmNlID0geyBba2V5OiBzdHJpbmddOiBJTm9kZVNvdXJjZVtdIH07XHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElXb3JsZFNvdXJjZSB7XHJcbiAgICAgICAgdHJhbnNwb3J0OiBUcmFuc3BvcnRTb3VyY2U7XHJcbiAgICAgICAgcmVnaW9uczogSU5vZGVTb3VyY2VbXTtcclxuICAgICAgICBsYW5kbWFya3M6IElOb2RlU291cmNlW107XHJcbiAgICB9XHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElOb2RlU291cmNlIHtcclxuICAgICAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgeDogbnVtYmVyO1xyXG4gICAgICAgIHk6IG51bWJlcjtcclxuICAgICAgICBlZGdlczogbnVtYmVyW107XHJcbiAgICAgICAgb25lV2F5RWRnZXM6IG51bWJlcltdO1xyXG4gICAgICAgIHRvcDogbnVtYmVyO1xyXG4gICAgICAgIGNlbGxzOiBudW1iZXJbXVtdO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBTdGF0aWMgYXNzZXRzIGFuZCBsb2NhdGlvbnMgKi9cclxuICAgIGV4cG9ydCBjbGFzcyBXb3JsZCB7XHJcbiAgICAgICAgbm9kZXM6IE5vZGVbXTtcclxuICAgICAgICBlZGdlczogRWRnZVtdO1xyXG4gICAgICAgIGFyZWFzOiBBcmVhW107XHJcbiAgICAgICAgcmVnaW9uczogQXJlYVtdO1xyXG4gICAgICAgIGxhbmRtYXJrczogQXJlYVtdO1xyXG5cclxuICAgICAgICBwcml2YXRlIG5vZGVzQnlJZDogeyBba2V5OiBudW1iZXJdOiBJTm9kZSB9ID0ge307XHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgdHJhbnNwb3J0Q29zdDogbnVtYmVyID0gMTA7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXBwOiBBcHBsaWNhdGlvbiwgZGF0YTogSVdvcmxkU291cmNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMubm9kZXMgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5lZGdlcyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLmFyZWFzID0gW107XHJcblxyXG4gICAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhkYXRhLnRyYW5zcG9ydCkuZm9yRWFjaChrID0+IHRoaXMubG9hZFRyYW5zcG9ydChkYXRhLnRyYW5zcG9ydCwgaykpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZ2lvbnMgPSBkYXRhLnJlZ2lvbnMubWFwKGEgPT4gV29ybGQubWFrZUFyZWEobmV3IE5vZGUoYS5uYW1lLCBhLm5hbWUsIG5ldyBWZWMyKDAsIDApLCBcInJlZ2lvblwiKSwgYSkpO1xyXG4gICAgICAgICAgICB0aGlzLmxhbmRtYXJrcyA9IGRhdGEubGFuZG1hcmtzLm1hcChhID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBub2RlID0gbmV3IE5vZGUoYS5uYW1lLCBhLm5hbWUsIG5ldyBWZWMyKDAsIDApLCBcImxhbmRtYXJrXCIpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyZWEgPSBXb3JsZC5tYWtlQXJlYShub2RlLCBhKTtcclxuICAgICAgICAgICAgICAgIC8vIHNldCBub2RlIGxvY2F0aW9uIHRvIGF2ZXJhZ2UgY2VudGVyIHBvaW50IG9mIGFsbCBjZWxsc1xyXG4gICAgICAgICAgICAgICAgdmFyIHN1bVg6IG51bWJlciA9IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3VtWTogbnVtYmVyID0gMDtcclxuICAgICAgICAgICAgICAgIHZhciBjb3VudDogbnVtYmVyID0gMDtcclxuICAgICAgICAgICAgICAgIGFyZWEucm93cy5mb3JFYWNoKHIgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHN1bVggKz0gKHIueDEgKyByLndpZHRoIC8gMikgKiByLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgIHN1bVkgKz0gKHIueSArIDAuNSkgKiByLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvdW50ICs9IHIud2lkdGg7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIG5vZGUucG9zID0gVmVjMi5mcm9tQ2VsbChzdW1YIC8gY291bnQsIHN1bVkgLyBjb3VudCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJlYTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBpbmRleCBieSBpZFxyXG4gICAgICAgICAgICB0aGlzLm5vZGVzQnlJZCA9IHt9O1xyXG4gICAgICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2gobiA9PiB0aGlzLm5vZGVzQnlJZFtuLmlkXSA9IG4pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbG9hZFRyYW5zcG9ydChkYXRhOiBUcmFuc3BvcnRTb3VyY2UsIHR5cGU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgYXJyYXk6IElOb2RlU291cmNlW10gPSBkYXRhW3R5cGVdO1xyXG4gICAgICAgICAgICB2YXIgZmVhdCA9IHRoaXMuYXBwLmZlYXR1cmVzLmJ5TmFtZVt0eXBlXTtcclxuICAgICAgICAgICAgdmFyIHR5cGVOYW1lID0gZmVhdC5sb2NhdGlvbiB8fCBmZWF0Lm5hbWU7XHJcbiAgICAgICAgICAgIHZhciBub2RlczogTm9kZVtdID0gYXJyYXkubWFwKG4gPT4gbmV3IE5vZGUobi5uYW1lLCBgJHt0eXBlTmFtZX0sICR7bi5uYW1lfWAsIG5ldyBWZWMyKG4ueCwgbi55KSwgdHlwZSwgdHJ1ZSkpO1xyXG4gICAgICAgICAgICB0aGlzLm5vZGVzID0gdGhpcy5ub2Rlcy5jb25jYXQobm9kZXMpO1xyXG4gICAgICAgICAgICB2YXIgY29zdCA9IFdvcmxkLnRyYW5zcG9ydENvc3Q7XHJcbiAgICAgICAgICAgIGFycmF5LmZvckVhY2goKG4sIGkxKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbjEgPSBub2Rlc1tpMV07XHJcbiAgICAgICAgICAgICAgICBpZiAobi5lZGdlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIG4uZWRnZXMuZm9yRWFjaChpMiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuMiA9IG5vZGVzW2kyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVkZ2UgPSBuZXcgRWRnZShuMSwgbjIsIGNvc3QpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuMS5lZGdlcy5wdXNoKGVkZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuMi5lZGdlcy5wdXNoKGVkZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVkZ2VzLnB1c2goZWRnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobi5vbmVXYXlFZGdlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIG4ub25lV2F5RWRnZXMuZm9yRWFjaChpMiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlZGdlID0gbmV3IEVkZ2UobjEsIG5vZGVzW2kyXSwgY29zdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG4xLmVkZ2VzLnB1c2goZWRnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZWRnZXMucHVzaChlZGdlKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChuLmNlbGxzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcmVhcy5wdXNoKFdvcmxkLm1ha2VBcmVhKG4xLCBuKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgbWFrZUFyZWEobm9kZTogTm9kZSwgZGF0YTogSU5vZGVTb3VyY2UpIHtcclxuICAgICAgICAgICAgdmFyIHkgPSBkYXRhLnRvcCB8fCAwO1xyXG4gICAgICAgICAgICB2YXIgcm93cyA9IGRhdGEuY2VsbHMubWFwKGMgPT4gbmV3IENlbGxSb3coeSsrLCBjWzBdLCBjWzFdKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQXJlYShub2RlLCByb3dzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpbmROb2RlQnlJZChpZDogbnVtYmVyKTogTm9kZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5vZGVzQnlJZFtpZF0gfHwgbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldFJlZ2lvbk5hbWUocG9zOiBJVmVjMik6IHN0cmluZyB7XHJcbiAgICAgICAgICAgIHZhciBhcmVhID0gV29ybGQuZ2V0QXJlYUJ5Q2VsbCh0aGlzLnJlZ2lvbnMsIENlbGwuZnJvbVBvc2l0aW9uKHBvcykpO1xyXG4gICAgICAgICAgICByZXR1cm4gYXJlYSAhPSBudWxsID8gYXJlYS50YXJnZXQubmFtZSA6IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdldExhbmRtYXJrTmFtZShwb3M6IElWZWMyKTogc3RyaW5nIHtcclxuICAgICAgICAgICAgdmFyIGFyZWEgPSBXb3JsZC5nZXRBcmVhQnlDZWxsKHRoaXMubGFuZG1hcmtzLCBDZWxsLmZyb21Qb3NpdGlvbihwb3MpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZWEgIT0gbnVsbCA/IGFyZWEudGFyZ2V0Lm5hbWUgOiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyBnZXRBcmVhQnlDZWxsKHNvdXJjZTogQXJlYVtdLCBjZWxsOiBJVmVjMik6IEFyZWEge1xyXG4gICAgICAgICAgICB2YXIgYXJlYTogQXJlYTtcclxuICAgICAgICAgICAgaWYgKHNvdXJjZS5zb21lKHIgPT4gQXJlYS5jb250YWluc0NlbGwociwgY2VsbCkgJiYgKGFyZWEgPSByKSAhPSBudWxsKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBhcmVhO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZC9lczYtcHJvbWlzZS9lczYtcHJvbWlzZS5kLnRzXCIvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZC93aGF0d2ctZmV0Y2gvd2hhdHdnLWZldGNoLmQudHNcIi8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJhcHAudHNcIi8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJjb21tb24udHNcIi8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJjb250ZXh0LnRzXCIvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiY29udGV4dG1lbnUudHNcIi8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJjb250cm9scy50c1wiLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImZlYXR1cmVzLnRzXCIvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwibWFwLnRzXCIvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwibWVudS50c1wiLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cInBhdGgudHNcIi8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ3b3JsZC50c1wiLz4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiX3JlZnMudHNcIi8+XHJcbm1vZHVsZSBUZXNwIHtcclxuICAgIGV4cG9ydCB0eXBlIENoYW5nZUxpc3RlbmVyRnVuYyA9IChyZWFzb246IENoYW5nZVJlYXNvbiwgZGF0YTogYW55KSA9PiB2b2lkO1xyXG4gICAgZXhwb3J0IGVudW0gQ2hhbmdlUmVhc29uIHtcclxuICAgICAgICBOb25lID0gMHgwLFxyXG4gICAgICAgIC8qKiBUaGUgc2VsZWN0ZWQgc291cmNlIG5vZGUgaGFzIGNoYW5nZWQgKi9cclxuICAgICAgICBTb3VyY2VDaGFuZ2UgPSAweDEsXHJcbiAgICAgICAgLyoqIFRoZSBzZWxlY3RlZCBkZXN0aW5hdGlvbiBub2RlIGhhcyBjaGFuZ2VkICovXHJcbiAgICAgICAgRGVzdGluYXRpb25DaGFuZ2UgPSAweDIsXHJcbiAgICAgICAgLyoqIFRoZSBtYXJrIG5vZGUgbG9jYXRpb24gaGFzIGNoYW5nZWQgKi9cclxuICAgICAgICBNYXJrQ2hhbmdlID0gMHg0LFxyXG4gICAgICAgIC8qKiBUaGUgZWl0aGVyIHRoZSBzb3VyY2UsIGRlc3RpbmF0aW9uIG9yIG1hcmsgbG9jYXRpb24gaGFzIGNoYW5nZWQgKi9cclxuICAgICAgICBDb250ZXh0Q2hhbmdlID0gU291cmNlQ2hhbmdlIHwgRGVzdGluYXRpb25DaGFuZ2UgfCBNYXJrQ2hhbmdlLFxyXG4gICAgICAgIC8qKiBUaGUgZW5hYmxlZCBzdGF0ZSBvciB2aXNpYmlsaXR5IG9mIGEgZmVhdHVyZSBoYXMgY2hhbmdlZCAqL1xyXG4gICAgICAgIEZlYXR1cmVDaGFuZ2UgPSAweDgsXHJcbiAgICAgICAgLyoqIEEgbmV3IHBhdGggaGFzIGJlZW4gY2FsY3VsYXRlZCAqL1xyXG4gICAgICAgIFBhdGhVcGRhdGUgPSAweDEwLFxyXG4gICAgICAgIC8qKiBBbiBpbnB1dCBldmVudCBoYXMgdHJpZ2dlcmVkIG1lbnVzIHRvIGNsb3NlICovXHJcbiAgICAgICAgQ2xlYXJNZW51cyA9IDB4MjAsXHJcbiAgICAgICAgQW55ID0gMHgzZlxyXG4gICAgfVxyXG4gICAgZXhwb3J0IGNsYXNzIENoYW5nZUxpc3RlbmVyIHtcclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhc29uczogQ2hhbmdlUmVhc29uLCBwdWJsaWMgZnVuYzogQ2hhbmdlTGlzdGVuZXJGdW5jKSB7IH1cclxuXHJcbiAgICAgICAgdHJpZ2dlcihyZWFzb246IENoYW5nZVJlYXNvbiwgZGF0YTogYW55KSB7XHJcbiAgICAgICAgICAgIGlmICgodGhpcy5yZWFzb25zICYgcmVhc29uKSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mdW5jKHJlYXNvbiwgZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIENvcmUgVEVTUGF0aGZpbmRlciBhcHBsaWNhdGlvbiAqL1xyXG4gICAgZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uIHtcclxuICAgICAgICBsb2FkZWQ6IFByb21pc2U8QXBwbGljYXRpb24+O1xyXG4gICAgICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50O1xyXG4gICAgICAgIGNvbnRleHQ6IENvbnRleHQ7XHJcbiAgICAgICAgZmVhdHVyZXM6IElGZWF0dXJlTGlzdDtcclxuICAgICAgICBwYXRoOiBQYXRoO1xyXG4gICAgICAgIHdvcmxkOiBXb3JsZDtcclxuICAgICAgICBjb250cm9sczogQ29udHJvbHM7XHJcbiAgICAgICAgbWFwOiBNYXA7XHJcbiAgICAgICAgY3R4TWVudTogQ29udGV4dE1lbnU7XHJcblxyXG4gICAgICAgIHByaXZhdGUgbGlzdGVuZXJzOiBDaGFuZ2VMaXN0ZW5lcltdID0gW107XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xyXG4gICAgICAgICAgICB0aGlzLmxvYWRlZCA9IHdpbmRvdy5mZXRjaChcImRhdGEvZGF0YS5qc29uXCIpXHJcbiAgICAgICAgICAgICAgICAudGhlbihyZXMgPT4gcmVzLmpzb24oKSlcclxuICAgICAgICAgICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dCA9IG5ldyBDb250ZXh0KHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmVhdHVyZXMgPSBGZWF0dXJlcy5pbml0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXRoID0gbmV3IFBhdGgodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53b3JsZCA9IG5ldyBXb3JsZCh0aGlzLCA8SVdvcmxkU291cmNlPjxhbnk+ZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXAgPSBuZXcgTWFwKHRoaXMsIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFwXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRyb2xzID0gbmV3IENvbnRyb2xzKHRoaXMsIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udHJvbHNcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4TWVudSA9IG5ldyBDb250ZXh0TWVudSh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5vbm1vdXNlZG93biA9IGRvY3VtZW50LmJvZHkub25jb250ZXh0bWVudSA9ICgpID0+IHRoaXMudHJpZ2dlckNoYW5nZShDaGFuZ2VSZWFzb24uQ2xlYXJNZW51cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVCb2R5Q2xhc3MoXCJsb2FkaW5nXCIsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIExpc3RlbiBmb3IgYXBwbGljYXRpb24gbGV2ZWwgY2hhbmdlcyAqL1xyXG4gICAgICAgIGFkZENoYW5nZUxpc3RlbmVyKHJlYXNvbnM6IENoYW5nZVJlYXNvbiwgZnVuYzogQ2hhbmdlTGlzdGVuZXJGdW5jKTogQ2hhbmdlTGlzdGVuZXIge1xyXG4gICAgICAgICAgICB2YXIgbGlzdGVuZXIgPSBuZXcgQ2hhbmdlTGlzdGVuZXIocmVhc29ucywgZnVuYyk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gbGlzdGVuZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qKiBSZW1vdmUgYSBwcmV2aW91c2x5IGFkZGVkIGxpc3RlbmVyICovXHJcbiAgICAgICAgcmVtb3ZlQ2hhbmdlTGlzdGVuZXIobGlzdGVuZXI6IENoYW5nZUxpc3RlbmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBpeCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xyXG4gICAgICAgICAgICBpZiAoaXggPiAtMSlcclxuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLnNwbGljZShpeCwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qKiBJbmZvcm0gYWxsIGxpc3RlbmVycyBhYm91dCBhIG5ldyBjaGFuZ2UgKi9cclxuICAgICAgICB0cmlnZ2VyQ2hhbmdlKHJlYXNvbjogQ2hhbmdlUmVhc29uLCBkYXRhPzogYW55KSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2gobCA9PiBsLnRyaWdnZXIocmVhc29uLCBkYXRhKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogVG9nZ2xlIGEgY2xhc3MgYXR0cmlidXRlIG5hbWUgaW4gdGhlIGRvY3VtZW50IGJvZHkgKi9cclxuICAgICAgICB0b2dnbGVCb2R5Q2xhc3MobmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQobmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUobmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBhcHBsaWNhdGlvbiwgZm9yIGRlYnVnZ2luZyBwdXJwb3NlcyBvbmx5ICovXHJcbiAgICBleHBvcnQgdmFyIGFwcEluc3RhbmNlID0gbmV3IEFwcGxpY2F0aW9uKCk7XHJcbn0iXSwic291cmNlUm9vdCI6Ii4uL3RzIn0=