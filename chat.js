(function chatModule() {

    var engine,
        api,
        events;

    engine = (function() {

        var messages = [],
            userName = "Roi";

        function storeMessages(messagesData) {
            messages = messagesData;
        }

        function createNewMessageData(message) {
            return {
                "name": userName,
                "message": message
            };
        }

        function createEditedMessageData(messageId, newMessage) {
            var messageObj = getMessageObjById(messageId);
            messageObj.message = newMessage;
            return messageObj;
        }

        function getMessageObjById(messageId) {
            for (var i = 0; i < messages.length; i++) {
                if (messages[i]["_id"] === messageId) {
                    return messages[i];
                }
            }
        }

        function getUserName() {
            return userName;
        }

        return {
            storeMessages: storeMessages,
            createNewMessageData: createNewMessageData,
            createEditedMessageData: createEditedMessageData,
            getMessageObjById: getMessageObjById,
            getUserName: getUserName
        };

    })();

    api = (function() {

        var url = "https://hidden-headland-7200.herokuapp.com/";

        function ajax(type, url, data) {
            var xhr = new XMLHttpRequest();
            var obj = {
                then: function(callback) {
                    xhr.onload = () => {
                        var DONE = 4; // readyState 4 means the request is done.
                        var OK = 200; // status 200 is a successful return.
                        if (xhr.readyState === DONE) {
                            if (xhr.status === OK) {
                                callback(xhr);
                            }
                            else {
                                alert('Error: ' + xhr.status); // An error occurred during the request.
                            }
                        }
                    };
                }
            };
            xhr.open(type, url);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(data);
            return obj;
        }

        function getMessages(callback) {
            ajax('get', url).then(callback);
        }

        function postMessage(message) {
            ajax('post', url + 'new', JSON.stringify(message)).then(function(xhr) {
                printResponseToConsole(xhr);
            });
        }

        function editMessage(message) {
            ajax('put', url + 'edit/' + message["_id"], JSON.stringify(message)).then(function(xhr) {
                printResponseToConsole(xhr);
            });
        }

        function removeMessage(messageId) {
            ajax('delete', url + 'delete/' + messageId).then(function(xhr) {
                printResponseToConsole(xhr);
            });
        }

        function printResponseToConsole(xhr) {
            try {
                var jsonobj = JSON.parse(xhr.responseText);
                console.dir(jsonobj);
            }
            catch (error){ 
                console.log(xhr.responseText);
            }
        }

        return {
            getMessages: getMessages,
            postMessage: postMessage,
            editMessage: editMessage,
            removeMessage: removeMessage
        };

    })();

    events = (function(api, engine) {
        var sendButton = document.querySelector("#js-sendMessage"),
            userInput = document.querySelector("#js-userInput"),
            messagesContainer = document.querySelector("#js-messages-container"),
            edit = {
                status: false,
                messageId: null
            };

        function editMessage(event) {
            if (event.target.textContent !== "edit") {
                return;
            }
            var editButton = event.target;
            userInput.value = engine.getMessageObjById(editButton.dataset.messageId).message;
            edit.status = true;
            edit.messageId = editButton.dataset.messageId;
        }

        function removeMessage(event) {
            if (event.target.textContent !== "remove") {
                return;
            }
            var removeButton = event.target;
            api.removeMessage(removeButton.dataset.messageId);
        }

        function sendMessage(event) {
            var message;
            
            event.preventDefault();
            
            if (edit.status === true) {
                message = engine.createEditedMessageData(edit.messageId, userInput.value);
                api.editMessage(message);
                edit.status = false;
            }
            else {
                message = engine.createNewMessageData(userInput.value);
                api.postMessage(message);
            }
            
            userInput.value = "";
        }

        function updateMessages() {
            setInterval(function() {
                var messages,
                    callback = function(xhr) {
                        messages = JSON.parse(xhr.response);
                        engine.storeMessages(messages);
                        displayMessages(messages);
                    };
                api.getMessages(callback);
            }, 1000);
        }

        function displayMessages(messages) {
            removeAllChildren(messagesContainer);
            for (var i = 0; i < messages.length; i++) {
                messagesContainer.appendChild(createMessageElement(messages[i]))
            }
        }

        function removeAllChildren(node) {
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
        }

        function createMessageElement(messageData) {
            var newMessageElem = document.createElement('p'),
                userName = engine.getUserName();
            newMessageElem.textContent = messageData.name + ": " + messageData.message;
            if (messageData.name === userName) {
                newMessageElem.appendChild(createActionButton("edit", messageData["_id"]))
                newMessageElem.appendChild(createActionButton("remove", messageData["_id"]))
            }
            return newMessageElem;
        }

        function createActionButton(action, id) {
            var actionButton = document.createElement('button');
            actionButton.textContent = action;
            actionButton.dataset.messageId = id;
            return actionButton;
        }

        function initialize() {
            sendButton.addEventListener('click', sendMessage);
            messagesContainer.addEventListener('click', removeMessage);
            messagesContainer.addEventListener('click', editMessage);
            updateMessages();
        }

        return {
            initialize: initialize
        }

    })(api, engine);

    events.initialize();

})();