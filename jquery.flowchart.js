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
            linkWidth: 10,
            grid: 20,
            multipleLinksOnOutput: false,
            multipleLinksOnInput: false,
            linkVerticalDecal: 0,
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
            },
            onOperatorMoved: function(operatorId, position) {
              
            },
            onAfterChange: function(changeType) {
              
            }
        },
        data: null,
        objs: null,
        maskNum: 0,
        linkNum: 0,
        operatorNum: 0,
        lastOutputConnectorClicked: null,
        selectedOperatorId: null,
        selectedLinkId: null,
        positionRatio: 1,
        globalId: null,
        

        // the constructor
        _create: function() {
            if (typeof document.__flowchartNumber == 'undefined') {
              document.__flowchartNumber = 0;
            } else {
              document.__flowchartNumber++;
            }
            this.globalId = document.__flowchartNumber;
            this._unitVariables();  
          
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
      
        _unitVariables: function() {
            this.data = {
                operators: {},
                links: {},
            };
            this.objs = {
                layers: {
                    operators: null,
                    temporaryLink: null,
                    links: null
                },
                linksContext: null,
                temporaryLink: null
            };
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
                    self._connectorClicked($this.closest('.flowchart-operator').data('operator_id'), $this.data('connector'), $this.data('sub_connector'), $this.closest('.flowchart-operator-connector-set').data('connector_type'));
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
            this.data.operatorTypes = {};
            if (typeof data.operatorTypes != 'undefined') {
              this.data.operatorTypes = data.operatorTypes;
            }
            
            this.data.linkRestrictions = [];
            if(typeof data.linkRestrictions != 'undefined' && data.linkRestrictions.length>0) {
            	this.data.linkRestrictions = data.linkRestrictions;
            }
            
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
            
            var restrictionLinkIndex = this._indexOfLinkGranted(linkData);
            if(restrictionLinkIndex == -1) {
            	return;
            }
          
            var subConnectors = this._getSubConnectors(linkData);
            var fromSubConnector = subConnectors[0];
            var toSubConnector = subConnectors[1];
            
            var multipleLinksOnOutput = this.options.multipleLinksOnOutput;
            var multipleLinksOnInput = this.options.multipleLinksOnInput;
            if (!multipleLinksOnOutput || !multipleLinksOnInput) {
                for (var linkId2 in this.data.links) {
                    var currentLink = this.data.links[linkId2];
                  
                    var currentSubConnectors = this._getSubConnectors(currentLink);
                    var currentFromSubConnector = currentSubConnectors[0];
                    var currentToSubConnector = currentSubConnectors[1];
                    
                    if (!multipleLinksOnOutput && currentLink.fromOperator == linkData.fromOperator && currentLink.fromConnector == linkData.fromConnector && currentFromSubConnector == fromSubConnector) {
                        this.deleteLink(linkId2);
                        continue;
                    }
                    if (!multipleLinksOnInput && currentLink.toOperator == linkData.toOperator && currentLink.toConnector == linkData.toConnector && currentToSubConnector == toSubConnector) {
                        this.deleteLink(linkId2);
                        continue;
                    }
                }
            }
          
            this._autoCreateSubConnector(linkData.fromOperator, linkData.fromConnector, 'outputs', fromSubConnector);
            this._autoCreateSubConnector(linkData.toOperator, linkData.toConnector, 'inputs', toSubConnector);
            
            //try to colorize link with restriction link data
            if(restrictionLinkIndex!=null) {
            	var restriction = this.data.linkRestrictions[restrictionLinkIndex];
            	if(typeof restriction.color != 'undefined') {
            		linkData.color = restriction.color;
            	}
            }
            
            this.data.links[linkId] = linkData;
            this._drawLink(linkId);
            this.options.onAfterChange('link_create');
        },
        
        /** Search into this.data.linkRestrictions if the given link is granted
         * Return null if linkRestrictions is disabled (empty array)
         * Return -1 if the link is forbidden, and the index into the link restriction array otherwise
         */
        _indexOfLinkGranted: function(linkData) {
        	if(this.data.linkRestrictions.length == 0) {
        		return null;
        	}
        	
        	var linkRestrictions = this.data.linkRestrictions;
        	
        	for(var i=0; i<linkRestrictions.length; i++) {
        		var restriction = linkRestrictions[i];
        		var fromOperatorType = this.data.operators[linkData.fromOperator].type;
        		var toOperatorType = this.data.operators[linkData.toOperator].type;
        		
        		if(restriction.fromOperatorType==fromOperatorType
        				&& restriction.fromConnector==linkData.fromConnector
        				&& restriction.toOperatorType==toOperatorType
        				&& restriction.toConnector==linkData.toConnector) {
        			return i;
        		}
        	}
        	
        	return -1;
        },
      
        _autoCreateSubConnector: function(operator, connector, connectorType, subConnector) {
            var connectorInfos = this.data.operators[operator].properties[connectorType][connector];
            if (connectorInfos.multiple) {
                var fromFullElement = this.data.operators[operator].internal.els;
                var nbFromConnectors = this.data.operators[operator].internal.els.connectors[connector].length;
                for (var i = nbFromConnectors; i < subConnector + 2; i++) {
                    this._createSubConnector(connector, connectorInfos, fromFullElement, connectorType);
                }
            }
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
        
        getConnectorPosition: function(operatorId, connectorId, subConnector, connectorType) {
            var operatorData = this.data.operators[operatorId];
            var $connector = operatorData.internal.els[connectorType].connectorArrows[connectorId][subConnector];
          
            var connectorOffset = $connector.offset();
            var elementOffset = this.element.offset();
            
            var x = (connectorOffset.left - elementOffset.left) / this.positionRatio;
            var width = parseInt($connector.css('border-top-width'));
            var y = (connectorOffset.top - elementOffset.top - 1) / this.positionRatio + parseInt($connector.css('border-left-width'));
          
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
            this.options.onAfterChange('link_change_main_color');
        },
        
        _drawLink: function(linkId) {
            var linkData = this.data.links[linkId];
            
            if (typeof linkData.internal == 'undefined') {
                linkData.internal = {};
            }
            linkData.internal.els = {};
            
            var fromOperatorId = linkData.fromOperator;
            var fromConnectorId = linkData.fromConnector;
            var toOperatorId = linkData.toOperator;
            var toConnectorId = linkData.toConnector;
          
            var subConnectors = this._getSubConnectors(linkData);
            var fromSubConnector = subConnectors[0];
            var toSubConnector = subConnectors[1];
            
            var color = this.getLinkMainColor(linkId);
            
            var fromOperator = this.data.operators[fromOperatorId];
            var toOperator = this.data.operators[toOperatorId];
            
            var fromSmallConnector = fromOperator.internal.els.outputs.connectorSmallArrows[fromConnectorId][fromSubConnector];
            var toSmallConnector = toOperator.internal.els.inputs.connectorSmallArrows[toConnectorId][toSubConnector];
            
            linkData.internal.els.fromSmallConnector = fromSmallConnector;
            linkData.internal.els.toSmallConnector = toSmallConnector;
            
            var overallGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.objs.layers.links[0].appendChild(overallGroup);
            linkData.internal.els.overallGroup = overallGroup;
            
            var mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
            var maskId = "fc_mask_" + this.globalId + "_" + this.maskNum;
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
      
        _getSubConnectors: function(linkData) {
            var fromSubConnector = 0;
            if (typeof linkData.fromSubConnector != 'undefined') {
                fromSubConnector = linkData.fromSubConnector;
            }

            var toSubConnector = 0;
            if (typeof linkData.toSubConnector != 'undefined') {
                toSubConnector = linkData.toSubConnector;
            }
            
            return [fromSubConnector, toSubConnector];
        },
        
        _refreshLinkPositions: function(linkId) {
            var linkData = this.data.links[linkId];
            
            var subConnectors = this._getSubConnectors(linkData);
            var fromSubConnector = subConnectors[0];
            var toSubConnector = subConnectors[1];
            
            var fromPosition = this.getConnectorPosition(linkData.fromOperator, linkData.fromConnector, fromSubConnector, 'outputs');
            var toPosition = this.getConnectorPosition(linkData.toOperator, linkData.toConnector, toSubConnector, 'inputs');
            
            var fromX = fromPosition.x;
            var offsetFromX = fromPosition.width;
            var fromY = fromPosition.y;
            
            var toX = toPosition.x;
            var toY = toPosition.y;
          
            fromY += this.options.linkVerticalDecal;
            toY += this.options.linkVerticalDecal;
            
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
            if (typeof operatorData.internal == 'undefined') {
                operatorData.internal = {};
            }
            this._refreshInternalProperties(operatorData);
            infos = $.extend(true, {}, operatorData.internal.properties);
            
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
            
            var fullElement = {
        		operator: $operator,
        		title: $operator_title,
        		inputs: {
        			connectorSets: {},
            		connectors: {},
            		connectorArrows: {},
            		connectorSmallArrows: {}
        		},
        		outputs: {
        			connectorSets: {},
            		connectors: {},
            		connectorArrows: {},
            		connectorSmallArrows: {}
        		}
            };
          
            function addConnector(connectorKey, connectorInfos, $operator_container, connectorType) {
                var $operator_connector_set = $('<div class="flowchart-operator-connector-set"></div>');
                $operator_connector_set.data('connector_type', connectorType);
                $operator_connector_set.appendTo($operator_container);
                
                fullElement[connectorType].connectorArrows[connectorKey] = [];
                fullElement[connectorType].connectorSmallArrows[connectorKey] = [];
                fullElement[connectorType].connectors[connectorKey] = [];
                fullElement[connectorType].connectorSets[connectorKey] = $operator_connector_set;
              
                self._createSubConnector(connectorKey, connectorInfos, fullElement, connectorType);
            }
            
            for (var key in infos.inputs) {
                addConnector(key, infos.inputs[key], $operator_inputs, 'inputs');
            }
            
            for (var key in infos.outputs) {
                addConnector(key, infos.outputs[key], $operator_outputs, 'outputs');
            }
            
            return fullElement;
        },
      
        _createSubConnector: function(connectorKey, connectorInfos, fullElement, connectorType) {
            var $operator_connector_set = fullElement[connectorType].connectorSets[connectorKey];
          
            var subConnector = fullElement[connectorType].connectors[connectorKey].length;
          
            var $operator_connector = $('<div class="flowchart-operator-connector"></div>');
            $operator_connector.appendTo($operator_connector_set);
            $operator_connector.data('connector', connectorKey);
            $operator_connector.data('sub_connector', subConnector);

            var $operator_connector_label = $('<div class="flowchart-operator-connector-label"></div>');
            $operator_connector_label.text(connectorInfos.label.replace('(:i)', subConnector + 1));
            $operator_connector_label.appendTo($operator_connector);

            var $operator_connector_arrow = $('<div class="flowchart-operator-connector-arrow"></div>');

            $operator_connector_arrow.appendTo($operator_connector);

            var $operator_connector_small_arrow = $('<div class="flowchart-operator-connector-small-arrow"></div>');
            $operator_connector_small_arrow.appendTo($operator_connector);

            fullElement[connectorType].connectors[connectorKey].push($operator_connector);
            fullElement[connectorType].connectorArrows[connectorKey].push($operator_connector_arrow);
            fullElement[connectorType].connectorSmallArrows[connectorKey].push($operator_connector_small_arrow);
        },
        
        getOperatorElement: function(operatorData) {
            var fullElement = this._getOperatorFullElement(operatorData);
            return fullElement.operator;
        },
      
        addOperator: function(operatorData) {
            while(typeof this.data.operators[this.operatorNum] != 'undefined') {
                this.operatorNum++;
            }
            
            this.createOperator(this.operatorNum, operatorData);
            return this.operatorNum;
        },
        
        createOperator: function(operatorId, operatorData) {
            operatorData.internal = {};
            this._refreshInternalProperties(operatorData);
          
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
                    if (linkData.fromOperator == operator_id || linkData.toOperator == operator_id) {
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
                    handle: '.flowchart-operator-title',
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
                        self._unsetTemporaryLink();
                        var operatorId = $(this).data('operator_id');
                        operatorChangedPosition(operatorId, ui.position);
                        fullElement.operator.css({
                          height: 'auto'
                        });
                        
                        self.options.onOperatorMoved(operatorId, ui.position);
                        self.options.onAfterChange('operator_moved');
                    },
                });
            }
          
            this.options.onAfterChange('operator_create');
        },
        
        _connectorClicked: function(operator, connector, subConnector, connectorCategory) {
            if (connectorCategory == 'outputs') {
                var d = new Date();
                var currentTime = d.getTime();
                this.lastOutputConnectorClicked = {
                		operator: operator,
                		connector: connector,
                		subConnector: subConnector,
                		grantedConnectors: this._getGrantedConnectors(operator, connector)
                };
                this.objs.layers.temporaryLink.show();
                var position = this.getConnectorPosition(operator, connector, subConnector, connectorCategory);
                var x = position.x + position.width;
                var y = position.y;
                this.objs.temporaryLink.setAttribute('x1', x);
                this.objs.temporaryLink.setAttribute('y1', y);
                this._mousemove(x, y);
                this._colorizeGrantedConnectors();
            }
            if (connectorCategory == 'inputs' && this.lastOutputConnectorClicked != null) {
                var linkData = {
                    fromOperator: this.lastOutputConnectorClicked.operator,
                    fromConnector: this.lastOutputConnectorClicked.connector,
                    fromSubConnector: this.lastOutputConnectorClicked.subConnector,
                    toOperator: operator,
                    toConnector: connector,
                    toSubConnector: subConnector
                };

                this._unsetTemporaryLink();
                this.addLink(linkData);
            }
        },
        
        _getGrantedConnectors: function(operatorId, connector) {
        	var operatorType = this.data.operators[operatorId].type;
        	if(typeof operatorType=='undefined' || this.data.linkRestrictions.length==0) {
        		return [];
        	}
        	
        	var grantedLinks = this.data.linkRestrictions.filter(function(r) {
    			return operatorType==r.fromOperatorType && connector==r.fromConnector;
    		});
        	
        	var grantedConnectors = [];
        	
        	for(var l in grantedLinks) {
        		var link = grantedLinks[l];
        		
        		if(typeof link.color == 'undefined') {
        			link.color = this.defaultLinkColor;
        		}
        		
        		for(var opId in this.data.operators) {
        			var operator = this.data.operators[opId];
        			if(operator.type == link.toOperatorType) {
        				var arrows = operator.internal.els.inputs.connectorArrows[link.toConnector];
        				arrows = arrows.map(function(sa) {
        					return {els: sa, oldColor: sa.css('border-left-color')};
        				});
        				
        				grantedConnectors.push({
        					color: typeof link.color=='undefined' ? defaultLinkColor : link.color,
        					arrows: arrows
        				});
        			}
        		}
        	}
        	
        	return grantedConnectors;
        },
        
        _colorizeGrantedConnectors: function() {
        	if(this.lastOutputConnectorClicked != null) {
        		var grantedConnectors = this.lastOutputConnectorClicked.grantedConnectors;
        		
        		grantedConnectors.forEach(function(l) {
	    			l.arrows.forEach(function(sa) {
	    				sa.els.css('border-left-color', l.color);
	    			});
	    		});
        	}
        },
        
        _restoreGrantedConnectorsColor: function() {
        	if(this.lastOutputConnectorClicked != null) {
        		var grantedConnectors = this.lastOutputConnectorClicked.grantedConnectors;
        		
        		grantedConnectors.forEach(function(l) {
	    			l.arrows.forEach(function(sa) {
	    				sa.els.css('border-left-color', sa.oldColor);
	    			});
	    		});
        	}
        },
        
        _unsetTemporaryLink: function () {
        	this._restoreGrantedConnectorsColor();
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
            if (this.selectedOperatorId != null) {
                if (!this.options.onOperatorUnselect()) {
                    return;
                }
                this._removeSelectedClassOperators();
                this.selectedOperatorId = null;
            }
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
                    if (currentLink.fromOperator == operatorId || currentLink.toOperator == operatorId) {
                        this._deleteLink(linkId, true);
                    }
                }
            }
            if (!replace && operatorId == this.selectedOperatorId) {
                this.unselectOperator();
            }
            this.data.operators[operatorId].internal.els.operator.remove();
            delete this.data.operators[operatorId];
          
            this.options.onAfterChange('operator_delete');
        },
        
        deleteLink: function(linkId) {
            this._deleteLink(linkId, false);
        },
        
        _deleteLink: function(linkId, forced) {
            if (this.selectedLinkId == linkId) {
                this.unselectLink();
            }
            if (!this.options.onLinkDelete(linkId, forced)) {
                if (!forced) {
                    return;
                }
            }
            this.colorizeLink(linkId, 'transparent');
            var linkData = this.data.links[linkId];
            var fromOperator = linkData.fromOperator;
            var fromConnector = linkData.fromConnector;
            var toOperator = linkData.toOperator;
            var toConnector = linkData.toConnector;
            linkData.internal.els.overallGroup.remove();
            delete this.data.links[linkId];
          
            this._cleanMultipleConnectors(fromOperator, fromConnector, 'from');
            this._cleanMultipleConnectors(toOperator, toConnector, 'to');
          
            this.options.onAfterChange('link_delete');
        },
      
        _cleanMultipleConnectors: function(operator, connector, linkFromTo) {
        	var connectorType = linkFromTo == 'from' ? 'outputs' : 'inputs';
            if (!this.data.operators[operator].properties[connectorType][connector].multiple) {
                return;
            }
          
            var maxI = -1;
            var fromToOperator = linkFromTo + 'Operator';
            var fromToConnector = linkFromTo + 'Connector';
            var fromToSubConnector = linkFromTo + 'SubConnector';
            var els = this.data.operators[operator].internal.els;
            var subConnectors = els.connectors[connector];
            var nbSubConnectors = subConnectors.length;
          
            for (var linkId in this.data.links) {
                var linkData = this.data.links[linkId];
                if (linkData[fromToOperator] == operator && linkData[fromToConnector] == connector) {
                    if (maxI < linkData[fromToSubConnector]) {
                        maxI = linkData[fromToSubConnector];
                    }
                }
            }
          
            var nbToDelete = Math.min(nbSubConnectors - maxI - 2, nbSubConnectors - 1);
            for (var i = 0; i < nbToDelete; i++) {
                subConnectors[subConnectors.length - 1].remove();
                subConnectors.pop();
                els[connectorType].connectorArrows[connector].pop();
                els[connectorType].connectorSmallArrows[connector].pop();
            }
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
            var data = {};
            data.operators = $.extend(true, {}, this.data.operators);
            data.links = $.extend(true, {}, this.data.links);
            for (var keyI in keys) {
                var key = keys[keyI];
                for (var objId in data[key]) {
                    delete data[key][objId].internal;
                }
            }
            data.operatorTypes = this.data.operatorTypes;
            return data;
        },
        
        setOperatorTitle: function(operatorId, title) {
            this.data.operators[operatorId].internal.els.title.text(title);
            if (typeof this.data.operators[operatorId].properties == 'undefined') {
                this.data.operators[operatorId].properties = {};
            }
            this.data.operators[operatorId].properties.title = title;
            this._refreshInternalProperties(this.data.operators[operatorId]);
            this.options.onAfterChange('operator_title_change');
        },
        
        getOperatorTitle: function(operatorId) {
            return this.data.operators[operatorId].internal.properties.title;
        },
        
        setOperatorData: function(operatorId, operatorData) {
            var infos = this.getOperatorCompleteData(operatorData);
            for (var linkId in this.data.links) {
                var linkData = this.data.links[linkId];
                if ((linkData.fromOperator == operatorId &&
                    typeof infos.outputs[linkData.fromConnector] == 'undefined') ||
                    (linkData.toOperator == operatorId &&
                    typeof infos.inputs[linkData.toConnector] == 'undefined')) {
                        this._deleteLink(linkId, true);
                        continue;
                }
            }
            this._deleteOperator(operatorId, true);
            this.createOperator(operatorId, operatorData);
            this.redrawLinksLayer();
            this.options.onAfterChange('operator_data_change');
        },
        
        getOperatorData: function(operatorId) {
            var data = $.extend(true, {}, this.data.operators[operatorId]);
            delete data.internal;
            return data;
        },
      
        getOperatorFullProperties: function(operatorData) {
            if (typeof operatorData.type != 'undefined') {
                var typeProperties = this.data.operatorTypes[operatorData.type];
                var operatorProperties = {};
                if (typeof operatorData.properties != 'undefined') {
                    operatorProperties = operatorData.properties;
                }
                return $.extend({}, typeProperties, operatorProperties);
            }
            else {
                return operatorData.properties;
            }
        },
      
        _refreshInternalProperties: function(operatorData) {
            operatorData.internal.properties = this.getOperatorFullProperties(operatorData);
        }
    });
});