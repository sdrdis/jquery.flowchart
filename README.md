jquery.flowchart
================

JQuery plugin that allows you to draw a flow chart. Take a look at the demo:
http://sebastien.drouyer.com/jquery.flowchart-demo/

Description
-----------

jquery.flowchart.js is an open source jquery ui plugin that allows you to draw and edit a flow chart.

Here are the main functionalities provided so far:
* Draw boxes (called operators) and connections between them.
* Methods are provided so that the end-user can edit the flow chart by adding / moving / removing operators, creating / removing connections between them.
* The developper can save / load the flowchart.
* Operators and links can be customized using CSS and the plugin parameters.
* Some methods allow you to add advanced functionalities, such as a panzoom view or adding operators using drag and drop. Take a look at the [advanced demo](http://sebastien.drouyer.com/jquery.flowchart-demo/)

Licence
-------
jquery.earth3d.js is under [MIT licence](https://github.com/sdrdis/jquery.flowchart/blob/master/MIT-LICENSE.txt).

Authors
-------
* [Sebastien Drouyer](http://sebastien.drouyer.com) - alias [@sdrdis](https://twitter.com/sdrdis) - for this jquery ui plugin

Documentation
-------------

### Demo:

http://sebastien.drouyer.com/jquery.flowchart-demo/

### Terminology:

### Options:

* __canUserEditLinks (default: true):__ Can the user add links by clicking on connectors. Note that links can be removed during the process if `multipleLinksOnInput`of `multipleLinksOnOutput`are set to false.

* __canUserMoveOperators (default: true):__ Can the user move operators using drag and drop.

* __data (default: `{}`):__ Initialization data defining the flow chart operators and links between them.

  * __operators:__ Hash defining the operators in your flow chart. The keys define the operators ID and the value define each operator's information as follow:
    * __top (in px)__
    * __left (in px)__
    * __properties:__
      * __title__
      * __class:__ css classes added to the operator DOM object. If undefined, default value is the same as `defaultOperatorClass`.
      * __inputs:__ Hash defining the box's input connectors. The keys define the connectors ID and the values define each connector's information as follow:
        * __label__
      * __outputs:__ Hash defining the box's output connectors. Same structure as `inputs`.
      
  * __links:__ Hash defining the links between your operators in your flow chart. The keys define the link ID and the value define each link's information as follow:
    * __from_operator:__ ID of the operator the link comes from.
    * __from_connector:__ ID of the connector the link comes from.
    * __to_operator:__ ID of the operator the link goes to.
    * __to_connector:__ ID of the connector the link goes to.
    * __color:__ Color of the link. If undefined, default value is the same as `defaultLinkColor`.
    
* __distanceFromArrow (default: 3):__ Distance between the output connector and the link.

* __defaultLinkColor (default: '#3366ff'):__ Default color of links.

* __defaultSelectedLinkColor (default: 'black'):__ Default color of links when selected.

* __defaultOperatorClass (default: 'flowchart-default-operator'):__ Default class of the operator DOM element. 

* __linkWidth (default: 11):__ Width of the links.

* __grid (default: 20):__ Grid of the operators when moved.

* __multipleLinksOnInput (default: false):__ Allows multiple links on the same input connector.

* __multipleLinksOnOutput (default: false):__ Allows multiple links on the same output connector.

* __onOperatorSelect (default: function returning true):__ Callback method. Called when an operator is selected. It should return a boolean. Returning `false` cancels the selection. Parameters are:
  * __operatorId __ ID of the operator.

* __onOperatorUnselect (default: function returning true):__ Callback method. Called when an operator is unselected. It should return a boolean. Returning `false` cancels the unselection.

* __onLinkSelect (default: function returning true):__ Callback method. Called when a link is selected. It should return a boolean. Returning `false` cancels the selection. Parameters are:
  * __linkId __ ID of the link.

* __onLinkUnselect (default: function returning true):__ Callback method. Called when a link is unselected. It should return a boolean. Returning `false` cancels the unselection.

* __onOperatorCreate (default: function returning true):__ Callback method. Called when an operator is created. It should return a boolean. Returning `false` cancels the creation. Parameters are:
  * __operatorId:__ ID of the operator.
  * __operatorData:__ Data of the operator.
  * __fullElement:__ Hash containing DOM elements of the operator. The structure is the same as what is returned by the `getOperatorElement` function.

* __onOperatorDelete (default: function returning true):__ Callback method. Called when an operator is deleted. It should return a boolean. Returning `false` cancels the deletion. Parameters are:
  * __operatorId __ ID of the operator.

* __onLinkCreate (default: function returning true):__ Callback method. Called when a link is created. It should return a boolean. Returning `false` cancels the creation. Parameters are:
  * __linkId:__ ID of the link.
  * __linkData:__ Data of the link.

* __onLinkDelete (default: function returning true):__ Callback method. Called when a link is deleted. It should return a boolean. Returning `false` cancels the deletion. Parameters are:
  * __linkId:__ ID of the link.
  * __forced:__ The link deletion can not be cancelled since it happens during an operator deletion.


### Functions


* __Methods related to operators:__
  * __createOperator:__ (operatorId, operatorData)
  * __deleteOperator:__ (operatorId)
  * __getSelectedOperatorId:__ ()
  * __selectOperator:__ (operatorId)
  * __unselectOperator:__ ()
  * __setOperatorTitle:__ (operatorId, title)
  * __getOperatorTitle:__ (operatorId)
  * __setOperatorData:__ (operatorId, operatorData)
  * __getOperatorData:__ (operatorId)
  * __getConnectorPosition:__ (operator, connector)
  * __getOperatorFullInfos:__ (operatorData)
  * __getOperatorFullElement:__ (operatorData)
  * __getOperatorElement:__ (operatorData)

* __Methods related to links:__
  * __createLink:__ (linkId, linkData)
  * __addLink:__ (linkData)
  * __deleteLink:__ (linkId)
  * __getSelectedLinkId:__ ()
  * __selectLink:__ (linkId)
  * __unselectLink:__ ()
  * __getLinkMainColor:__ (linkId)
  * __setLinkMainColor:__ (linkId, color)
  * __colorizeLink:__ (linkId, color)
  * __uncolorizeLink:__ (linkId)
  * __redrawLinksLayer:__ ()
  

  
* __Misc methods:__
  * __getData:__ ()
  * __setData:__ (data)
  * __setPositionRatio:__(positionRatio)
  * __getPositionRatio:__ ()
  * __deleteSelected:__ ()