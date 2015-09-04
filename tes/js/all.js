var Tesp;!function(Tesp){!function(ChangeReason){ChangeReason[ChangeReason.None=0]="None",ChangeReason[ChangeReason.SourceChange=1]="SourceChange",ChangeReason[ChangeReason.DestinationChange=2]="DestinationChange",ChangeReason[ChangeReason.MarkChange=4]="MarkChange",ChangeReason[ChangeReason.ContextChange=7]="ContextChange",ChangeReason[ChangeReason.FeatureChange=8]="FeatureChange",ChangeReason[ChangeReason.PathUpdate=16]="PathUpdate",ChangeReason[ChangeReason.ClearMenus=32]="ClearMenus",ChangeReason[ChangeReason.Any=63]="Any"}(Tesp.ChangeReason||(Tesp.ChangeReason={}));var ChangeReason=Tesp.ChangeReason,ChangeListener=function(){function ChangeListener(reasons,func){this.reasons=reasons,this.func=func}return ChangeListener.prototype.trigger=function(reason){0!==(this.reasons&reason)&&this.func(reason)},ChangeListener}();Tesp.ChangeListener=ChangeListener;var Application=function(){function Application(){var _this=this;this.listeners=[],this.element=document.body,this.loaded=window.fetch("data/data.json").then(function(res){return res.json()}).then(function(data){return _this.context=new Tesp.Context(_this),_this.features=Tesp.Features.init(),_this.world=new Tesp.World(_this,data),_this.map=new Tesp.Map(_this,document.getElementById("map")),_this.controls=new Tesp.Controls(_this,document.getElementById("controls")),_this.ctxMenu=new Tesp.ContextMenu(_this),document.body.onmousedown=document.body.oncontextmenu=function(){return _this.triggerChange(ChangeReason.ClearMenus)},_this.toggleBodyClass("loading",!1),_this})}return Application.prototype.addChangeListener=function(reasons,func){var listener=new ChangeListener(reasons,func);return this.listeners.push(listener),listener},Application.prototype.removeChangeListener=function(listener){var ix=this.listeners.indexOf(listener);ix>-1&&this.listeners.splice(ix,1)},Application.prototype.triggerChange=function(reason){this.listeners.forEach(function(l){return l.trigger(reason)})},Application.prototype.toggleBodyClass=function(name,enabled){enabled?document.body.classList.add(name):document.body.classList.remove(name)},Application}();Tesp.Application=Application,Tesp.app=new Application}(Tesp||(Tesp={}));var Tesp;!function(Tesp){var Vec2=function(){function Vec2(x,y){this.x=x,this.y=y}return Vec2.prototype.distance=function(other){return Math.sqrt((other.x-this.x)*(other.x-this.x)+(other.y-this.y)*(other.y-this.y))},Vec2.fromCell=function(x,y){return new Vec2(x*Cell.width+Cell.widthOffset,y*Cell.height+Cell.heightOffset)},Vec2}();Tesp.Vec2=Vec2;var Node=function(){function Node(name,longName,pos,type,permanent){void 0===permanent&&(permanent=!1),this.name=name,this.longName=longName,this.pos=pos,this.type=type,this.permanent=permanent,this.id=Node.identity++,this.edges=[]}return Node.identity=1,Node}();Tesp.Node=Node;var Edge=function(){function Edge(srcNode,destNode,cost){this.srcNode=srcNode,this.destNode=destNode,this.cost=cost}return Edge}();Tesp.Edge=Edge;var Cell=function(){function Cell(){}return Cell.fromPosition=function(pos){return new Vec2((pos.x-Cell.widthOffset)/Cell.width,(pos.y-Cell.heightOffset)/Cell.height)},Cell.width=44.5,Cell.height=44.6,Cell.widthOffset=20,Cell.heightOffset=35,Cell}();Tesp.Cell=Cell;var CellRow=function(){function CellRow(y,x1,x2){this.y=y,this.x1=x1,this.x2=x2,this.width=x2-x1+1}return CellRow}();Tesp.CellRow=CellRow;var Area=function(){function Area(target,rows){this.target=target,this.rows=rows,this.minY=rows[0].y,this.maxY=rows[rows.length-1].y}return Area.prototype.containsCell=function(pos){if(pos.y>=this.minY&&pos.y<this.maxY+1){var row=this.rows[Math.floor(pos.y)-this.minY];return pos.x>=row.x1&&pos.x<row.x2+1}return!1},Area}();Tesp.Area=Area}(Tesp||(Tesp={}));var Tesp;!function(Tesp){var Context=function(){function Context(app){var _this=this;this.app=app,this.app.addChangeListener(Tesp.ChangeReason.ContextChange|Tesp.ChangeReason.MarkChange,function(reason){_this.findPath(),reason===Tesp.ChangeReason.MarkChange&&_this.app.toggleBodyClass("has-mark",null!=_this.markNode)})}return Context.prototype.setContextLocation=function(context,pos){var name=this.app.world.getLandmarkName(pos)||this.app.world.getRegionName(pos);"source"===context?(name=name||"You",this.setContextNode(context,new Tesp.Node(name,name,pos,"source"))):"destination"===context?(name=name||"Your destination",this.setContextNode(context,new Tesp.Node(name,name,pos,"destination"))):"mark"===context&&(this.markNode=new Tesp.Node(name,name,pos,"mark"),this.app.triggerChange(Tesp.ChangeReason.MarkChange))},Context.prototype.setContextNode=function(context,node){if("source"===context)this.sourceNode=node,this.app.triggerChange(Tesp.ChangeReason.SourceChange);else if("destination"===context)this.destNode=node,this.app.triggerChange(Tesp.ChangeReason.DestinationChange);else if("mark"===context){var pos=node.pos;this.markNode=new Tesp.Node(node.longName,node.longName,pos,"mark"),this.markNode.referenceId=node.referenceId||node.id,this.app.triggerChange(Tesp.ChangeReason.MarkChange)}},Context.prototype.clearContext=function(context){"source"===context?(this.sourceNode=null,this.app.triggerChange(Tesp.ChangeReason.SourceChange)):"destination"===context?(this.destNode=null,this.app.triggerChange(Tesp.ChangeReason.DestinationChange)):"mark"===context&&(this.markNode=null,this.app.triggerChange(Tesp.ChangeReason.MarkChange))},Context.prototype.findPath=function(){this.pathEnd=null!=this.sourceNode&&null!=this.destNode&&this.sourceNode!==this.destNode?Tesp.Path.findPath(this.app):null,this.app.triggerChange(Tesp.ChangeReason.PathUpdate)},Context}();Tesp.Context=Context}(Tesp||(Tesp={}));var Tesp;!function(Tesp){var ContextMenu=function(){function ContextMenu(app){var _this=this;this.app=app,this.menu=new Tesp.Menu(app,!1),this.links=[Tesp.MenuItem.separator,new Tesp.MenuItem("Navigate from here",function(){return _this.setContext("source")}),new Tesp.MenuItem("Navigate to here",function(){return _this.setContext("destination")}),new Tesp.MenuItem("Set Mark here",function(){return _this.setContext("mark")})],this.unmarkLink=new Tesp.MenuItem("Remove mark",function(){return _this.app.context.clearContext("mark")})}return ContextMenu.prototype.setContext=function(context){null!=this.node?this.app.context.setContextNode(context,this.node):this.app.context.setContextLocation(context,this.pos)},ContextMenu.prototype.openNode=function(node){this.open(node.pos,node)},ContextMenu.prototype.open=function(pos,node){null==node||node.permanent||(null==node.referenceId?node=null:(node=this.app.world.findNodeById(node.referenceId),null==node||node.permanent||(node=null)));var lines=[],landmark=this.app.world.getLandmarkName(pos);if(null!=node){var feat=this.app.features.byName[node.type];null!=feat?(lines.push(feat.location||feat.name),lines.push(node.name)):lines.push(node.longName),null!=landmark&&landmark!==node.name&&lines.push(landmark),pos=node.pos}else null!=landmark&&lines.push(landmark);var region=this.app.world.getRegionName(pos);null!=region&&lines.push(region+" Region"),this.pos=pos,this.node=node;var items=lines.map(function(l){return new Tesp.MenuItem(l)}).concat(this.links);null!=this.app.context.markNode&&items.push(this.unmarkLink),this.menu.setData(items),this.menu.open();var menuStyle=this.menu.getStyle();menuStyle.left=pos.x+"px",menuStyle.top=pos.y+"px";var scrollX=pageXOffset,scrollY=pageYOffset,rect=this.menu.element.getBoundingClientRect();rect.left<10?scrollX=pageXOffset+rect.left-10:rect.right>innerWidth-27&&(scrollX=pageXOffset+rect.right-innerWidth+27),rect.top<50?scrollY=pageYOffset+rect.top-50:rect.bottom>innerHeight-27&&(scrollY=pageYOffset+rect.bottom-innerHeight+27),(scrollX!==pageXOffset||scrollY!==pageYOffset)&&scroll(scrollX,scrollY)},ContextMenu.prototype.hide=function(){this.menu.hide()},ContextMenu}();Tesp.ContextMenu=ContextMenu}(Tesp||(Tesp={}));var Tesp;!function(Tesp){var Controls=function(){function Controls(app,element){var _this=this;this.app=app,this.element=element,this.app.addChangeListener(Tesp.ChangeReason.SourceChange,function(){return _this.updateNodeInfo(".control-source-info",_this.app.context.sourceNode)}),this.app.addChangeListener(Tesp.ChangeReason.DestinationChange,function(){return _this.updateNodeInfo(".control-destination-info",_this.app.context.destNode)}),this.app.addChangeListener(Tesp.ChangeReason.MarkChange,function(){return _this.updateNodeInfo(".control-mark-info",_this.app.context.markNode)}),this.app.addChangeListener(Tesp.ChangeReason.PathUpdate,function(){return _this.updatePath()}),this.pathContainer=element.querySelector(".path-container"),this.featuresContainer=element.querySelector(".features-container"),this.searchInput=element.querySelector(".search-input");var featuresVisible=!1;element.querySelector(".settings-icon").onclick=function(){return _this.featuresContainer.style.display=(featuresVisible=!featuresVisible)?"block":"none"},this.initSearch()}return Controls.prototype.initSearch=function(){function prepTerm(text){return null!=text?text.toLowerCase().replace(/[^a-z]+/g," "):null}var _this=this,searchContainer=this.element.querySelector(".search-container");this.searchMenu=new Tesp.Menu(Tesp.app,!0);var menuStyle=this.searchMenu.getStyle(),input=this.searchInput.getBoundingClientRect();menuStyle.minWidth="200px",menuStyle.top=input.top+input.height+"px",menuStyle.right=searchContainer.clientWidth-input.right+"px";var searchNodes=this.app.world.nodes.concat(this.app.world.landmarks.map(function(a){return a.target})).map(function(n){var feat=_this.app.features.byName[n.type],featName=null!=feat?feat.location||feat.name:null,terms=[n.name];null!=featName&&terms.push(featName);var landmark=_this.app.world.getLandmarkName(n.pos);return landmark&&landmark!==n.name&&terms.push(landmark),{terms:terms,searchTerms:terms.map(function(t){return prepTerm(t)}),node:n}}).sort(function(a,b){for(var at=a.searchTerms,bt=b.searchTerms,ml=Math.max(at.length,bt.length),i=0;ml>i;i++){var d=(at[i]||"").localeCompare(bt[i]||"");if(0!==d)return d}return 0});this.drawFeatures(),this.searchInput.oninput=function(){for(var search=_this.searchInput.value.toLowerCase(),starts=[],terms=[],alpha=!1,i=0;i<search.length;i++){var c=search.charCodeAt(i);c>96&&123>c?alpha||(starts.push(i),alpha=!0):alpha&&(terms=terms.concat(starts.map(function(s){return search.substring(s,i)})),alpha=!1)}alpha&&(terms=terms.concat(starts.map(function(s){return search.substring(s)})));var results=searchNodes.filter(function(n){var c=0;return terms.some(function(t){return n.searchTerms.some(function(st){return 0===st.indexOf(t)})&&c++,c>=starts.length})});_this.searchMenu.setData(results.map(function(n){return new Tesp.MenuItem(n.terms.join(", "),function(){_this.app.ctxMenu.openNode(n.node),_this.clearSearch()})})),_this.searchMenu.open()},this.app.addChangeListener(Tesp.ChangeReason.ClearMenus,function(){document.activeElement!==_this.searchInput&&_this.clearSearch()})},Controls.prototype.clearSearch=function(){this.searchInput.value="",this.searchMenu.hide()},Controls.prototype.updateNodeInfo=function(selector,node){var _this=this,el=this.element.querySelector(selector);null!=node?(el.textContent=node.longName,el.onclick=function(){return _this.app.ctxMenu.openNode(node)}):(el.textContent="",el.onclick=null)},Controls.prototype.updatePath=function(){for(var child;child=this.pathContainer.firstElementChild;)this.pathContainer.removeChild(child);var pathNode=this.app.context.pathEnd;for(this.pathContainer.style.display=pathNode?"block":"none";pathNode;)this.pathContainer.insertBefore(this.drawPathNode(pathNode),this.pathContainer.firstElementChild),pathNode=pathNode.prev},Controls.prototype.drawPathNode=function(pathNode){var icon,text,linkText,_this=this,el=document.createElement("div"),node=pathNode.node,edge=pathNode.prevEdge;if(edge){var action;if("walk"===edge.type)action="Walk",icon="compass";else{var feat=this.app.features.byName[edge.type];feat?(action=feat.verb||feat.name,icon=feat.icon):(action=edge.type,icon="question")}text=" "+action+" to ",linkText=node.type===edge.type?node.name:node.longName}else icon="map-marker",text=" ",linkText=node.longName;var i=document.createElement("i");i.classList.add("path-icon"),i.classList.add("fa"),i.classList.add("fa-"+icon),el.appendChild(i),el.appendChild(document.createTextNode(text));var a=document.createElement("a");return a.textContent=linkText,a.onclick=function(){return _this.app.ctxMenu.openNode(node)},el.appendChild(a),el},Controls.prototype.drawFeatures=function(){var _this=this;this.app.features.forEach(function(f){var el=document.createElement("div");el.textContent=f.name+":",el.appendChild(_this.drawCheckbox(function(val){f.hidden=!val,_this.app.triggerChange(Tesp.ChangeReason.FeatureChange)},!f.hidden)),f.visualOnly||el.appendChild(_this.drawCheckbox(function(val){f.disabled=!val,_this.app.triggerChange(Tesp.ChangeReason.FeatureChange)},!f.disabled)),_this.featuresContainer.appendChild(el)})},Controls.prototype.drawCheckbox=function(onchange,initial){var input=document.createElement("input");return input.type="checkbox",input.onchange=function(){return onchange(input.checked)},input.checked=initial,input},Controls}();Tesp.Controls=Controls}(Tesp||(Tesp={}));var Tesp;!function(Tesp){var Feature=function(){function Feature(){}return Feature}();Tesp.Feature=Feature;var Features=function(){function Features(){}return Features.init=function(){var features=[{name:"Mark/Recall",verb:"Recall",type:"mark",icon:"bolt"},{name:"Mages Guild",verb:"Guild Guide",type:"mages-guild",icon:"eye"},{name:"Silt Strider",verb:"Silt Strider",type:"silt-strider",icon:"bug"},{name:"Boat",location:"Docks",type:"boat",icon:"ship"},{name:"Holamayan Boat",location:"Docks",verb:"Boat",type:"holamayan",icon:"ship"},{name:"Propylon Chamber",type:"propylon",icon:"cog"},{name:"Gondola",type:"gondola",icon:"ship"},{name:"Divine Intervention",location:"Imperial Cult Shrine",type:"divine",icon:"bolt"},{name:"Almsivi Intervention",location:"Tribunal Temple",type:"almsivi",icon:"bolt"},{name:"Transport lines",type:"transport-edge",visualOnly:!0},{name:"Locations",type:"node",visualOnly:!0},{name:"Intervention area border",type:"area",visualOnly:!0},{name:"Gridlines",type:"grid",visualOnly:!0}];features.byName={};var fIdx=features.byName;return features.forEach(function(f){return fIdx[f.type]=f}),fIdx["transport-edge"].hidden=fIdx.area.hidden=fIdx.grid.hidden=!0,features},Features}();Tesp.Features=Features}(Tesp||(Tesp={}));var Tesp;!function(Tesp){var Map=function(){function Map(app,element){var _this=this;this.app=app,this.element=element,this.app.addChangeListener(Tesp.ChangeReason.SourceChange,function(){return _this.renderSource()}),this.app.addChangeListener(Tesp.ChangeReason.DestinationChange,function(){return _this.renderDestination()}),this.app.addChangeListener(Tesp.ChangeReason.MarkChange,function(){return _this.renderMark()}),this.app.addChangeListener(Tesp.ChangeReason.PathUpdate,function(){return _this.renderPath()}),this.app.addChangeListener(Tesp.ChangeReason.FeatureChange,function(){return _this.updateFeatures()}),element.onclick=function(ev){var node=_this.getEventNode(ev);null!=node&&_this.triggerContextMenu(ev,node)},element.oncontextmenu=function(ev){ev.shiftKey||(ev.preventDefault(),ev.stopPropagation(),_this.triggerContextMenu(ev))},this.renderNodes(),this.renderPath(),this.renderMark(),this.renderGrid(),this.updateFeatures(),this.initDragScroll()}return Map.prototype.getEventNode=function(event){var target=event.target;if(target.classList.contains("map-node")){var id=target.dataset.nodeId;if(void 0!==id)return this.app.world.findNodeById(+id)}return null},Map.prototype.triggerContextMenu=function(ev,node){this.app.ctxMenu.open(new Tesp.Vec2(ev.pageX,ev.pageY),node||this.getEventNode(ev))},Map.prototype.initDragScroll=function(){var prevX,prevY,_this=this,img=this.element.querySelector("img"),mousedown=!1,stop=function(ev){mousedown=!1,_this.app.toggleBodyClass("scrolling",!1),ev.preventDefault()},start=function(ev){mousedown=!0,prevX=ev.clientX,prevY=ev.clientY,_this.app.toggleBodyClass("scrolling",!0),ev.preventDefault()};img.onmousedown=function(ev){0===ev.button&&ev.target===img&&start(ev)},img.onmouseup=function(ev){mousedown&&stop(ev)},img.onmousemove=function(ev){mousedown||1!==ev.which||start(ev),mousedown&&(1!==ev.which?stop(ev):(scroll(pageXOffset+prevX-ev.clientX,pageYOffset+prevY-ev.clientY),prevX=ev.clientX,prevY=ev.clientY,ev.preventDefault()))}},Map.prototype.renderNodes=function(){var _this=this;null!=this.nodeContainer&&this.nodeContainer.parentElement.removeChild(this.nodeContainer),this.nodeContainer=document.createElement("div"),this.element.appendChild(this.nodeContainer),this.app.world.nodes.forEach(function(n){return _this.nodeContainer.appendChild(_this.drawNode(n))}),null!=this.edgeContainer&&this.edgeContainer.parentElement.removeChild(this.edgeContainer),this.edgeContainer=document.createElement("div"),this.element.appendChild(this.edgeContainer),this.app.world.edges.forEach(function(e){return _this.edgeContainer.appendChild(_this.drawEdge(e.srcNode.pos,e.destNode.pos,e.srcNode.type,"map-transport-edge"))}),null!=this.areaContainer&&this.areaContainer.parentElement.removeChild(this.areaContainer),this.areaContainer=document.createElement("div"),this.element.appendChild(this.areaContainer),this.app.world.areas.forEach(function(a){for(var type=a.target.type,prev=null,i=0;i<a.rows.length;i++){var row=a.rows[i];null!=prev?(row.x1!==prev.x1&&_this.areaContainer.appendChild(_this.drawCellEdge(row.x1,row.y,prev.x1,row.y,type)),row.x2!==prev.x2&&_this.areaContainer.appendChild(_this.drawCellEdge(row.x2+1,row.y,prev.x2+1,row.y,type))):_this.areaContainer.appendChild(_this.drawCellEdge(row.x1,row.y,row.x2+1,row.y,type)),_this.areaContainer.appendChild(_this.drawCellEdge(row.x1,row.y,row.x1,row.y+1,type)),_this.areaContainer.appendChild(_this.drawCellEdge(row.x2+1,row.y,row.x2+1,row.y+1,type)),prev=row}null!=prev&&_this.areaContainer.appendChild(_this.drawCellEdge(prev.x1,prev.y+1,prev.x2+1,prev.y+1,type))})},Map.prototype.drawCellEdge=function(x1,y1,x2,y2,type){return this.drawEdge(Tesp.Vec2.fromCell(x1,y1),Tesp.Vec2.fromCell(x2,y2),type,"map-area")},Map.prototype.renderPath=function(){null!=this.pathContainer&&this.pathContainer.parentElement.removeChild(this.pathContainer);var pathNode=this.app.context.pathEnd;if(null==pathNode)return void(this.pathContainer=null);for(this.pathContainer=document.createElement("div"),this.element.appendChild(this.pathContainer);pathNode&&pathNode.prev;)this.pathContainer.appendChild(this.drawEdge(pathNode.node.pos,pathNode.prev.node.pos,"path","map-"+pathNode.prevEdge.type)),pathNode=pathNode.prev},Map.prototype.renderMark=function(){this.markElem=this.addOrUpdateNodeElem(this.app.context.markNode,this.markElem)},Map.prototype.renderSource=function(){this.sourceElem=this.addOrUpdateNodeElem(this.app.context.sourceNode,this.sourceElem)},Map.prototype.renderDestination=function(){this.destElem=this.addOrUpdateNodeElem(this.app.context.destNode,this.destElem)},Map.prototype.addOrUpdateNodeElem=function(node,elem){return elem&&elem.parentElement.removeChild(elem),null!=node?this.element.appendChild(this.drawNode(node)):null},Map.prototype.renderGrid=function(){if(!this.gridContainer){this.gridContainer=document.createElement("div"),this.element.appendChild(this.gridContainer);var i,el;for(i=0;37>i;i++)el=document.createElement("div"),el.classList.add("map-grid"),el.classList.add("map-grid-v"),el.style.left=i*Tesp.Cell.width+Tesp.Cell.widthOffset+"px",this.gridContainer.appendChild(el);for(i=0;42>i;i++)el=document.createElement("div"),el.classList.add("map-grid"),el.classList.add("map-grid-h"),el.style.top=i*Tesp.Cell.height+Tesp.Cell.heightOffset+"px",this.gridContainer.appendChild(el)}},Map.prototype.updateFeatures=function(){var _this=this;this.element.className="",this.app.features.forEach(function(f){f.hidden&&_this.element.classList.add("hide-"+f.type)})},Map.prototype.drawNode=function(node){var element=document.createElement("div");return element.classList.add("map-node"),element.classList.add("map-"+node.type),element.style.left=node.pos.x+"px",element.style.top=node.pos.y+"px",element.dataset.nodeId=(node.referenceId||node.id)+"",element},Map.prototype.drawEdge=function(n1,n2,type,subtype){var element=document.createElement("div");element.classList.add("map-edge"),element.classList.add("map-"+type),subtype&&element.classList.add(subtype);var length=n1.distance(n2);return element.style.left=(n1.x+n2.x)/2-length/2+"px",element.style.top=(n1.y+n2.y)/2-1+"px",element.style.width=length+"px",element.style.transform="rotate("+Math.atan2(n1.y-n2.y,n1.x-n2.x)+"rad)",element},Map}();Tesp.Map=Map}(Tesp||(Tesp={}));var Tesp;!function(Tesp){var MenuItem=function(){function MenuItem(label,func){this.label=label,this.func=func}return MenuItem.separator=new MenuItem(""),MenuItem}();Tesp.MenuItem=MenuItem;var Menu=function(){function Menu(app,fixed){var _this=this;this.app=app,this.disposed=!1,this.listener=this.app.addChangeListener(Tesp.ChangeReason.ClearMenus,function(){return _this.hide()}),this.element=document.createElement("ul"),this.element.className="menu",fixed&&this.element.classList.add("fixed"),this.element.onmousedown=function(ev){return ev.stopPropagation()},this.app.element.appendChild(this.element)}return Menu.prototype.dispose=function(){this.disposed||(this.app.removeChangeListener(this.listener),this.element.parentElement.removeChild(this.element),this.disposed=!0)},Menu.prototype.getStyle=function(){return this.disposed?null:this.element.style},Menu.prototype.setData=function(items){var _this=this;if(!this.disposed){this.hide();for(var child;null!=(child=this.element.firstElementChild);)this.element.removeChild(child);items.forEach(function(item){var li=document.createElement("li");_this.element.appendChild(li),item===MenuItem.separator?li.className="separator":(li.textContent=item.label,null!=item.func&&(li.className="link",li.onmousedown=function(ev){ev.stopPropagation(),item.func(),_this.hide()}))})}},Menu.prototype.open=function(){this.disposed||(this.app.triggerChange(Tesp.ChangeReason.ClearMenus),null!=this.element.firstElementChild&&(this.element.style.display="inherit"))},Menu.prototype.hide=function(){this.disposed||(this.element.style.display="none")},Menu}();Tesp.Menu=Menu}(Tesp||(Tesp={}));var Tesp;!function(Tesp){var PathEdge=function(){function PathEdge(target,cost,type){this.target=target,this.cost=cost,this.type=type}return PathEdge}();Tesp.PathEdge=PathEdge;var PathNode=function(){function PathNode(node){this.node=node,this.dist=1/0}return PathNode}();Tesp.PathNode=PathNode;var Path=function(){function Path(){}return Path.findPath=function(app){var world=app.world,context=app.context,nodeMap={},feats=app.features.byName,nodes=world.nodes.filter(function(n){return!feats[n.type].disabled&&n!==context.sourceNode&&n!==context.destNode}).map(function(n){return nodeMap[n.id]=new PathNode(n)}),source=new PathNode(context.sourceNode);source.dist=0,nodes.push(source),nodeMap[context.sourceNode.id]=source;var dest=new PathNode(context.destNode);nodes.push(dest),nodeMap[context.destNode.id]=dest;var maxCost=context.sourceNode.pos.distance(context.destNode.pos);if(nodes.forEach(function(n){return n.edges=n.node.edges.filter(function(e){return!feats[e.srcNode.type].disabled}).map(function(e){return new PathEdge(nodeMap[(e.srcNode===n.node?e.destNode:e.srcNode).id],e.cost,n.node.type)})}),nodes.forEach(function(n){return n.edges=n.edges.concat(nodes.filter(function(n2){return n2!==n&&!n.edges.some(function(e){return e.target===n2})}).map(function(n2){return new PathEdge(n2,n.node.pos.distance(n2.node.pos),"walk")}).filter(function(e){return e.cost<=maxCost}))}),null!=context.markNode&&!feats.mark.disabled){var mn=new PathNode(context.markNode);mn.edges=nodes.filter(function(n){return n!==source}).map(function(n){return new PathEdge(n,mn.node.pos.distance(n.node.pos),"walk")}).filter(function(e){return e.cost<maxCost}),source.edges.push(new PathEdge(mn,Path.spellCost,"mark")),nodes.push(mn)}nodes.forEach(function(n){var cell=Tesp.Cell.fromPosition(n.node.pos);world.areas.forEach(function(a){if(!feats[a.target.type].disabled)if(a.containsCell(cell))n.edges.push(new PathEdge(nodeMap[a.target.id],Path.spellCost,a.target.type));else{var closest,dist=1/0;a.rows.forEach(function(r){var v=new Tesp.Vec2(Math.max(Math.min(cell.x,r.x1+r.width),r.x1),Math.max(Math.min(cell.y,r.y+1),r.y)),alt=cell.distance(v);dist>alt&&(dist=alt,closest=v)});var pos=Tesp.Vec2.fromCell(closest.x,closest.y),cost=n.node.pos.distance(pos);if(maxCost>cost){var feat=app.features.byName[a.target.type],name=feat.name+" range of "+a.target.name,an=new PathNode(new Tesp.Node(name,name,pos,"area"));an.edges=[new PathEdge(nodeMap[a.target.id],Path.spellCost,a.target.type)],nodes.push(an),n.edges.push(new PathEdge(an,cost,"walk"))}}})});for(var q=nodes.slice();q.length>0;){q.sort(function(a,b){return b.dist-a.dist});for(var u=q.pop(),i=0;i<u.edges.length;i++){var e=u.edges[i],v=e.target,alt=u.dist+e.cost;alt<v.dist&&(v.dist=alt,v.prev=u,v.prevEdge=e)}}return dest},Path.spellCost=5,Path}();Tesp.Path=Path}(Tesp||(Tesp={}));var Tesp;!function(Tesp){var World=function(){function World(app,data){var _this=this;this.app=app,this.nodesById={},this.nodes=[],this.edges=[],this.areas=[],Object.getOwnPropertyNames(data.transport).forEach(function(k){return _this.loadTransport(data.transport,k)}),this.regions=data.regions.map(function(a){return World.makeArea(new Tesp.Node(a.name,a.name,new Tesp.Vec2(0,0),"region"),a)}),this.landmarks=data.landmarks.map(function(a){var node=new Tesp.Node(a.name,a.name,new Tesp.Vec2(0,0),"landmark"),area=World.makeArea(node,a),sumX=0,sumY=0,count=0;return area.rows.forEach(function(r){sumX+=(r.x1+r.width/2)*r.width,sumY+=(r.y+.5)*r.width,count+=r.width}),node.pos=Tesp.Vec2.fromCell(sumX/count,sumY/count),area}),this.nodesById={},this.nodes.forEach(function(n){return _this.nodesById[n.id]=n})}return World.prototype.loadTransport=function(data,type){var _this=this,array=data[type],feat=this.app.features.byName[type],typeName=feat.location||feat.name,nodes=array.map(function(n){return new Tesp.Node(n.name,typeName+", "+n.name,new Tesp.Vec2(n.x,n.y),type,!0)});this.nodes=this.nodes.concat(nodes);var cost=World.transportCost;array.forEach(function(n,i1){var n1=nodes[i1];n.edges&&n.edges.forEach(function(i2){var n2=nodes[i2],edge=new Tesp.Edge(n1,n2,cost);n1.edges.push(edge),n2.edges.push(edge),_this.edges.push(edge)}),n.oneWayEdges&&n.oneWayEdges.forEach(function(i2){var edge=new Tesp.Edge(n1,nodes[i2],cost);n1.edges.push(edge),_this.edges.push(edge)}),n.cells&&_this.areas.push(World.makeArea(n1,n))})},World.makeArea=function(node,data){var y=data.top||0,rows=data.cells.map(function(c){return new Tesp.CellRow(y++,c[0],c[1])});return new Tesp.Area(node,rows)},World.prototype.findNodeById=function(id){return this.nodesById[id]||null},World.prototype.getRegionName=function(pos){var area=World.getAreaByCell(this.regions,Tesp.Cell.fromPosition(pos));return null!=area?area.target.name:null},World.prototype.getLandmarkName=function(pos){var area=World.getAreaByCell(this.landmarks,Tesp.Cell.fromPosition(pos));return null!=area?area.target.name:null},World.getAreaByCell=function(source,cell){var area;return source.some(function(r){return r.containsCell(cell)&&null!=(area=r)})?area:null},World.transportCost=10,World}();Tesp.World=World}(Tesp||(Tesp={}));
//# sourceMappingURL=all.js.map