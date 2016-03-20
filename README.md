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

* __ canUserEditLinks (default: true):__ Can the user add links by clicking on connectors. Note that links can be removed during the process if `multipleLinksOnInput`of `multipleLinksOnOutput`are set to false.

* __ canUserMoveOperators (default: true):__ Can the user move operators using drag and drop.

* __ data (default: `{}`):__ Initialization data defining the flow chart operators and links between them.

  * __ operators:__ Hash defining the operators in your flow chart. The keys define the operators ID and the value define each operator's information as follow:
    * __ top (in px)__
    * __ left (in px)__
    * __ properties:__
      * __ title__
      * __ class:__ css classes added to the operator DOM object. If undefined, default value is the same as `defaultOperatorClass`.
      * __inputs:__ Hash defining the box's input connectors. The keys define the connectors ID and the values define each connector's information as follow:
        * __label__
      * __outputs:__ Hash defining the box's output connectors. Same structure as `inputs`.
      
  * __ links:__ Hash defining the links between your operators in your flow chart. The keys define the link ID and the value define each link's information as follow:
    * __ from_operator:__ ID of the operator the link comes from.
    * __ from_connector:__ ID of the connector the link comes from.
    * __ to_operator:__ ID of the operator the link goes to.
    * __ to_connector:__ ID of the connector the link goes to.
    * __ color:__ Color of the link. If undefined, default value is the same as `defaultLinkColor`.
    
* __ distanceFromArrow (default: 3):__ Distance between the output connector and the link.

* __ defaultLinkColor (default: '#3366ff'):__ Default color of links.

* __ defaultSelectedLinkColor (default: 'black'):__ Default color of links when selected.

* __ defaultOperatorClass (default: 'flowchart-default-operator'):__ Default class of the operator DOM element. 

* __ linkWidth (default: 11):__ Width of the links.

* __ grid (default: 20):__ Grid of the operators when moved.

* __ multipleLinksOnInput (default: false):__ Allows multiple links on the same input connector.

* __ multipleLinksOnOutput (default: false):__ Allows multiple links on the same output connector.

* __ onOperatorSelect (default: function returning true):__ Callback method. Called when an operator is selected. It should return a boolean. Returning `false` cancels the selection. Parameters are:
  * __ operatorId __ ID of the operator.

* __ onOperatorUnselect (default: function returning true):__ Callback method. Called when an operator is unselected. It should return a boolean. Returning `false` cancels the unselection.

* __ onLinkSelect (default: function returning true):__ Callback method. Called when a link is selected. It should return a boolean. Returning `false` cancels the selection. Parameters are:
  * __ linkId __ ID of the link.

* __ onLinkUnselect (default: function returning true):__ Callback method. Called when a link is unselected. It should return a boolean. Returning `false` cancels the unselection.

* __ onOperatorCreate (default: function returning true):__ Callback method. Called when an operator is created. It should return a boolean. Returning `false` cancels the creation. Parameters are:
  * __ operatorId:__ ID of the operator.
  * __ operatorData:__ Data of the operator.
  * __ fullElement:__ Hash containing DOM elements of the operator. The structure is the same as what is returned by the `getOperatorElement` function.

* __ onOperatorDelete (default: function returning true):__ Callback method. Called when an operator is deleted. It should return a boolean. Returning `false` cancels the deletion. Parameters are:
  * __ operatorId __ ID of the operator.

* __ onLinkCreate (default: function returning true):__ Callback method. Called when a link is created. It should return a boolean. Returning `false` cancels the creation. Parameters are:
  * __ linkId:__ ID of the link.
  * __ linkData:__ Data of the link.

* __ onLinkDelete (default: function returning true):__ Callback method. Called when a link is deleted. It should return a boolean. Returning `false` cancels the deletion. Parameters are:
  * __ linkId:__ ID of the link.
  * __ forced:__ The link deletion can not be cancelled since it happens during an operator deletion.


### Functions


* __ Methods related to operators: __
  * __ createOperator: __ (operatorId, operatorData)
  * __ deleteOperator: __ (operatorId)
  * __ getSelectedOperatorId: __ ()
  * __ selectOperator: __ (operatorId)
  * __ unselectOperator: __ ()
  * __ setOperatorTitle: __ (operatorId, title)
  * __ getOperatorTitle: __ (operatorId)
  * __ setOperatorData: __ (operatorId, operatorData)
  * __ getOperatorData: __ (operatorId)
  * __ getConnectorPosition: __ (operator, connector)
  * __ getOperatorFullInfos: __ (operatorData)
  * __ getOperatorFullElement: __ (operatorData)
  * __ getOperatorElement: __ (operatorData)

* __ Methods related to links: __
  * __createLink: __ (linkId, linkData)
  * __addLink: __ (linkData)
  * __deleteLink: __ (linkId)
  * __getSelectedLinkId: __ ()
  * __selectLink: __ (linkId)
  * __unselectLink: __ ()
  * __getLinkMainColor: __ (linkId)
  * __setLinkMainColor: __ (linkId, color)
  * __colorizeLink: __ (linkId, color)
  * __uncolorizeLink: __ (linkId)
  * __redrawLinksLayer: __ ()
  

  
* __ Misc methods: __
  * __ getData: __ ()
  * __ setData: __ (data)
  * __ setPositionRatio: __(positionRatio)
  * __ getPositionRatio: __ ()
  * __ deleteSelected: __ ()