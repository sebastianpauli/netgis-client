"use strict";

var netgis = netgis || {};

netgis.Tree = function( draggable )
{
	this.draggable = draggable ? draggable : false;
	this.dragElement = null;
	
	this.initElements();
};

netgis.Tree.prototype.initElements = function()
{
	var ul = document.createElement( "ul" );
	ul.className = "netgis-tree";
	
	this.container = ul;
};

netgis.Tree.prototype.attachTo = function( parent )
{
	parent.appendChild( this.container );
};

netgis.Tree.prototype.clear = function()
{
	this.container.innerHTML = "";
};

netgis.Tree.prototype.addFolder = function( parent, id, title, prepend, nocheck, draggable, removable )
{
	var li = document.createElement( "li" );
	li.className = "netgis-folder";
	li.setAttribute( "data-id", id );
	li.setAttribute( "data-removable", ( ! removable ) ? false : true );
	
	var details = document.createElement( "details" );
	li.appendChild( details );
	
	var iconClosed = "<i class='netgis-icon netgis-hide-open fas fa-folder'></i>";
	var iconOpen = "<i class='netgis-icon netgis-show-open fas fa-folder-open'></i>";
	
	var summary = document.createElement( "summary" );
	summary.className = "netgis-button netgis-noselect netgis-clip-text netgis-color-e netgis-hover-d";
	summary.innerHTML = iconClosed + iconOpen + "<span>" + title + "</span>";
	details.appendChild( summary );
	
	if ( this.draggable === true )
	{
		if ( ! netgis.util.isDefined( draggable ) || draggable === true )
		{
			this.setItemDraggable( summary );
		}
		
		// TODO: if not draggable change cursor to not allowed when trying to drag
		//summary.addEventListener( "pointerdown", function( e ) { e.currentTarget.style.cursor = "not-allowed"; } );
		//summary.addEventListener( "pointerup", function( e ) { e.currentTarget.style.cursor = ""; } );
	}
	
	if ( removable === true )
	{
		var closer = document.createElement( "button" );
		closer.className = "netgis-closer netgis-clickable netgis-color-d netgis-hover-d";
		closer.innerHTML = "<i class='fas fa-times'></i>";
		closer.addEventListener( "click", this.onFolderDeleteClick.bind( this ) );
		summary.appendChild( closer );
	}
	
	var label = document.createElement( "label" );
	summary.appendChild( label );

	var input = document.createElement( "input" );
	input.setAttribute( "type", "checkbox" );
	input.onchange = this.onFolderChange.bind( this );
	label.appendChild( input );
	
	if ( nocheck === true )
	{
		li.classList.add( "netgis-nocheck" );
	}
	
	var ul = document.createElement( "ul" );
	details.appendChild( ul );
	
	var list = parent ? parent.getElementsByTagName( "ul" )[ 0 ] : this.container;
   
	if ( ! prepend )
	{
		list.appendChild( li );
	}
	else
	{
		list.insertBefore( li, list.firstChild );
	}
	
	return li;
};

netgis.Tree.prototype.addCheckbox = function( parent, id, title, checked, prepend, details )
{
	var li = document.createElement( "li" );
	li.className = "netgis-item";
	
	if ( this.draggable === true ) this.setItemDraggable( li );
	
	var label = document.createElement( "label" );
	label.className = "netgis-button netgis-noselect netgis-clip-text netgis-color-e netgis-hover-d";
	label.innerHTML = "<span>" + title + "</span>";
	li.appendChild( label );
	
	var wrapper = document.createElement( "span" );
	wrapper.className = "netgis-wrapper";
	label.insertBefore( wrapper, label.firstChild );
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "checkbox" );
	input.setAttribute( "data-id", id );
	if ( checked ) input.checked = checked;
	input.onchange = this.onItemChange.bind( this );
	wrapper.appendChild( input );
	
	if ( details )
	{
		this.addItemDetails( li, id, details );
	}
	
	var list;
	
	if ( parent )
	{
		list = parent.getElementsByTagName( "ul" )[ 0 ];
	}
	else
	{
		list = this.container;
	}
	
	if ( ! prepend )
	{
		list.appendChild( li );
	}
	else
	{
		list.insertBefore( li, list.firstChild );
	}
	
	return li;
};

netgis.Tree.prototype.addRadioButton = function( parent, id, title, checked, details )
{
	var li = document.createElement( "li" );
	li.className = "netgis-item";
	
	var label = document.createElement( "label" );
	label.className = "netgis-button netgis-noselect netgis-clip-text netgis-color-e netgis-hover-d";
	label.innerHTML = "<span>" + title + "</span>";
	li.appendChild( label );
	
	var wrapper = document.createElement( "span" );
	wrapper.className = "netgis-wrapper";
	label.insertBefore( wrapper, label.firstChild );
	
	var name = parent ? "radio-" + parent.getAttribute( "data-id" ) : "radio-noname";
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "radio" );
	input.setAttribute( "name", name );
	input.setAttribute( "value", "radio-" + id );
	input.setAttribute( "data-id", id );
	if ( checked ) input.checked = checked;
	input.onchange = this.onItemChange.bind( this );
	wrapper.appendChild( input );
	
	if ( details )
	{
		this.addItemDetails( li, id, details );
	}
	
	if ( parent )
	{
		parent.getElementsByTagName( "ul" )[ 0 ].appendChild( li );
	}
	else
	{
		this.container.appendChild( li );
	}
	
	return li;
};

netgis.Tree.prototype.addButton = function( parent, id, title, handler )
{
	var li = document.createElement( "li" );
	
	var button = document.createElement( "button" );
	button.innerHTML = title;
	button.className = "netgis-button netgis-color-e netgis-hover-d netgis-clip-text";
	button.setAttribute( "type", "button" );
	li.appendChild( button );
	
	if ( id ) button.setAttribute( "data-id", id );
	if ( handler ) button.onclick = handler;
	
	button.addEventListener( "click", this.onButtonClick.bind( this ) );
	
	if ( parent )
	{
		parent.getElementsByTagName( "ul" )[ 0 ].appendChild( li );
	}
	else
	{
		this.container.appendChild( li );
	}
	
	return li;
};

netgis.Tree.prototype.addSpace = function( parent )
{
	var li = document.createElement( "li" );
	li.className = "netgis-space";
	
	if ( parent )
	{
		parent.getElementsByTagName( "ul" )[ 0 ].appendChild( li );
	}
	else
	{
		this.container.appendChild( li );
	}
	
	return li;
};

netgis.Tree.prototype.addItemDetails = function( li, id, details )
{
	var detailsContainer = document.createElement( "details" );
	detailsContainer.className = "netgis-noselect";

	var summary = document.createElement( "summary" );
	summary.className = "netgis-clickable netgis-hover-d";
	summary.innerHTML = "<i class='fas fa-angle-down'></i>";
	detailsContainer.appendChild( summary );

	var wrapper = document.createElement( "div" );
	detailsContainer.appendChild( wrapper );

	for ( var i = 0; i < details.length; i++ )
	{
		var detail = details[ i ];

		var detailLabel = document.createElement( "label" );
		detailLabel.className = "netgis-hover-d";

		switch ( detail[ "type" ] )
		{
			case "button":
			{
				var detailButton = document.createElement( "button" );
				detailButton.setAttribute( "type", "button" );
				detailButton.addEventListener( "click", detail.callback );
				detailButton.className = "netgis-button netgis-color-e netgis-hover-d";
				detailButton.innerHTML = detail.title;
				detailLabel.appendChild( detailButton );
				
				break;
			}
			
			case "slider":
			{
				var detailHead = document.createElement( "span" );
				detailHead.className = "netgis-clip-text";
				detailHead.innerHTML = detail.title;
				detailLabel.appendChild( detailHead );

				var detailWrapper = document.createElement( "span" );
				detailLabel.appendChild( detailWrapper );

				var detailInput = document.createElement( "input" );
				detailInput.setAttribute( "type", "range" );
				detailInput.setAttribute( "min", 0 );
				detailInput.setAttribute( "max", 100 );
				detailInput.setAttribute( "step", 1 );
				detailInput.setAttribute( "value", detail.val );
				detailInput.setAttribute( "data-id", id );
				detailInput.addEventListener( "change", this.onItemSliderChange.bind( this ) );
				detailInput.addEventListener( "input", this.onItemSliderChange.bind( this ) );
				
				if ( this.draggable )
				{
					// NOTE: https://stackoverflow.com/questions/64853147/draggable-div-getting-dragged-when-input-range-slider-is-used
					detailInput.setAttribute( "draggable", "true" );
					detailInput.addEventListener( "dragstart", function( e ) { e.preventDefault(); e.stopImmediatePropagation(); } );
				}
				
				detailWrapper.appendChild( detailInput );

				break;
			}
		}

		wrapper.appendChild( detailLabel );
	}

	li.appendChild( detailsContainer );
};

netgis.Tree.prototype.setItemDraggable = function( li )
{
	li.setAttribute( "draggable", "true" );
	li.addEventListener( "dragstart", this.onDragStart.bind( this ) );
	li.addEventListener( "dragenter", this.onDragEnter.bind( this ) );
	li.addEventListener( "dragover", this.onDragOver.bind( this ) );
	li.addEventListener( "dragleave", this.onDragLeave.bind( this ) );
	li.addEventListener( "drop", this.onDragDrop.bind( this ) );
	li.addEventListener( "dragend", this.onDragEnd.bind( this ) );
};

netgis.Tree.prototype.getFolder = function( id )
{
	var folders = this.container.getElementsByClassName( "netgis-folder" );
	
	for ( var i = 0; i < folders.length; i++ )
	{
		var folder = folders[ i ];
		
		if ( folder.getAttribute( "data-id" ) === id ) return folder;
	}
	
	return null;
};

netgis.Tree.prototype.getItem = function( id )
{
	var inputs = this.container.getElementsByTagName( "input" );
	
	for ( var i = 0; i < inputs.length; i++ )
	{
		var input = inputs[ i ];
		
		if ( input.getAttribute( "data-id" ) === id ) return input;
	}
	
	// TODO: should return input or list item ?
	
	return null;
};

netgis.Tree.prototype.removeItem = function( id )
{
	var input = this.getItem( id );
	
	if ( ! input ) return;
	
	var wrapper = input.parentNode;
	var label = wrapper.parentNode;
	var item = label.parentNode;
	
	netgis.util.invoke( item, netgis.Events.TREE_ITEM_REMOVE, { id: id } );
	
	item.parentNode.removeChild( item );
	
	this.removeEmptyFolders();
	this.updateFolderChecks();
};

netgis.Tree.prototype.removeFolder = function( folder, force )
{
	if ( folder.getAttribute( "data-removable" ) !== "true" && force !== true ) return;
	
	folder.parentNode.removeChild( folder );
	this.removeEmptyFolders();
};

netgis.Tree.prototype.removeEmptyFolders = function()
{
	var folders = this.container.getElementsByClassName( "netgis-folder" );
	
	for ( var f = 0; f < folders.length; f++ )
	{
		var folder = folders[ f ];
		var ul = folder.getElementsByTagName( "ul" )[ 0 ];
		
		if ( ul.getElementsByTagName( "li" ).length === 0 )
		{
			this.removeFolder( folder, true );
		}
	}
};

netgis.Tree.prototype.moveItemUp = function( item )
{
	console.info( "MOVE ITEM:", item );
	
	var parentList = item.parentNode;
	
	if ( item.classList.contains( "netgis-folder" ) )
	{
		// Folder
		var parentDetails = parentList.parentNode;
		var parentFolder = parentDetails.parentNode;
		
		var targetList = parentFolder.parentNode;
		//var parentDetails2 = parentList2.parentNode;
		//var parentFolder2 = parentDetails2.parentNode;
		
		console.info( "PARENT:", parentFolder, targetList );
		
		parentList.removeChild( item );
		targetList.appendChild( item );
	}
	else
	{
		// Item
	}
};

netgis.Tree.prototype.setFolderOpen = function( id, open )
{
	var folders = this.container.getElementsByClassName( "netgis-folder" );
	
	id = id.toString();
	
	for ( var i = 0; i < folders.length; i++ )
	{
		var folder = folders[ i ];
		var details = folder.getElementsByTagName( "details" )[ 0 ];
		var folderID = folder.getAttribute( "data-id" );
		
		if ( folderID !== id ) continue;
		
		if ( open === true )
		{
			details.setAttribute( "open", "" );
		}
		else
		{
			details.removeAttribute( "open" );
		}
	}
};

netgis.Tree.prototype.setItemChecked = function( id, checked, silent )
{
	var items = this.container.getElementsByClassName( "netgis-item" );
	
	id = id.toString();
	
	for ( var i = 0; i < items.length; i++ )
	{
		var item = items[ i ];
		var input = item.getElementsByTagName( "input" )[ 0 ];
		var itemID = input.getAttribute( "data-id" );
		
		if ( itemID !== id ) continue;
		
		// Disable Other Radio Inputs
		if ( input.getAttribute( "type" ) === "radio" )
		{
			var others = item.parentNode.getElementsByTagName( "input" );
			
			for ( var j = 0; j < others.length; j++ )
			{
				var other = others[ j ];
				
				if ( other === input ) continue;
				if ( other.getAttribute( "type" ) !== "radio" ) continue;
				
				if ( other.checked !== false )
				{
					other.checked = false;
					netgis.util.invoke( input, netgis.Events.TREE_ITEM_CHANGE, { id: other.getAttribute( "data-id" ), checked: false } );
				}
			}
		}
		
		// Set This Input Checked
		if ( ! silent )
		{
			if ( input.checked !== checked ) input.click();
		}
		else
		{
			input.checked = checked;
		}
	}
};

netgis.Tree.prototype.setFolderParent = function( folder, parent )
{
	var oldParent = folder.parentNode;
	
	if ( oldParent ) oldParent.removeChild( folder );
	
	if ( parent !== null )
	{
		var ul = parent.getElementsByTagName( "ul" )[ 0 ];
		ul.appendChild( folder );
	}
	else
		this.container.appendChild( folder );
};

netgis.Tree.prototype.updateFolderChecks = function()
{
	var folders = this.container.getElementsByClassName( "netgis-folder" );
	
	for ( var i = 0; i < folders.length; i++ )
	{
		var folder = folders[ i ];
		this.updateFolderCheck( folder );
	}
};

netgis.Tree.prototype.updateFolderCheck = function( folder )
{
	if ( ! folder ) folder = this.container;
	
	// Count Child Checks
	var items = folder.getElementsByClassName( "netgis-item" );
	
	var checks = 0;
	
	for ( var i = 0; i < items.length; i++ )
	{
		var checkbox = items[ i ].getElementsByTagName( "input" )[ 0 ];
		if ( checkbox.checked ) checks++;
	}
	
	// Set Checkbox State
	var checkbox = folder.getElementsByTagName( "input" )[ 0 ];
	
	var state = 0;
	if ( checks > 0 ) state = 1;
	if ( checks > 0 && checks === items.length ) state = 2;
	
	switch ( state )
	{
		case 0:
		{
			// Unchecked
			checkbox.checked = false;
			checkbox.classList.remove( "netgis-partial" );
			break;
		}
		
		case 1:
		{
			// Partially Checked
			checkbox.checked = true;
			checkbox.classList.add( "netgis-partial" );
			break;
		}
		
		case 2:
		{
			// Fully Checked
			checkbox.checked = true;
			checkbox.classList.remove( "netgis-partial" );
			break;
		}
	}
	
	// TODO: use nearest ancestor selector
	var parentList = folder.parentElement;
	
	if ( parentList && parentList !== this.container )
	{
		// Recursion
		var parentFolder = parentList.parentElement.parentElement;
		
		if ( parentFolder && parentFolder.className.search( "netgis-folder" ) !== -1 )
			this.updateFolderCheck( parentFolder );
	}
};

netgis.Tree.prototype.onFolderChange = function( e )
{
	var checkbox = e.currentTarget;
	var checked = checkbox.checked;
	var folder = checkbox.parentElement.parentElement.parentElement.parentElement;
	var items = folder.getElementsByTagName( "input" );
	
	// Check Child Items
	for ( var i = 1; i < items.length; i++ )
	{
		var item = items[ i ];
		var childcheck = item;
		
		if ( childcheck.checked !== checked ) childcheck.click();
	}
	
	this.updateFolderChecks();
};

netgis.Tree.prototype.onFolderDeleteClick = function( e )
{
	var button = e.currentTarget;
	var summary = button.parentNode;
	var details = summary.parentNode;
	var folder = details.parentNode;
	
	var items = folder.getElementsByClassName( "netgis-item" );
	
	var ids = [];
	
	for ( var i = 0; i < items.length; i++ )
	{
		var item = items[ i ];
		var input = item.getElementsByTagName( "input" )[ 0 ];
		var id = input.getAttribute( "data-id" );
		
		ids.push( id );
	}
	
	for ( var i = 0; i < ids.length; i++ )
	{
		this.removeItem( ids[ i ] );
	}
};

netgis.Tree.prototype.onItemChange = function( e )
{
	var input = e.currentTarget;
	var checked = input.checked;
	
	var id = input.getAttribute( "data-id" );
	
	// Uncheck Other Radio Buttons
	if ( input.getAttribute( "type" ) === "radio" )
	{
		var label = input.parentNode.parentNode;
		var li = label.parentNode;
		var tree = li.parentNode;
		var treeInputs = tree.getElementsByTagName( "input" );

		for ( var i = 0; i < treeInputs.length; i++ )
		{
			var treeInput = treeInputs[ i ];
			var cid = treeInput.getAttribute( "data-id" );

			if ( ! cid ) continue;
			if ( cid === id ) continue;
			
			netgis.util.invoke( input, netgis.Events.TREE_ITEM_CHANGE, { id: cid, checked: false } );
		}
	}
	
	netgis.util.invoke( input, netgis.Events.TREE_ITEM_CHANGE, { id: id, checked: checked } );
	
	this.updateFolderChecks();
};

netgis.Tree.prototype.onRadioChange = function( e )
{
	var checkbox = e.currentTarget;
	var checked = checkbox.checked;
	
	var id = checkbox.getAttribute( "data-id" );
	var idn = Number.parseInt( id );
	if ( ! Number.isNaN( idn ) ) id = idn;
	
	var item = checkbox.parentElement.parentElement;
	var folder = item.parentElement.parentElement.parentElement;
	
	netgis.util.invoke( checkbox, netgis.Events.TREE_ITEM_CHANGE, { id: id, checked: checked } );
	
	if ( folder.className.search( "netgis-folder" ) !== -1 )
		this.updateFolderCheck( folder );
};

netgis.Tree.prototype.onButtonClick = function( e )
{
	var button = e.currentTarget;
	var id = button.getAttribute( "data-id" );
	
	netgis.util.invoke( button, netgis.Events.TREE_BUTTON_CLICK, { id: id } );
};

netgis.Tree.prototype.onItemSliderChange = function( e )
{
	var input = e.currentTarget;
	var id = input.getAttribute( "data-id" );
	
	netgis.util.invoke( input, netgis.Events.TREE_ITEM_SLIDER_CHANGE, { id: id, val: Number.parseFloat( input.value ) } );
};

netgis.Tree.prototype.onDragStart = function( e )
{
	// TODO: work in progress
	
	// NOTE: https://www.w3schools.com/html/html5_draganddrop.asp
	// NOTE: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
	// NOTE: https://stackoverflow.com/questions/64853147/draggable-div-getting-dragged-when-input-range-slider-is-used
	
	e.stopPropagation();
	
	var target = e.currentTarget;
	var input = target.getElementsByTagName( "input" )[ 0 ];
	var id = input.getAttribute( "data-id" );
	
	target.classList.add( "netgis-dragging" );
	
	e.dataTransfer.setData( "text/plain", id );
	e.dataTransfer.dropEffect = "move";
	
	this.dragElement = target;
};

netgis.Tree.prototype.onDragEnter = function( e )
{
	var target = e.currentTarget;
	
	if ( target === this.dragElement ) return;
	
	target.classList.add( "netgis-dragover" );
};

netgis.Tree.prototype.onDragOver = function( e )
{
	e.preventDefault();
	
	var target = e.currentTarget;
	
	if ( target === this.dragElement ) return;
	
	target.classList.add( "netgis-dragover" );
};

netgis.Tree.prototype.onDragLeave = function( e )
{
	var target = e.currentTarget;
	
	target.classList.remove( "netgis-dragover" );
};

netgis.Tree.prototype.onDragDrop = function( e )
{
	e.preventDefault();
	e.stopPropagation();
	
	var target = e.currentTarget;
	var id = e.dataTransfer.getData( "text/plain" );
	
	if ( target === this.dragElement ) return;
	
	target.classList.remove( "netgis-dragover" );
	
	// Drop Target
	var list = null;
	var before = null;
	
	if ( target.nodeName.toLowerCase() === "summary" )
	{
		// Drop On Folder
		list = target.parentNode.getElementsByTagName( "ul" )[ 0 ];
		before = list.childNodes.length > 0 ? list.childNodes[ 0 ] : null;
	}
	else
	{
		// Drop On Item
		list = target.parentNode;
		before = target;
	}
	
	// Draggable To Drop
	var li = null;
	
	if ( this.dragElement.nodeName.toLowerCase() === "summary" )
	{
		// Draggable Folder
		li = this.dragElement.parentNode.parentNode;
	}
	else
	{
		// Draggable Item
		li = this.dragElement;
	}
	
	// Dropped On Same Parent
	if ( li.parentNode === list )
	{
		if ( list.childNodes.length > 1 )
		{
			// Do Nothing If Already Top Item
		}
		else
		{
			// Dropped On Empty List
			before = null;
		}
	}
	
	// Dropped On Contained List
	if ( li.contains( list ) )
	{
		return;
	}
	
	// Add To List
	li.parentNode.removeChild( li );
	
	if ( ! before )
		list.appendChild( li );
	else
		list.insertBefore( li, before );
	
	netgis.util.invoke( this.container, netgis.Events.TREE_ITEM_ORDER_CHANGE, { items: this.container.getElementsByClassName( "netgis-item" ) } );
};

netgis.Tree.prototype.onDragEnd = function( e )
{
	var target = e.currentTarget;
	
	target.classList.remove( "netgis-dragging" );
	
	this.dragElement = null;
};