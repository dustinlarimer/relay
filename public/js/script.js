$(function() {
	var USERS = window.USERS = {}
	, windowStatus
	, afkDeliveredMessages = 0
	, roomName = $('#room_name').text();

	// First update the title with room's name
	updateTitle();

	focusInput();

	// Then check users online!
	$('.people a').each(function(index, element) {
		USERS[$(element).data('provider') + ":" + $(element).data('username')] = 1;
	});

	//View handlers
	$(".dropdown a.selected").click(function() {
		$('.create-room').show().next("form .text").hide();
		$(this).toggleClass("active");
		$(this).next(".dropdown-options").toggle();
	});

	$(".create-room").click(function() {
		$(this).hide();
		$(this).next(".text").fadeIn();
	});

	$(".lock").click(function() {
		$(this).toggleClass('active');
	});

	$(".fancybox").fancybox({'margin': 0, 'padding': 0});

	$(".invite-people").click(function(){
		$(this).hide().after('<p class="inviting-people">Inviting peple, please wait.</p>').delay(2000).hide().after('something');
	});

	//chatstream.io
	//var socket = io.connect();
	var notifications = io.connect('http://localhost/notifications');
	var chatstream = io.connect('http://localhost/chat');


	chatstream.on('error', function (reason){
		console.error('Unable to connect chatstream.IO', reason);
	});

	chatstream.on('connect', function (){
		console.info('successfully established a working connection');
		if($('.chat .chat-box').length == 0) {
			chatstream.emit('history request');
		}
	});

	chatstream.on('history response', function(data) {
		if(data.history && data.history.length) {
			var $lastInput
			, lastInputUser;
			
			data.history.forEach(function(post) {
				var time = new Date(post.date)
				  , chatBoxData = {
					  nickname: post.name
					, msg: post.body
					, provider: 'null'
					, type: 'history'
					, time: timeParser(time)
				}
				
				$lastInput = $('.chat .history').children().last();
				
				lastInputUserKey = $lastInput.data('provider') + ':' + $lastInput.data('user');

				if($lastInput.hasClass('chat-box') && lastInputUserKey === chatBoxData.provider + ':' + chatBoxData.nickname) {
					$lastInput.append(parseChatBoxMsg(ich.chat_box_text(chatBoxData)));
				} else {
					$('.chat .history').append(parseChatBox(ich.chat_box(chatBoxData)));
				}

				$('.chat').scrollTop($('.chat').prop('scrollHeight'));
				
		      });
		}
	});

chatstream.on('new user', function(data) {
	console.log(data.name + " has entered the stream");
	var message = "$username has joined the room.";

	//If user is not 'there'
	if(!$('.people a[data-username="' + data.name + '"][data-provider="' + data.provider + '"]').length) {
		//Then add it
		$('.online .people').prepend(ich.people_box(data));
		USERS[data.provider + ":" + data.name] = 1;

		// Chat notice
		message = message.replace('$username', data.name);

		// Check update time
		var time = new Date()
		, noticeBoxData = {
			user: data.name,
			noticeMsg: message,
			time: timeParser(time)
		};

		var $lastChatInput = $('.chat .current').children().last();

		if($lastChatInput.hasClass('notice') && $lastChatInput.data('user') === data.name) {
			$lastChatInput.replaceWith(ich.chat_notice(noticeBoxData));
		} else {
			$('.chat .current').append(ich.chat_notice(noticeBoxData));
			$('.chat').scrollTop($('.chat').prop('scrollHeight'));
		}
	} else {
		//Instead, just check him as 'back'
		USERS[data.provider + ":" + data.name] = 1;
	}
});

chatstream.on('user-info update', function(data) {
	var message = "$username is now $status.";

	// Update dropdown
	if(data.username === $('#username').text() && data.provider === $('#provider').text()) {
		$('.dropdown-status .list a').toggleClass('current', false);
		$('.dropdown-status .list a.' + data.status).toggleClass('current', true);

		$('.dropdown-status a.selected')
		.removeClass('available away busy');

		$('.dropdown-status a.selected').addClass(data.status).html('<b></b>' + data.status);
	}

	// Update users list
	$('.people a[data-username=' + data.username + '][data-provider="' + data.provider + '"]')
	.removeClass('available away busy')
	.addClass(data.status);

	// Chat notice
	message = message
	.replace('$username', data.username)
	.replace('$status', data.status);

	// Check update time
	var time = new Date()
	, noticeBoxData = {
		user: data.username,
		noticeMsg: message,
		time: timeParser(time)
	};

	var $lastChatInput = $('.chat .current').children().last();

	if($lastChatInput.hasClass('notice') && $lastChatInput.data('user') === data.username) {
		$lastChatInput.replaceWith(ich.chat_notice(noticeBoxData));
	} else {
		$('.chat .current').append(ich.chat_notice(noticeBoxData));
		$('.chat').scrollTop($('.chat').prop('scrollHeight'));
	}
});

chatstream.on('new msg', function(data) {
	var time = new Date(),
	$lastInput = $('.chat .current').children().last(),
	lastInputUserKey = $lastInput.data('provider') + ':' + $lastInput.data('user');

	data.type = 'chat';
	data.time = timeParser(time)

	if($lastInput.hasClass('chat-box') && lastInputUserKey === data.provider + ':' + data.nickname) {
		$lastInput.append(parseChatBoxMsg(ich.chat_box_text(data)));
	} else {
		$('.chat .current').append(parseChatBox(ich.chat_box(data)));
	}

	$('.chat').scrollTop($('.chat').prop('scrollHeight'));

	//update title if window is hidden
	if(windowStatus == "hidden") {
		afkDeliveredMessages +=1;
		updateTitle();
	}

});

chatstream.on('user leave', function(data) {
	console.log(data.name + " has left the stream");
	var nickname = $('#username').text()
	, message = "$username has left the room.";

	for (var userKey in USERS) {
		if(userKey === data.provider + ":" + data.name && data.name != nickname) {
			//Mark user as leaving
			USERS[userKey] = 0;

			//Wait a little before removing user
			setTimeout(function() {
				//If not re-connected
				if (!USERS[userKey]) {
					//Remove it and notify
					$('.people a[data-username="' + data.name + '"][data-provider="' + data.provider + '"]').remove();

					// Chat notice
					message = message.replace('$username', data.name);

					// Check update time
					var time = new Date(),
					noticeBoxData = {
						user: data.name,
						noticeMsg: message,
						time: timeParser(time)
					};

					var $lastChatInput = $('.chat .current').children().last();

					if($lastChatInput.hasClass('notice') && $lastChatInput.data('user') === data.name) {
						$lastChatInput.replaceWith(ich.chat_notice(noticeBoxData));
					} else {
						$('.chat .current').append(ich.chat_notice(noticeBoxData));
						$('.chat').scrollTop($('.chat').prop('scrollHeight'));
					}
				};
				}, 2000);
			}
		}
	});

	$(".chat-input input").keypress(function(e) {
		var inputText = $(this).val().trim();
		if(e.which == 13 && inputText) {
			var chunks = inputText.match(/.{1,1024}/g)
			, len = chunks.length;

			for(var i = 0; i<len; i++) {
				chatstream.emit('my msg', {
					msg: chunks[i]
				});
			}

			$(this).val('');

			return false;
		}
	});

	$('.dropdown-status .list a.status').click(function(e) {
		chatstream.emit('set status', {
			status: $(this).data('status')
		});
	});

	var timeParser = function(date) {
		var hours = date.getHours()
		, minutes = date.getMinutes()
		, seconds = date.getSeconds();
		return {
			hours: hours > 12 ? hours - 12 : hours,
			minutes: minutes > 10 ? minutes : '0' + minutes,
			seconds: seconds > 10 ? seconds : '0' + seconds,
			meridiem: hours > 12 ? 'PM' : 'AM'
		}
	};

	var textParser = function(text) {
		text = text
		.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig,"<a href=\"$1\" target='_blank'>$1</a>")
		.replace(/(@)([a-zA-Z0-9_]+)/g, "<a href=\"http://twitter.com/$2\" target=\"_blank\">$1$2</a>");

		return  injectEmoticons(text);
	};

	var parseChatBox = function(chatBox) {
		var chatBoxMsg = chatBox.find('p');
		parseChatBoxMsg(chatBoxMsg);
		return chatBox;
	};

	var parseChatBoxMsg = function(chatBoxMsg) {
		var msg = chatBoxMsg.html();
		return chatBoxMsg.html(textParser(msg));
	};

	var patterns = {
		angry: /\&gt;:-o|\&gt;:o|\&gt;:-O|\&gt;:O|\&gt;:-\(|\&gt;:\(/g,
			naughty: /\&gt;:-\)|\&gt;:\)|\&gt;:-\&gt;|\&gt;:\&gt;/g,
			sick: /:-\&amp;|:\&amp;|=\&amp;|=-\&amp;|:-@|:@|=@|=-@/g,
			smile: /:-\)|:\)|=-\)|=\)/g,
			wink: /;-\)|;\)/g,
			frown: /:-\(|:\(|=\(|=-\(/g,
				ambivalent: /:-\||:\|/g,
				gasp: /:-O|:O|:-o|:o|=-O|=O|=-o|=o/g,
				laugh: /:-D|:D|=-D|=D/g,
				kiss: /:-\*|:\*|=-\*|=\*/g,
				yuck: /:-P|:-p|:-b|:P|:p|:b|=-P|=-p|=-b|=P|=p|=b/g,
				yum: /:-d|:d/g,
				grin: /\^_\^|\^\^|\^-\^/g,
				sarcastic: /:-\&gt;|:\&gt;|\^o\)/g,
				cry: /:'\(|='\(|:'-\(|='-\(/g,
					cool: /8-\)|8\)|B-\)|B\)/g,
					nerd: /:-B|:B|8-B|8B/g,
					innocent: /O:-\)|o:-\)|O:\)|o:\)/g,
					sealed: /:-X|:X|=X|=-X/g,
					footinmouth: /:-!|:!/g,
					embarrassed: /:-\[|:\[|=\[|=-\[/g,
					crazy: /%-\)|%\)/g,
					confused: /:-S|:S|:-s|:s|%-\(|%\(|X-\(|X\(/g,
						moneymouth: /:-\$|:\$|=\$|=-\$/g,
						heart: /\(L\)|\(l\)/g,
						thumbsup: /\(Y\)|\(y\)/g,
						thumbsdown: /\(N\)|\(n\)/g,
						"not-amused": /-.-\"|-.-|-_-\"|-_-/g,
						"mini-smile": /c:|C:|c-:|C-:/g,
						"mini-frown": /:c|:C|:-c|:-C/g,
						content: /:j|:J/g,
						hearteyes: /\&lt;3/g
					};

					var emoticHTML = "<span class='emoticon $emotic'></span>";

					var injectEmoticons = function(text) {
						for(var emotic in patterns) {
							text = text.replace(patterns[emotic],emoticHTML.replace("$emotic", "emoticon-" + emotic));
						}
						return text;
					}

					// TITLE notifications
					var hidden
					, change
					, vis = {
						hidden: "visibilitychange",
						mozHidden: "mozvisibilitychange",
						webkitHidden: "webkitvisibilitychange",
						msHidden: "msvisibilitychange",
						oHidden: "ovisibilitychange" /* not currently supported */
					};             

					for (var hidden in vis) {
						if (vis.hasOwnProperty(hidden) && hidden in document) {
							change = vis[hidden];
							break;
						}
					}

					if (change) {
						document.addEventListener(change, onchange);
						} else if (/*@cc_on!@*/false) { // IE 9 and lower
							document.onfocusin = document.onfocusout = onchange
						} else {
							window.onfocus = window.onblur = onchange;
						}

						function onchange (evt) {
							var body = document.body;
							evt = evt || window.event;

							if (evt.type == "focus" || evt.type == "focusin") {
								windowStatus = "visible";
							} else if (evt.type == "blur" || evt.type == "focusout") {
								windowStatus = "hidden";
							} else {
								windowStatus = this[hidden] ? "hidden" : "visible";
							}

							if(windowStatus == "visible" && afkDeliveredMessages) {
								afkDeliveredMessages = 0;
								updateTitle();
							}

							if (windowStatus == "visible") {
								focusInput();
							}
						}

						function updateTitle() {
							$('title').html(ich.title_template({
								count: afkDeliveredMessages,
								roomName: roomName
								}, true));
							}

							function focusInput() {
								$(".chat-input input.text").focus();
							}
						});
