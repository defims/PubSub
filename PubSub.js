/*
Copyright (c) 2013 Defims Loong https://github.com/defims/PubSub
License: GPL v2

https://github.com/defims/PubSub
*/

(function(root, factory){
	'use strict';

	// CommonJS
	if (typeof exports === 'object' && module){
		module.exports = factory();

	// AMD
	} else if (typeof define === 'function' && define.amd){
		define(factory);
	// Browser
	} else {
		root.PubSub = factory();
	}
}( ( typeof window === 'object' && window ) || this, function(){
    
    /*
     *  Node
     */
    var Node = function(){
        this.key;
        this.parent;
        this.children           = [];
        this.subscribers        = [];
    };


    /*
     *  TopicTree
     */

    var TopicTree   = function(){
        this.root               = new Node;
        this.current            = this.root;
        this.length             = 0;
        this.subscribersByToken = [];
    };
    TopicTree.prototype = {
        getNode : function(/*Array*/path){
            var node    = this.current,
                match   = false,
                len,children,key;
            while(path.length){
                key         = path.shift();
                children    = node.children;
                len         = children.length;
                while(len--){
                    node    = children[len];
                    if(node.key == key){
                        match   = true;
                        break;
                    }
                }
            }
            return (match ? node : false);
        },
        mount   : function(/*Array*/path, /*function*/func){
            var node        = this.current,
                token       = ++this.length,
                key,len,children,match;
            while(path.length){
                key         = path.shift();
                match       = false;
                parent      = node;
                children    = node.children;
                len         = children.length;
                while(len--){
                    node   = children[len];
                    if(node.key == key){
                        match   = true;
                        break;
                    }
                }
                if( !match ){
                    node          = new Node;//change reference
                    node.key      = key;
                    node.parent   = parent;
                    parent.children.push(node);
                }
            }
            node.subscribers.push({"token": token, "func" : func});
            this.subscribersByToken[token] = {"node": node, "id": node.subscribers.length - 1};
            return token;
        },
        unmountByToken  : function(token){
            var item            = this.subscribersByToken[token],
                node            = item.node,
                subscribers     = node.subscribers,
                id              = item.id;
            node.subscribers    = subscribers.slice(0,id).concat(subscribers.slice(id+1, subscribers.length));
        },
        unmountByPath   : function(path){
            this.getNode(path).subscribers  = [];
        }
    };


    /*
     *  PubSub
     *
     */
    var PubSub  = function(){
        this.topicTree  = new TopicTree;
    };
    PubSub.prototype    = {
        message2path    : function(message){
            return message.replace(/[\.\[]/gim,'/').replace(/\]/gim,'').split('/');
        },
        setMessageRoot  : function(messageRoot){
            var topicTree       = this.topicTree;
            topicTree.current   = topicTree.getNode(this.message2path(messageRoot));
        },
        publish         : function(message, args){
            var node    = this.topicTree.getNode(this.message2path(message)); 
            if(!node) return false;
            var subscribers = node.subscribers,
                len         = subscribers ? subscribers.length : 0;
            setTimeout(function () {
                while (len--) subscribers[len].func(args);
            }, 0);

            return true;
        },
        subscribe       : function(message, func){
            return this.topicTree.mount(this.message2path(message), func);
        },
        unsubscribe     : function(tokenOrPath){
            var type    = typeof(tokenOrPath);
            if(type  == 'string'){//path
                return this.topicTree.unmountByPath(this.message2path(tokenOrPath));
            }else if(type == 'number'){//token
                return this.topicTree.unmountByToken(tokenOrPath);
            }
        }
    };

    return new PubSub;
}));
