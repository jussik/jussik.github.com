var tesp;
(function (tesp) {
    var Application = (function () {
        function Application() {
            var _this = this;
            this.loaded = window.fetch("data/data.json")
                .then(function (res) { return res.json(); })
                .then(function (data) {
                _this.world = new tesp.World(_this, data);
                _this.map = new tesp.Map(_this, document.getElementById("map"));
                _this.controls = new tesp.Controls(_this, document.getElementById("controls"));
                _this.menu = new tesp.ContextMenu(_this, document.getElementById("context-menu"));
                document.body.onmousedown = document.body.oncontextmenu = function (ev) { return _this.menu.hide(); };
                _this.toggleClass("loading", false);
                return _this;
            });
        }
        Application.prototype.toggleClass = function (name, enabled) {
            if (enabled) {
                document.body.classList.add(name);
            }
            else {
                document.body.classList.remove(name);
            }
        };
        return Application;
    })();
    tesp.Application = Application;
    tesp.app = new Application();
})(tesp || (tesp = {}));
var tesp;
(function (tesp) {
    var ContextMenu = (function () {
        function ContextMenu(app, element) {
            var _this = this;
            this.app = app;
            this.element = element;
            this.element.oncontextmenu = this.element.onmousedown = function (ev) { return ev.stopPropagation(); };
            this.element.onclick = function (ev) {
                ev.stopPropagation();
                var item = event.target;
                if (item.classList.contains("link")) {
                    var context = item.dataset['contextSet'];
                    if (context !== undefined) {
                        var data = _this.element.dataset;
                        var nodeId = data['nodeId'];
                        var node;
                        if (nodeId !== undefined && (node = _this.app.world.findNodeById(+nodeId)) != null) {
                            _this.app.world.setContextNode(context, node);
                        }
                        else {
                            _this.app.world.setContextLocation(context, +data['posX'], +data['posY']);
                        }
                    }
                    else {
                        context = item.dataset['contextUnset'];
                        if (context !== undefined) {
                            _this.app.world.clearContext(context);
                        }
                    }
                    _this.hide();
                }
            };
        }
        ContextMenu.prototype.openNode = function (node) {
            this.open(node.pos.x, node.pos.y, node);
        };
        ContextMenu.prototype.open = function (x, y, node) {
            var _this = this;
            if (node != null && !node.permanent)
                node = null; // disallow operations on temporary nodes
            var lines = [];
            var landmark = this.app.world.getLandmarkName(x, y);
            if (node != null) {
                var feat = this.app.world.features.byName[node.type];
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
                x = node.pos.x;
                y = node.pos.y;
            }
            else if (landmark != null) {
                lines.push(landmark);
            }
            var region = this.app.world.getRegionName(x, y);
            if (region != null) {
                lines.push(region + " Region");
            }
            var separator = this.element.getElementsByClassName("separator")[0];
            var child;
            while ((child = this.element.firstElementChild) != separator) {
                this.element.removeChild(child);
            }
            lines.forEach(function (l) {
                var item = document.createElement("li");
                item.textContent = l;
                _this.element.insertBefore(item, separator);
            });
            this.element.style.left = x + "px";
            this.element.style.top = y + "px";
            var data = this.element.dataset;
            if (node != null) {
                data['nodeId'] = node.id + '';
                delete data['posX'];
                delete data['posY'];
            }
            else {
                data['posX'] = x + '';
                data['posY'] = y + '';
                delete data['nodeId'];
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
            if (rect.top < 10) {
                scrollY = pageYOffset + rect.top - 10;
            }
            else if (rect.bottom > innerHeight - 27) {
                scrollY = pageYOffset + rect.bottom - innerHeight + 27;
            }
            if (scrollX !== pageXOffset || scrollY !== pageYOffset)
                scroll(scrollX, scrollY);
        };
        ContextMenu.prototype.hide = function () {
            this.element.style.display = "none";
        };
        return ContextMenu;
    })();
    tesp.ContextMenu = ContextMenu;
})(tesp || (tesp = {}));
var tesp;
(function (tesp) {
    var Controls = (function () {
        function Controls(app, element) {
            var _this = this;
            this.app = app;
            this.element = element;
            this.app.world.addListener(function (reason) {
                if (reason === tesp.WorldUpdate.PathUpdate)
                    _this.updatePath();
                else if (reason === tesp.WorldUpdate.SourceChange)
                    _this.updateNodeInfo('.control-source-info', _this.app.world.sourceNode);
                else if (reason === tesp.WorldUpdate.DestinationChange)
                    _this.updateNodeInfo('.control-destination-info', _this.app.world.destNode);
                else if (reason === tesp.WorldUpdate.MarkChange)
                    _this.updateNodeInfo('.control-mark-info', _this.app.world.markNode);
            });
            var nodeSearchIndex = {};
            var searchInput = element.querySelector('.search-input');
            var datalist = element.querySelector('#search-list');
            this.app.world.nodes
                .concat(this.app.world.landmarks.map(function (a) { return a.target; }))
                .forEach(function (n) {
                var opt = document.createElement("option");
                var feat = _this.app.world.features.byName[n.type];
                var value = feat ? n.name + " (" + _this.app.world.features.byName[n.type].name + ")" : n.name;
                nodeSearchIndex[value] = n;
                opt.value = value;
                datalist.appendChild(opt);
            });
            for (var child = element.firstElementChild; child; child = child.nextElementSibling) {
                var name = child.dataset['controlContainer'];
                if (name === "path") {
                    this.pathContainer = child;
                }
                else if (name === "features") {
                    this.featuresContainer = child;
                }
            }
            this.drawFeatures();
            searchInput.oninput = function (ev) {
                var node = nodeSearchIndex[searchInput.value];
                if (node !== undefined) {
                    _this.app.menu.openNode(node);
                }
                else {
                    _this.app.menu.hide();
                }
            };
        }
        Controls.prototype.updateNodeInfo = function (selector, node) {
            var _this = this;
            var el = this.element.querySelector(selector);
            if (node != null) {
                el.textContent = node.longName;
                el.onclick = function (ev) { return _this.app.menu.openNode(node); };
            }
            else {
                el.textContent = "";
                el.onclick = null;
            }
        };
        Controls.prototype.updatePath = function () {
            var child;
            while (child = this.pathContainer.firstElementChild) {
                this.pathContainer.removeChild(child);
            }
            var pathNode = this.app.world.pathEnd;
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
                    var feat = this.app.world.features.byName[edge.type];
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
                linkText = node.type == edge.type ? node.name : node.longName;
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
            this.app.world.features.forEach(function (f) {
                var el = document.createElement("div");
                el.textContent = f.name + ":";
                el.appendChild(_this.drawCheckbox(function (val) {
                    f.hidden = !val;
                    _this.app.world.trigger(tesp.WorldUpdate.FeatureChange);
                }, !f.hidden));
                if (!f.visualOnly)
                    el.appendChild(_this.drawCheckbox(function (val) {
                        f.disabled = !val;
                        _this.app.world.trigger(tesp.WorldUpdate.FeatureChange);
                    }, !f.disabled));
                _this.featuresContainer.appendChild(el);
            });
        };
        Controls.prototype.drawCheckbox = function (onchange, initial) {
            var input = document.createElement("input");
            input.type = "checkbox";
            input.onchange = function (ev) { return onchange(input.checked); };
            input.checked = initial;
            return input;
        };
        return Controls;
    })();
    tesp.Controls = Controls;
})(tesp || (tesp = {}));
var tesp;
(function (tesp) {
    var Map = (function () {
        function Map(app, element) {
            var _this = this;
            this.app = app;
            this.element = element;
            this.app.world.addListener(function (reason) {
                if (reason === tesp.WorldUpdate.PathUpdate)
                    _this.renderPath();
                else if (reason === tesp.WorldUpdate.SourceChange)
                    _this.renderSource();
                else if (reason === tesp.WorldUpdate.DestinationChange)
                    _this.renderDestination();
                else if (reason === tesp.WorldUpdate.MarkChange)
                    _this.renderMark();
                else if (reason === tesp.WorldUpdate.FeatureChange)
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
            if (target.classList.contains('map-node')) {
                var id = target.dataset['nodeId'];
                if (id !== undefined) {
                    return this.app.world.findNodeById(+id);
                }
            }
            return null;
        };
        Map.prototype.triggerContextMenu = function (ev, node) {
            this.app.menu.open(ev.pageX, ev.pageY, node || this.getEventNode(ev));
        };
        Map.prototype.initDragScroll = function () {
            var _this = this;
            var img = this.element.querySelector('img');
            var mousedown = false, prevX, prevY;
            var stop = function (ev) {
                mousedown = false;
                _this.app.toggleClass("scrolling", false);
                ev.preventDefault();
            };
            var start = function (ev) {
                mousedown = true;
                prevX = ev.clientX;
                prevY = ev.clientY;
                _this.app.toggleClass("scrolling", true);
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
                _this.areaContainer.appendChild(_this.drawCellEdge(prev.x1, prev.y + 1, prev.x2 + 1, prev.y + 1, type));
            });
        };
        Map.prototype.drawCellEdge = function (x1, y1, x2, y2, type) {
            return this.drawEdge(tesp.Vec2.fromCell(x1, y1), tesp.Vec2.fromCell(x2, y2), type, "map-area");
        };
        Map.prototype.renderPath = function () {
            if (this.pathContainer != null)
                this.pathContainer.parentElement.removeChild(this.pathContainer);
            var pathNode = this.app.world.pathEnd;
            if (pathNode == null) {
                this.pathContainer = null;
                return;
            }
            this.pathContainer = document.createElement("div");
            this.element.appendChild(this.pathContainer);
            while (pathNode && pathNode.prev) {
                this.pathContainer.appendChild(this.drawEdge(pathNode.node.pos, pathNode.prev.node.pos, 'path', 'map-' + pathNode.prevEdge.type));
                pathNode = pathNode.prev;
            }
        };
        Map.prototype.renderMark = function () {
            this.markElem = this.addOrUpdateNodeElem(this.app.world.markNode, this.markElem);
        };
        Map.prototype.renderSource = function () {
            this.sourceElem = this.addOrUpdateNodeElem(this.app.world.sourceNode, this.sourceElem);
        };
        Map.prototype.renderDestination = function () {
            this.destElem = this.addOrUpdateNodeElem(this.app.world.destNode, this.destElem);
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
                for (var i = 0; i < 37; i++) {
                    var el = document.createElement('div');
                    el.classList.add("map-grid");
                    el.classList.add("map-grid-v");
                    el.style.left = (i * tesp.Cell.width + tesp.Cell.widthOffset) + "px";
                    this.gridContainer.appendChild(el);
                }
                for (var i = 0; i < 42; i++) {
                    var el = document.createElement('div');
                    el.classList.add("map-grid");
                    el.classList.add("map-grid-h");
                    el.style.top = (i * tesp.Cell.height + tesp.Cell.heightOffset) + "px";
                    this.gridContainer.appendChild(el);
                }
            }
        };
        Map.prototype.updateFeatures = function () {
            var _this = this;
            this.element.className = "";
            this.app.world.features.forEach(function (f) {
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
            element.dataset['nodeId'] = (node.referenceId || node.id) + '';
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
    tesp.Map = Map;
})(tesp || (tesp = {}));
var tesp;
(function (tesp) {
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
    tesp.Vec2 = Vec2;
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
    tesp.Cell = Cell;
    var Node = (function () {
        function Node(name, longName, x, y, type, permanent) {
            if (permanent === void 0) { permanent = false; }
            this.name = name;
            this.longName = longName;
            this.type = type;
            this.permanent = permanent;
            this.id = Node.identity++;
            this.pos = new Vec2(x, y);
            this.edges = [];
        }
        Node.identity = 1;
        return Node;
    })();
    tesp.Node = Node;
    var Edge = (function () {
        function Edge(srcNode, destNode, cost) {
            this.srcNode = srcNode;
            this.destNode = destNode;
            this.cost = cost;
        }
        return Edge;
    })();
    tesp.Edge = Edge;
    var CellRow = (function () {
        function CellRow(y, x1, x2) {
            this.y = y;
            this.x1 = x1;
            this.x2 = x2;
            this.width = x2 - x1 + 1;
        }
        return CellRow;
    })();
    tesp.CellRow = CellRow;
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
    tesp.Area = Area;
    (function (WorldUpdate) {
        WorldUpdate[WorldUpdate["SourceChange"] = 0] = "SourceChange";
        WorldUpdate[WorldUpdate["DestinationChange"] = 1] = "DestinationChange";
        WorldUpdate[WorldUpdate["MarkChange"] = 2] = "MarkChange";
        WorldUpdate[WorldUpdate["FeatureChange"] = 3] = "FeatureChange";
        WorldUpdate[WorldUpdate["PathUpdate"] = 4] = "PathUpdate";
    })(tesp.WorldUpdate || (tesp.WorldUpdate = {}));
    var WorldUpdate = tesp.WorldUpdate;
    var Feature = (function () {
        function Feature() {
        }
        return Feature;
    })();
    tesp.Feature = Feature;
    var PathEdge = (function () {
        function PathEdge(target, cost, type) {
            this.target = target;
            this.cost = cost;
            this.type = type;
        }
        return PathEdge;
    })();
    tesp.PathEdge = PathEdge;
    var PathNode = (function () {
        function PathNode(node) {
            this.node = node;
            this.dist = Infinity;
        }
        return PathNode;
    })();
    tesp.PathNode = PathNode;
    var World = (function () {
        function World(app, data) {
            var _this = this;
            this.app = app;
            this.listeners = [];
            this.nodesById = {};
            this.features = [
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
            var fIdx = this.features.byName = {};
            this.features.forEach(function (f) { return fIdx[f.type] = f; });
            fIdx['edge'].hidden = fIdx['area'].hidden = fIdx['grid'].hidden = true;
            this.nodes = [];
            this.edges = [];
            this.areas = [];
            for (var k in data.transport) {
                this.loadTransport(data.transport, k);
            }
            this.regions = data.regions
                .map(function (a) { return _this.makeArea(new Node(a.name, a.name, 0, 0, "region"), a); });
            this.landmarks = data.landmarks.map(function (a) {
                var node = new Node(a.name, a.name, 0, 0, "landmark");
                var area = _this.makeArea(node, a);
                // set node location to average center point of all cells
                var sumX = 0;
                var sumY = 0;
                var count = 0;
                area.rows.forEach(function (r) {
                    sumX += (r.x1 + r.width / 2) * r.width;
                    sumY += (r.y + 0.5) * r.width;
                    count += r.width;
                });
                node.pos = Vec2.fromCell(sumX / count, sumY / count);
                return area;
            });
            // index by id
            this.nodesById = {};
            this.nodes.forEach(function (n) { return _this.nodesById[n.id] = n; });
            this.addListener(function (reason) {
                if (reason === WorldUpdate.SourceChange
                    || reason === WorldUpdate.DestinationChange
                    || reason === WorldUpdate.MarkChange
                    || reason === WorldUpdate.FeatureChange)
                    _this.findPath();
                if (reason === WorldUpdate.MarkChange)
                    _this.app.toggleClass("has-mark", _this.markNode != null);
            });
        }
        World.prototype.loadTransport = function (data, type) {
            var _this = this;
            var array = data[type];
            var feat = this.features.byName[type];
            var typeName = feat.location || feat.name;
            var nodes = array.map(function (n) { return new Node(n.name, typeName + ", " + n.name, n.x, n.y, type, true); });
            this.nodes = this.nodes.concat(nodes);
            var cost = World.transportCost;
            array.forEach(function (n, i1) {
                var n1 = nodes[i1];
                if (n.edges) {
                    n.edges.forEach(function (i2) {
                        var n2 = nodes[i2];
                        var edge = new Edge(n1, n2, cost);
                        n1.edges.push(edge);
                        n2.edges.push(edge);
                        _this.edges.push(edge);
                    });
                }
                if (n.oneWayEdges) {
                    n.oneWayEdges.forEach(function (i2) {
                        var edge = new Edge(n1, nodes[i2], cost);
                        n1.edges.push(edge);
                        _this.edges.push(edge);
                    });
                }
                if (n.cells) {
                    _this.areas.push(_this.makeArea(n1, n));
                }
            });
        };
        World.prototype.makeArea = function (node, data) {
            var y = data.top || 0;
            var rows = data.cells.map(function (c) { return new CellRow(y++, c[0], c[1]); });
            return new Area(node, rows);
        };
        World.prototype.addListener = function (listener) {
            this.listeners.push(listener);
        };
        World.prototype.trigger = function (reason) {
            this.listeners.forEach(function (fn) { return fn(reason); });
        };
        World.prototype.findNodeById = function (id) {
            return this.nodesById[id] || null;
        };
        World.prototype.findPath = function () {
            var _this = this;
            if (this.sourceNode == null || this.destNode == null || this.sourceNode === this.destNode) {
                this.pathEnd = null;
                this.trigger(WorldUpdate.PathUpdate);
                return;
            }
            // create nodes
            var nodeMap = {};
            var feats = this.features.byName;
            var nodes = this.nodes
                .filter(function (n) { return !feats[n.type].disabled && n !== _this.sourceNode && n !== _this.destNode; })
                .map(function (n) { return nodeMap[n.id] = new PathNode(n); });
            var source = new PathNode(this.sourceNode);
            source.dist = 0;
            nodes.push(source);
            nodeMap[this.sourceNode.id] = source;
            var dest = new PathNode(this.destNode);
            nodes.push(dest);
            nodeMap[this.destNode.id] = dest;
            var maxCost = this.sourceNode.pos.distance(this.destNode.pos);
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
            if (this.markNode != null && !feats['mark'].disabled) {
                var mn = new PathNode(this.markNode);
                mn.edges = nodes.filter(function (n) { return n !== source; })
                    .map(function (n) { return new PathEdge(n, mn.node.pos.distance(n.node.pos), "walk"); })
                    .filter(function (e) { return e.cost < maxCost; });
                source.edges.push(new PathEdge(mn, World.spellCost, "mark"));
                nodes.push(mn);
            }
            // intervention
            nodes.forEach(function (n) {
                var cell = Cell.fromPosition(n.node.pos);
                _this.areas.forEach(function (a) {
                    if (!feats[a.target.type].disabled) {
                        if (a.containsCell(cell)) {
                            // node inside area, teleport to temple/shrine
                            n.edges.push(new PathEdge(nodeMap[a.target.id], World.spellCost, a.target.type));
                        }
                        else {
                            // node outside area, walk to edge
                            var dist = Infinity;
                            var closest;
                            a.rows.forEach(function (r) {
                                // v is closest point (in cell units) from node to row
                                var v = new Vec2(Math.max(Math.min(cell.x, r.x1 + r.width), r.x1), Math.max(Math.min(cell.y, r.y + 1), r.y));
                                var alt = cell.distance(v);
                                if (alt < dist) {
                                    dist = alt;
                                    closest = v;
                                }
                            });
                            var pos = Vec2.fromCell(closest.x, closest.y);
                            var cost = n.node.pos.distance(pos);
                            if (cost < maxCost) {
                                // new node to allow us to teleport once we're in the area
                                var feat = _this.features.byName[a.target.type];
                                var name = feat.name + " range of " + a.target.name;
                                var an = new PathNode(new Node(name, name, pos.x, pos.y, "area"));
                                an.edges = [new PathEdge(nodeMap[a.target.id], World.spellCost, a.target.type)];
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
            this.pathEnd = dest;
            this.trigger(WorldUpdate.PathUpdate);
        };
        World.prototype.getRegionName = function (x, y) {
            var area;
            var cell = Cell.fromPosition(new Vec2(x, y));
            return this.regions.some(function (r) { return r.containsCell(cell) && (area = r) != null; })
                ? area.target.name
                : null;
        };
        World.prototype.getLandmarkName = function (x, y) {
            var area;
            var cell = Cell.fromPosition(new Vec2(x, y));
            return this.landmarks.some(function (r) { return r.containsCell(cell) && (area = r) != null; })
                ? area.target.name
                : null;
        };
        World.prototype.setContextLocation = function (context, x, y) {
            var areaName = this.getLandmarkName(x, y) || this.getRegionName(x, y);
            if (context === 'source') {
                var name = areaName || "You";
                this.setContextNode(context, new Node(name, name, x, y, "source"));
            }
            else if (context === 'destination') {
                var name = areaName || "Your destination";
                this.setContextNode(context, new Node(name, name, x, y, "destination"));
            }
            else if (context === 'mark') {
                var name = areaName ? "Mark in " + areaName : "Mark";
                this.markNode = new Node(name, name, x, y, "mark");
                this.trigger(WorldUpdate.MarkChange);
            }
        };
        World.prototype.setContextNode = function (context, node) {
            if (context === 'source') {
                this.sourceNode = node;
                this.trigger(WorldUpdate.SourceChange);
            }
            else if (context === 'destination') {
                this.destNode = node;
                this.trigger(WorldUpdate.DestinationChange);
            }
            else if (context === 'mark') {
                var pos = node.pos;
                this.markNode = new Node(node.name, node.longName, pos.x, pos.y, "mark");
                this.markNode.referenceId = node.referenceId || node.id;
                this.trigger(WorldUpdate.MarkChange);
            }
        };
        World.prototype.clearContext = function (context) {
            if (context === 'source') {
                this.sourceNode = null;
                this.trigger(WorldUpdate.SourceChange);
            }
            else if (context === 'destination') {
                this.destNode = null;
                this.trigger(WorldUpdate.DestinationChange);
            }
            else if (context === 'mark') {
                this.markNode = null;
                this.trigger(WorldUpdate.MarkChange);
            }
        };
        World.transportCost = 10;
        World.spellCost = 5;
        return World;
    })();
    tesp.World = World;
})(tesp || (tesp = {}));
//# sourceMappingURL=all.js.map