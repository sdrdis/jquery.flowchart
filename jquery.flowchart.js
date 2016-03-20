$(function() {
// the widget definition, where "custom" is the namespace,
// "colorize" the widget name
    $.widget( "flowchart.flowchart", {
        // default options
        options: {
            canUserEditLinks: true,
            canUserMoveOperators: true,
            data: {},
            distanceFromArrow: 3,
            defaultOperatorClass: 'flowchart-default-operator',
            defaultLinkColor: '#3366ff',
            defaultSelectedLinkColor: 'black',
            linkWidth: 11,
            grid: 20,
            multipleLinksOnOutput: false,
            multipleLinksOnInput: false,
            onOperatorSelect: function(operatorId) {
                return true;
            },
            onOperatorUnselect: function() {
                return true;
            },
            onLinkSelect: function(linkId) {
                return true;
            },
            onLinkUnselect: function() {
                return true;
            },
            onOperatorCreate: function(operatorId, operatorData, fullElement) {
                return true;
            },
            onLinkCreate: function(linkId, linkData) {
                return true;
            },
            onOperatorDelete: function(operatorId) {
                return true;
            },
            onLinkDelete: function(linkId, forced) {
                return true;
            }
        },
        data: {
            operators: {},
            links: {},
        },
        objs: {
            layers: {
                operators: null,
                temporaryLink: null,
                links: null
            },
            linksContext: null,
            temporaryLink: null
        },
        maskNum: 0,
        linkNum: 0,
        lastOutputConnectorClicked: null,
        selectedOperatorId: null,
        selectedLinkId: null,
        positionRatio: 1,
        

        // the constructor
        _create: function() {
            this.element.addClass('flowchart-container');
            
            this.objs.layers.links = $('<svg class="flowchart-links-layer"></svg>');
            this.objs.layers.links.appendTo(this.element);
            
            this.objs.layers.operators = $('<div class="flowchart-operators-layer unselectable"></div>');
            this.objs.layers.operators.appendTo(this.element);
            
            this.objs.layers.temporaryLink = $('<svg class="flowchart-temporary-link-layer"></svg>');
            this.objs.layers.temporaryLink.appendTo(this.element);
            
            var shape = document.createElementNS("http://www.w3.org/2000/svg", "line");
            shape.setAttribute("x1", "0");
            shape.setAttribute("y1", "0");
            shape.setAttribute("x2", "0");
            shape.setAttribute("y2", "0");
            shape.setAttribute("stroke-dasharray", "6,6");
            shape.setAttribute("stroke-width", "4");
            shape.setAttribute("stroke", "black");
            shape.setAttribute("fill", "none");
            this.objs.layers.temporaryLink[0].appendChild(shape);
            this.objs.temporaryLink = shape;
            
            this._initEvents();
            
            if (typeof this.options.data != 'undefined') {
                this.setData(this.options.data);
            }
        },
        
        _initEvents: function() {
            
            var self = this;
            
            this.element.mousemove(function(e) {
                var $this = $(this);
                var offset = $this.offset();
                self._mousemove((e.pageX - offset.left) / self.positionRatio, (e.pageY - offset.top) / self.positionRatio, e);
            });
            
            this.element.click(function(e) {
                var $this = $(this);
                var offset = $this.offset();
                self._click((e.pageX - offset.left) / self.positionRatio, (e.pageY - offset.top) / self.positionRatio, e);
            });
            
            
            
            this.objs.layers.operators.on('mousedown touchstart', '.flowchart-operator', function(e) {
                e.stopImmediatePropagation();
            });
            
            this.objs.layers.operators.on('click', '.flowchart-operator', function(e) {
                if ($(e.target).closest('.flowchart-operator-connector').length == 0) {
                    self.selectOperator($(this).data('operator_id'));
                }
            });
            
            this.objs.layers.operators.on('click', '.flowchart-operator-connector', function() {
                var $this = $(this);
                if (self.options.canUserEditLinks) {
                    self._connectorClicked($this.closest('.flowchart-operator').data('operator_id'), $this.data('connector'), $this.data('connector_type'));
                }
            });
            
            this.objs.layers.links.on('mousedown touchstart', '.flowchart-link', function(e) {
                e.stopImmediatePropagation();
            });
            
            this.objs.layers.links.on('mouseover', '.flowchart-link', function() {
                self._connecterMouseOver($(this).data('link_id'));
            });
            
            this.objs.layers.links.on('mouseout', '.flowchart-link', function() {
                self._connecterMouseOut($(this).data('link_id'));
            });
            
            this.objs.layers.links.on('click', '.flowchart-link', function() {
                self.selectLink($(this).data('link_id'));
            });
            
            
        },
        
        setData: function(data) {
            this._clearOperatorsLayer();
            this.data.operators = {};
            for (var operatorId in data.operators) {
                this.createOperator(operatorId, data.operators[operatorId]);
            }
            for (var linkId in data.links) {
                this.createLink(linkId, data.links[linkId]);
            }
            this.redrawLinksLayer();
        },
        
        addLink: function(linkData) {
            while(typeof this.data.links[this.linkNum] != 'undefined') {
                this.linkNum++;
            }
            
            this.createLink(this.linkNum, linkData);
            return this.linkNum;
        },
        
        createLink: function(linkId, linkDataOriginal) {
            var linkData = $.extend(true, {}, linkDataOriginal);
            if (!this.options.onLinkCreate(linkId, linkData)) {
                return;
            }
            
            var multipleLinksOnOutput = this.options.multipleLinksOnOutput;
            var multipleLinksOnInput = this.options.multipleLinksOnInput;
            if (!multipleLinksOnOutput || !multipleLinksOnInput) {
                for (var linkId2 in this.data.links) {
                    var currentLink = this.data.links[linkId2];
                    if (!multipleLinksOnOutput && currentLink.from_operator == linkData.from_operator && currentLink.from_connector == linkData.from_connector) {
                        this.deleteLink(linkId2);
                        continue;
                    }
                    if (!multipleLinksOnInput && currentLink.to_operator == linkData.to_operator && currentLink.to_connector == linkData.to_connector) {
                        this.deleteLink(linkId2);
                        continue;
                    }
                }
            }
            
            this.data.links[linkId] = linkData;
            this._drawLink(linkId);
        },
        
        redrawLinksLayer: function() {
            this._clearLinksLayer();
            for (var linkId in this.data.links) {
                this._drawLink(linkId);
            }
        },
        
        _clearLinksLayer: function() {
            this.objs.layers.links.empty();
            this.objs.layers.operators.find('.flowchart-operator-connector-small-arrow').css('border-left-color', 'transparent');
        },
        
        _clearOperatorsLayer: function() {
            this.objs.layers.operators.empty();
        },
        
        getConnectorPosition: function(operatorId, connectorId) {
            var operatorData = this.data.operators[operatorId];
            var $connector = operatorData.internal.els.connectorArrows[connectorId];
            
            var connectorOffset = $connector.offset();
            var elementOffset = this.element.offset();
            
            var x = (connectorOffset.left - elementOffset.left) / this.positionRatio;
            var width = parseInt($connector.css('border-top-width'));
            var y = (connectorOffset.top - elementOffset.top) / this.positionRatio + parseInt($connector.css('border-left-width'));
            
            return {x: x, width: width, y: y};
        },
        
        getLinkMainColor: function(linkId) {
            var color = this.options.defaultLinkColor;
            var linkData = this.data.links[linkId];
            if (typeof linkData.color != 'undefined') {
                color = linkData.color;
            }
            return color;
        },
        
        setLinkMainColor: function(linkId, color) {
            this.data.links[linkId].color = color;
        },
        
        _drawLink: function(linkId) {
            var linkData = this.data.links[linkId];
            
            if (typeof linkData.internal == 'undefined') {
                linkData.internal = {};
            }
            linkData.internal.els = {};
            
            var fromOperatorId = linkData.from_operator;
            var fromConnectorId = linkData.from_connector;
            var toOperatorId = linkData.to_operator;
            var toConnectorId = linkData.to_connector;
            
            var color = this.getLinkMainColor(linkId);
            
            var fromOperator = this.data.operators[fromOperatorId];
            var toOperator = this.data.operators[toOperatorId];
            
            var fromSmallConnector = fromOperator.internal.els.connectorSmallArrows[fromConnectorId];
            var toSmallConnector = toOperator.internal.els.connectorSmallArrows[toConnectorId];
            
            linkData.internal.els.fromSmallConnector = fromSmallConnector;
            linkData.internal.els.toSmallConnector = toSmallConnector;
            
            var overallGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.objs.layers.links[0].appendChild(overallGroup);
            linkData.internal.els.overallGroup = overallGroup;
            
            var mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
            var maskId = "fc_mask_" + this.maskNum;
            this.maskNum++;
            mask.setAttribute("id", maskId);
            
            overallGroup.appendChild(mask);
            
            var shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            shape.setAttribute("x", "0");
            shape.setAttribute("y", "0");
            shape.setAttribute("width", "100%");
            shape.setAttribute("height", "100%");
            shape.setAttribute("stroke", "none");
            shape.setAttribute("fill", "white");
            mask.appendChild(shape);
            
            var shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            shape.setAttribute("stroke", "none");
            shape.setAttribute("fill", "black");
            mask.appendChild(shape);
            linkData.internal.els.mask = shape;
            
            
            var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            group.setAttribute('class', 'flowchart-link');
            group.setAttribute('data-link_id', linkId);
            overallGroup.appendChild(group);
            
            
            var shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
            shape.setAttribute("stroke-width", this.options.linkWidth);
            shape.setAttribute("fill", "none");
            group.appendChild(shape);
            linkData.internal.els.path = shape;
            
            var shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            shape.setAttribute("stroke", "none");
            shape.setAttribute("mask", "url(#"+maskId+")");
            group.appendChild(shape);
            linkData.internal.els.rect = shape;
            
            
            this._refreshLinkPositions(linkId);
            this.uncolorizeLink(linkId);
        },
        
        _refreshLinkPositions: function(linkId) {
            var linkData = this.data.links[linkId];
            
            
            var fromPosition = this.getConnectorPosition(linkData.from_operator, linkData.from_connector);
            var toPosition = this.getConnectorPosition(linkData.to_operator, linkData.to_connector);
            
            var fromX = fromPosition.x;
            var offsetFromX = fromPosition.width;
            var fromY = fromPosition.y;
            
            var toX = toPosition.x;
            var toY = toPosition.y;
            
            var distanceFromArrow = this.options.distanceFromArrow;
            
            linkData.internal.els.mask.setAttribute("points", fromX+','+(fromY - offsetFromX - distanceFromArrow)+' '+(fromX + offsetFromX + distanceFromArrow)+','+fromY+' '+fromX+','+(fromY + offsetFromX + distanceFromArrow));
            
            var bezierFromX = (fromX+offsetFromX + distanceFromArrow);
            var bezierToX = toX+1;
            var bezierIntensity = Math.min(100,Math.max(Math.abs(bezierFromX-bezierToX)/2,Math.abs(fromY-toY)));
            
            
            linkData.internal.els.path.setAttribute("d", 'M'+bezierFromX+','+(fromY)+' C'+(fromX + offsetFromX + distanceFromArrow + bezierIntensity)+','+fromY+' '+(toX - bezierIntensity)+','+toY+' '+bezierToX+','+toY);
            
            linkData.internal.els.rect.setAttribute("x", fromX);
            linkData.internal.els.rect.setAttribute("y", fromY - this.options.linkWidth / 2);
            linkData.internal.els.rect.setAttribute("width", offsetFromX + distanceFromArrow+1);
            linkData.internal.els.rect.setAttribute("height", this.options.linkWidth);
        },
        
        getOperatorCompleteData: function(operatorData) {
            infos = $.extend(true, {}, operatorData.properties);
            
            for (var connectorId in infos.inputs) {
                if (infos.inputs[connectorId] == null) {
                    delete infos.inputs[connectorId];
                }
            }
            
            for (var connectorId in infos.outputs) {
                if (infos.outputs[connectorId] == null) {
                    delete infos.outputs[connectorId];
                }
            }
            
            if (typeof infos.class == 'undefined') {
                infos.class = this.options.defaultOperatorClass;
            }
            return infos;
        },
        
        _getOperatorFullElement: function(operatorData) {
            var infos = this.getOperatorCompleteData(operatorData);
            
            var $operator = $('<div class="flowchart-operator"></div>');
            $operator.addClass(infos.class);
            
            var $operator_title = $('<div class="flowchart-operator-title"></div>');
            $operator_title.text(infos.title);
            $operator_title.appendTo($operator);
            
            var $operator_inputs_outputs = $('<div class="flowchart-operator-inputs-outputs"></div>');
            
            
            $operator_inputs_outputs.appendTo($operator);
            
            var $operator_inputs = $('<div class="flowchart-operator-inputs"></div>');
            $operator_inputs.appendTo($operator_inputs_outputs);
            
            var $operator_outputs = $('<div class="flowchart-operator-outputs"></div>');
            $operator_outputs.appendTo($operator_inputs_outputs);
            
            var self = this;
            
            var connectorArrows = {};
            var connectorSmallArrows = {};
            function addConnector(connectorKey, connectorInfos, $operator_container, connectorType) {
                var $operator_connector = $('<div class="flowchart-operator-connector"></div>');
                $operator_connector.appendTo($operator_container);
                $operator_connector.data('connector', connectorKey);
                $operator_connector.data('connector_type', connectorType);
                
                var $operator_connector_label = $('<div class="flowchart-operator-connector-label"></div>');
                $operator_connector_label.text(connectorInfos.label);
                $operator_connector_label.appendTo($operator_connector);

                var $operator_connector_arrow = $('<div class="flowchart-operator-connector-arrow"></div>');
                
                $operator_connector_arrow.appendTo($operator_connector);
                
                var $operator_connector_small_arrow = $('<div class="flowchart-operator-connector-small-arrow"></div>');
                $operator_connector_small_arrow.appendTo($operator_connector);
                
                connectorArrows[connectorKey] = $operator_connector_arrow;
                connectorSmallArrows[connectorKey] = $operator_connector_small_arrow;
            }
            
            for (var key in infos.inputs) {
                addConnector(key, infos.inputs[key], $operator_inputs, 'inputs');
            }
            
            for (var key in infos.outputs) {
                addConnector(key, infos.outputs[key], $operator_outputs, 'outputs');
            }
            
            return {operator: $operator, title: $operator_title, connectorArrows: connectorArrows, connectorSmallArrows: connectorSmallArrows};
        },
        
        getOperatorElement: function(operatorData) {
            var fullElement = this._getOperatorFullElement(operatorData);
            return fullElement.operator;
        },
        
        createOperator: function(operatorId, operatorData) {
            var fullElement = this._getOperatorFullElement(operatorData);
            if (!this.options.onOperatorCreate(operatorId, operatorData, fullElement)) {
                return false;
            }
            
            var grid = this.options.grid;
            
            operatorData.top = Math.round(operatorData.top / grid) * grid;
            operatorData.left = Math.round(operatorData.left / grid) * grid;
            
            fullElement.operator.appendTo(this.objs.layers.operators);
            fullElement.operator.css({top: operatorData.top, left: operatorData.left});
            fullElement.operator.data('operator_id', operatorId);
            
            this.data.operators[operatorId] = operatorData;
            this.data.operators[operatorId].internal = {};
            this.data.operators[operatorId].internal.els = fullElement;
            
            if (operatorId == this.selectedOperatorId) {
                this._addSelectedClass(operatorId);
            }
            
            var operatorData = this.data.operators[operatorId] ;
            
            var self = this;
            
            function operatorChangedPosition(operator_id, pos) {
                operatorData.top = pos.top;
                operatorData.left = pos.left;
                
                for (var linkId in self.data.links) {
                    var linkData = self.data.links[linkId];
                    if (linkData.from_operator == operator_id || linkData.to_operator == operator_id) {
                        self._refreshLinkPositions(linkId);
                    }
                }
            }
            
            // Small fix has been added in order to manage eventual zoom
            // http://stackoverflow.com/questions/2930092/jquery-draggable-with-zoom-problem
            if (this.options.canUserMoveOperators) {
                var pointerX;
                var pointerY;
                fullElement.operator.draggable({
                    start: function(e, ui) {
                        if (self.lastOutputConnectorClicked != null) {
                            e.preventDefault();
                            return;
                        }
                        var elementOffset = self.element.offset();
                        pointerX = (e.pageX - elementOffset.left) / self.positionRatio - parseInt($(e.target).css('left'));
                        pointerY = (e.pageY - elementOffset.top) / self.positionRatio - parseInt($(e.target).css('top'));
                    },
                    drag: function(e, ui){
                        var grid = self.options.grid;
                        var elementOffset = self.element.offset();
                        ui.position.left = Math.round(((e.pageX - elementOffset.left) / self.positionRatio - pointerX) / grid) * grid;
                        ui.position.top = Math.round(((e.pageY - elementOffset.top) / self.positionRatio - pointerY) / grid) * grid;
                        ui.offset.left = Math.round(ui.position.left + elementOffset.left);
                        ui.offset.top = Math.round(ui.position.top + elementOffset.top);
                        fullElement.operator.css({left: ui.position.left, top: ui.position.top});
                        operatorChangedPosition($(this).data('operator_id'), ui.position);
                    },
                    stop: function(e, ui){
                        if (ui.position.top != ui.originalPosition.top || ui.position.left != ui.originalPosition.left) {
                            var d = new Date();
                            fullElement.operator.data('lastDragDropStopTime', d.getTime());
                        }
                        self._unsetTemporaryLink();
                        operatorChangedPosition($(this).data('operator_id'), ui.position);
                    },
                });
            }
        },
        
        _connectorClicked: function(operator, connector, connectorCategory) {
            if (connectorCategory == 'outputs') {
                var lastDragDropStopTime = this.data.operators[operator].internal.els.operator.data('lastDragDropStopTime');
                var d = new Date();
                var currentTime = d.getTime();
                if (typeof lastDragDropStopTime == 'undefined' || d > lastDragDropStopTime + 50) {
                    this.lastOutputConnectorClicked = {operator: operator, connector: connector};
                    this.objs.layers.temporaryLink.show();
                    var position = this.getConnectorPosition(operator, connector);
                    var x = position.x + position.width;
                    var y = position.y;
                    this.objs.temporaryLink.setAttribute('x1', x);
                    this.objs.temporaryLink.setAttribute('y1', y);
                    this._mousemove(x, y);
                }
            }
            if (connectorCategory == 'inputs' && this.lastOutputConnectorClicked != null) {
                var linkData = {
                    from_operator: this.lastOutputConnectorClicked.operator,
                    from_connector: this.lastOutputConnectorClicked.connector,
                    to_operator: operator,
                    to_connector: connector
                };
                
                this.addLink(linkData);
                this._unsetTemporaryLink();
            }
        },
        
        _unsetTemporaryLink: function () {
            this.lastOutputConnectorClicked = null;
            this.objs.layers.temporaryLink.hide();
        },
        
        _mousemove: function(x, y, e) {
            if (this.lastOutputConnectorClicked != null) {
                this.objs.temporaryLink.setAttribute('x2', x);
                this.objs.temporaryLink.setAttribute('y2', y);
            }
        },
        
        _click: function(x, y, e) {
            var $target = $(e.target);
            if ($target.closest('.flowchart-operator-connector').length == 0) {
                this._unsetTemporaryLink();
            }
            
            if ($target.closest('.flowchart-operator').length == 0) {
                this.unselectOperator();
            }
            
            if ($target.closest('.flowchart-link').length == 0) {
                this.unselectLink();
            }
        },
        
        _removeSelectedClassOperators: function() {
            this.objs.layers.operators.find('.flowchart-operator').removeClass('selected');
        },
        
        unselectOperator: function() {
            if (!this.options.onOperatorUnselect()) {
                return;
            }
            this._removeSelectedClassOperators();
            this.selectedOperatorId = null;
        },
        
        _addSelectedClass: function(operatorId) {
            this.data.operators[operatorId].internal.els.operator.addClass('selected');
        },
        
        selectOperator: function(operatorId) {
            if (!this.options.onOperatorSelect(operatorId)) {
                return;
            }
            this.unselectLink();
            this._removeSelectedClassOperators();
            this._addSelectedClass(operatorId);
            this.selectedOperatorId = operatorId;
        },
        
        getSelectedOperatorId: function() {
            return this.selectedOperatorId;
        },
        
        getSelectedLinkId: function() {
            return this.selectedLinkId;
        },
        
        // Found here : http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
        _shadeColor: function(color, percent) {   
            var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
            return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
        },
        
        colorizeLink: function(linkId, color) {
            var linkData = this.data.links[linkId];
            linkData.internal.els.path.setAttribute('stroke', color);
            linkData.internal.els.rect.setAttribute('fill', color);
            linkData.internal.els.fromSmallConnector.css('border-left-color', color);
            linkData.internal.els.toSmallConnector.css('border-left-color', color);
        },
        
        uncolorizeLink: function(linkId) {
            this.colorizeLink(linkId, this.getLinkMainColor(linkId));
        },
        
        _connecterMouseOver: function(linkId) {
            if (this.selectedLinkId != linkId) {
                this.colorizeLink(linkId, this._shadeColor(this.getLinkMainColor(linkId), -0.4));
            }
        },
        
        _connecterMouseOut: function(linkId) {
            if (this.selectedLinkId != linkId) {
                this.uncolorizeLink(linkId);
            }
        },
        
        unselectLink: function() {
            if (this.selectedLinkId != null) {
                if (!this.options.onLinkUnselect()) {
                    return;
                }
                this.uncolorizeLink(this.selectedLinkId, this.options.defaultSelectedLinkColor);
                this.selectedLinkId = null;
            }
        },
        
        selectLink: function(linkId) {
            this.unselectLink();
            if (!this.options.onLinkSelect(linkId)) {
                return;
            }
            this.unselectOperator();
            this.selectedLinkId = linkId;
            this.colorizeLink(linkId, this.options.defaultSelectedLinkColor);
        },
        
        deleteOperator: function(operatorId) {
            this._deleteOperator(operatorId, false);
        },
        
        _deleteOperator: function(operatorId, replace) {
            if (!this.options.onOperatorDelete(operatorId, replace)) {
                return false;
            }
            if (!replace) {
                for (var linkId in this.data.links) {
                    var currentLink = this.data.links[linkId];
                    if (currentLink.from_operator == operatorId || currentLink.to_operator == operatorId) {
                        this._deleteLink(linkId, true);
                    }
                }
            }
            if (!replace && operatorId == this.selectedOperatorId) {
                this.unselectOperator();
            }
            this.data.operators[operatorId].internal.els.operator.remove();
            delete this.data.operators[operatorId];
        },
        
        deleteLink: function(linkId) {
            this._deleteLink(linkId, false);
        },
        
        _deleteLink: function(linkId, forced) {
            if (!this.options.onLinkDelete(linkId, forced)) {
                if (!forced) {
                    return;
                }
            }
            if (this.selectedLinkId == linkId) {
                this.selectedLinkId = null;
            }
            this.colorizeLink(linkId, 'transparent');
            this.data.links[linkId].internal.els.overallGroup.remove();
            delete this.data.links[linkId];
        },
        
        deleteSelected: function() {
            if (this.selectedLinkId != null) {
                this.deleteLink(this.selectedLinkId);
            }
            if (this.selectedOperatorId != null) {
                this.deleteOperator(this.selectedOperatorId);
            }
        },
        
        setPositionRatio: function(positionRatio) {
            this.positionRatio = positionRatio;
        },
        
        getPositionRatio: function() {
            return this.positionRatio;
        },
        
        getData: function() {
            var keys = ['operators', 'links'];
            var data = $.extend(true, {}, this.data);
            for (var keyI in keys) {
                var key = keys[keyI];
                for (var objId in data[key]) {
                    delete data[key][objId].internal;
                }
            }
            return data;
        },
        
        setOperatorTitle: function(operatorId, title) {
            this.data.operators[operatorId].internal.els.title.text(title);
            if (typeof this.data.operators[operatorId].properties == 'undefined') {
                this.data.operators[operatorId].properties = {};
            }
            this.data.operators[operatorId].properties.title = title;
        },
        
        getOperatorTitle: function(operatorId) {
            return this.data.operators[operatorId].properties.title;
        },
        
        setOperatorData: function(operatorId, operatorData) {
            var infos = this.getOperatorCompleteData(operatorData);
            for (var linkId in this.data.links) {
                var linkData = this.data.links[linkId];
                console.log(linkData, linkData.from_operator == linkId, typeof infos.outputs[linkData.from_connector] == 'undefined');
                if ((linkData.from_operator == operatorId &&
                    typeof infos.outputs[linkData.from_connector] == 'undefined') ||
                    (linkData.to_operator == operatorId &&
                    typeof infos.inputs[linkData.to_connector] == 'undefined')) {
                        this._deleteLink(linkId, true);
                        continue;
                }
            }
            this._deleteOperator(operatorId, true);
            this.createOperator(operatorId, operatorData);
            this.redrawLinksLayer();
        },
        
        getOperatorData: function(operatorId) {
            var data = $.extend(true, {}, this.data.operators[operatorId]);
            delete data.internal;
            return data;
        }
    });
});