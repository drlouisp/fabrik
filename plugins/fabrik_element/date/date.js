var FbDateTime = new Class({
	Extends: FbElement,
	
	options: {
		'dateTimeFormat': '', 
		'calendarSetup': {
			'eventName': 'click',
			'ifFormat': "%Y/%m/%d",
			'daFormat': "%Y/%m/%d",
			'singleClick': true,
			'align': "Br",
			'range': [1900, 2999],
			'showsTime': false,
			'timeFormat': '24',
			'electric': true,
			'step': 2,
			'cache': false,
			'showOthers': false
		}
	},
	
	initialize: function (element, options) {
		this.parent(element, options);
		this.hour = '0';
		this.plugin = 'fabrikdate';
		this.minute = '00';
		this.buttonBg = '#ffffff';
		this.buttonBgSelected = '#88dd33';
		this.startElement = element;
		this.setUpDone = false;
		this.setUp();
	},
	
	setUp: function () {
		this.watchButtons();
		if (this.options.typing === false) {
			this.disableTyping();
		}
		this.element.getElement('img.calendarbutton').addEvent('click', function (e) {
			if (this.cal) {
				this.cal.show();
			} else {
				this.makeCalendar();
			}
		}.bind(this));
	},
	
	/**
	 * run when calendar poped up - goes over each date and should return true if you dont want the date to be 
	 * selectable 
	 */
	dateSelect: function (date)
	{
		var fn = this.options.calendarSetup.dateAllowFunc;
		if (typeOf(fn) !== 'null' && fn !== '') {
			eval(fn);
			return result;
		}
		// 2.0 fall back 
		try {
			return disallowDate(this.cal, date);
		} catch (err) {
			//fconsole(err);
		}
	},
	
	calSelect: function (calendar, date) {
		var d = this.setTimeFromField(calendar.date);
		this.update(d.format('db'));
		if (this.cal.dateClicked) {
			this.cal.callCloseHandler();
		}
		window.fireEvent('fabrik.date.select', this);
	},
	
	calClose: function (calendar) {
		this.cal.hide();
		window.fireEvent('fabrik.date.close', this);
		if (this.options.hasValidations) {
			//if we have a validation on the element run it when the calendar closes itself
			//this ensures that alert messages are removed if the new data meets validation criteria
			this.form.doElementValidation(this.options.element);
		}
	},
	
	makeCalendar: function () {
		var mustCreate = false;
		this.addEventToCalOpts();
		var params = this.options.calendarSetup;
		var tmp = ["displayArea", "button"];
		
		for (var i in tmp) {
			if (typeof params[tmp[i]] === "string") {
				params[tmp[i]] = document.getElementById(params[tmp[i]]);
			}
		}
	
		params.inputField = this.getDateField();
		var dateEl = params.inputField || params.displayArea;
		var dateFmt = params.inputField ? params.ifFormat : params.daFormat;
		this.cal = null;//Fabrik.calendar;
		if (dateEl) {
			params.date = Date.parseDate(dateEl.value || dateEl.innerHTML, dateFmt);
		}
		
		this.cal = new Calendar(params.firstDay,
			params.date,
			params.onSelect,
			params.onClose);
	
		
		this.cal.setDateStatusHandler(params.dateStatusFunc);
		this.cal.setDateToolTipHandler(params.dateTooltipFunc);
		this.cal.showsTime = params.showsTime;
		this.cal.time24 = (params.timeFormat.toString() === "24");
		this.cal.weekNumbers = params.weekNumbers;
		
		if (params.multiple) {
			cal.multiple = {};
			for (i = params.multiple.length; --i >= 0;) {
				var d = params.multiple[i];
				var ds = d.print("%Y%m%d");
				this.cal.multiple[ds] = d;
			}
		}
		this.cal.showsOtherMonths = params.showOthers;
		this.cal.yearStep = params.step;
		this.cal.setRange(params.range[0], params.range[1]);
		this.cal.params = params;
		
		this.cal.getDateText = params.dateText;
		this.cal.setDateFormat(dateFmt);
		this.cal.create();
		this.cal.refresh();
		if (!params.position) {
			this.cal.showAtElement(params.button || params.displayArea || params.inputField, params.align);
		} else {
			this.cal.showAt(params.position[0], params.position[1]);
		}
	},

	disableTyping : function () {
		if (typeOf(this.element) === 'null') {
			fconsole(element + ': not date element container - is this a custom template with a missing $element->containerClass div/li surrounding the element?');
			return;
		}
		// yes we really can set the none existant 'readonly' property of the
		// subelement container
		// and get it when checking the validations - cool or what?
		this.element.setProperty('readonly', 'readonly');
		this.element.getElements('.fabrikinput').each(function (f) {
			f.addEvent('focus', function (e) {
				if (typeOf(e) === 'null') {
					return;
				}
				if (e.target.hasClass('timeField')) {
					this.element.getParent('.fabrikElementContainer').getElement('.timeButton').fireEvent('click');
				} else {
					this.options.calendarSetup.inputField = e.target.id;
					this.options.calendarSetup.button = this.element.id + "_img";
					this.addEventToCalOpts();
					
				}
			}.bind(this));
		}.bind(this));
	},

	/** 
	 * returns the date and time in mySQL formatted string
	 */
	getValue: function () {
		var v;
		if (!this.options.editable) {
			return this.options.value;
		}
		this.getElement();
		if (this.cal) {
			v = this.cal.date;
		} else {
			if (this.options.value === '') {
				return '';
			}
			v = new Date.parse(this.options.value);
		}
		v = this.setTimeFromField(v);
		return v.format('db');
	},
	
	setTimeFromField: function (d) {
		if (this.options.showtime === true && this.timeElement) {
			var t = this.timeElement.get('value').split(':');
			var h = t[0] ? t[0].toInt() : 0;
			var m = t[1] ? t[1].toInt() : 0;
			d.setHours(h);
			d.setMinutes(m);
		}
		return d;
	},

	watchButtons : function () {
		/*var b = document.id(this.options.element + '_cal_img'); 
		if (typeOf(b) !== 'null') {
			b.addEvent('click', function (e) {
				this.showCalendar('y-mm-dd', e);
			}.bind(this));
		}*/
		if (this.options.showtime & this.options.editable) {
			this.getTimeField();
			this.getTimeButton();
			if (this.timeButton) {
				this.timeButton.removeEvents('click');
				this.timeButton.addEvent('click', function () {
					this.showTime();
				}.bind(this));
				if (!this.setUpDone) {
					if (this.timeElement) {
						this.dropdown = this.makeDropDown();
						this.setAbsolutePos(this.timeElement);
						this.setUpDone = true;
					}
				}
			}
		}
	},

	addNewEvent : function (action, js) {
		if (action === 'load') {
			this.loadEvents.push(js);
			this.runLoadEvent(js);
		} else {
			if (!this.element) {
				this.element = $(this.strElement);
			}
			if (action === 'change') {
				Fabrik.addEvent('fabrik.date.select', function () {
					var e = 'fabrik.date.select';
					typeOf(js) === 'function' ? js.delay(0) : eval(js);
				});
			}
			this.element.getElements('input').each(function (i) {
				i.addEvent(action, function (e) {
					if (typeOf(e) === 'event') {
						e.stop();
					}
					typeOf(js) === 'function' ? js.delay(0) : eval(js);
				});
			}.bind(this));
		}
	},

	/**
	 * takes a date object or string
	 */
	update: function (val) {
		if (val === 'invalid date') {
			fconsole(this.element.id + ': date not updated as not valid');
			return;
		}
		var date;
		if (typeOf(val) === 'string') {
			// $$$ hugh - if val is empty string, like from a clearForm(), the Date.parse() is
			// going to return null, swhich will then blow up in a few lines.
			date = Date.parse(val);
			if (date === null) {
				return;
			}
		} else {
			date = val;
		}
		var f = this.options.calendarSetup.ifFormat;
		if (this.options.dateTimeFormat !== '' && this.options.showtime) {
			f += ' ' + this.options.dateTimeFormat;
		}
		
		this.fireEvents([ 'change' ]);
		if (typeOf(val) === 'null' || val === false) {
			return;
		}
		if (!this.options.editable) {
			if (typeOf(this.element) !== 'null') {
				//this.element.set('html', val);
				this.element.set('html', date.format(f));
			}
			return;
		}
		
		if (this.options.hidden) {
			//if hidden but form set to show time format dont split up the time as we don't 
			// have a time field to put it into
			date = date.format(f);
			this.getDateField().value = date;
			return;
		} else {
			// have to reset the time element as update is called (via reset) in
			// duplicate group code
			// before cloned() method called
			this.getTimeField();
			this.hour = date.get('hours');
			this.minute = date.get('minutes');
			this.stateTime();
		}
		this.getDateField().value = date.format(this.options.calendarSetup.ifFormat);
	},
	
	/**
	 * get the date field input
	 */
	getDateField: function () {
		return this.element.getElement('.fabrikinput');
	},
	
	/**
	 * get time time field input
	 */
	getTimeField: function () {
		this.timeElement = this.element.getParent('.fabrikElementContainer').getElement('.timeField');
		return this.timeElement;
	},
	
	/**
	 * get time time button img
	 */
	getTimeButton: function () {
		this.timeButton = this.element.getParent('.fabrikElementContainer').getElement('.timeButton');
		return this.timeButton;
	},

	showCalendar : function (format, e) {
		/*if (window.ie) {
			// when scrolled down the page the offset of the calendar is wrong - this
			// fixes it
			var calHeight = $(window.calendar.element).getStyle('height').toInt();
			var u = ie ? event.clientY + document.documentElement.scrollTop : e.pageY;
			u = u.toInt();
			$(window.calendar.element).setStyles({
				'top' : u - calHeight + 'px'
			});
		}*/
	},

	getAbsolutePos : function (el) {
		var r = {
			x : el.offsetLeft,
			y : el.offsetTop
		};
		if (el.offsetParent) {
			var tmp = this.getAbsolutePos(el.offsetParent);
			r.x += tmp.x;
			r.y += tmp.y;
		}
		return r;
	},

	setAbsolutePos : function (el) {
		var r = this.getAbsolutePos(el);
		this.dropdown.setStyles({
			position : 'absolute',
			left : r.x,
			top : r.y + 30
		});
	},

	makeDropDown : function () {
		var h = null;
		var handle = new Element('div', {
			styles : {
				'height' : '20px',
				'curor' : 'move',
				'color' : '#dddddd',
				'padding' : '2px;',
				'background-color' : '#333333'
			},
			'id' : this.startElement + '_handle'
		}).appendText(this.options.timelabel);
		var d = new Element('div', {
			'className' : 'fbDateTime',
			'styles' : {
				'z-index' : 999999,
				display : 'none',
				cursor : 'move',
				width : '264px',
				height : '125px',
				border : '1px solid #999999',
				backgroundColor : '#EEEEEE'
			}
		});

		d.appendChild(handle);
		for (var i = 0; i < 24; i++) {
			h = new Element('div', {
				styles: {
					width: '20px',
					'float': 'left',
					'cursor': 'pointer',
					'background-color': '#ffffff',
					'margin': '1px',
					'text-align': 'center'
				}
			});
			h.innerHTML = i;
			h.className = 'fbdateTime-hour';
			d.appendChild(h);
			$(h).addEvent('click', function (e) {
				this.hour = e.target.innerHTML;
				this.stateTime();
				this.setActive();
			}.bind(this));
			$(h).addEvent('mouseover', function (e) {
				if (this.hour !== e.target.innerHTML) {
					e.target.setStyles({
						background : '#cbeefb'
					});
				}
			}.bind(this));
			$(h).addEvent('mouseout', function (e) {
				if (this.hour !== e.target.innerHTML) {
					h.setStyles({
						background : this.buttonBg
					});
				}
			}.bind(this));
		}
		var d2 = new Element('div', {
			styles : {
				clear : 'both',
				paddingTop : '5px'
			}
		});
		for (i = 0; i < 12; i++) {
			h = new Element('div', {
				styles : {
					width : '41px',
					'float' : 'left',
					'cursor' : 'pointer',
					'background' : '#ffffff',
					'margin' : '1px',
					'text-align' : 'center'
				}
			});
			h.setStyles();
			h.innerHTML = ':' + (i * 5);
			h.className = 'fbdateTime-minute';
			d2.appendChild(h);
			$(h).addEvent('click', function (e) {
				this.minute = this.formatMinute(e.target.innerHTML);
				this.stateTime();
				this.setActive();
			}.bind(this));
			h.addEvent('mouseover', function (e) {
				var h = e.target;
				if (this.minute !== this.formatMinute(h.innerHTML)) {
					e.target.setStyles({
						background : '#cbeefb'
					});
				}
			}.bind(this));
			h.addEvent('mouseout', function (e) {
				var h = e.target;
				if (this.minute !== this.formatMinute(h.innerHTML)) {
					e.target.setStyles({
						background : this.buttonBg
					});
				}
			}.bind(this));
		}
		d.appendChild(d2);

		document.addEvent('click', function (e) {
			if (this.timeActive) {
				var t = e.target;
				if (t !== this.timeButton && t !== this.timeElement) {
					if (!t.within(this.dropdown)) {
						this.hideTime();
					}
				}
			}
		}.bind(this));
		d.injectInside(document.body);
		var mydrag = new Drag.Move(d);
		return d;
	},

	toggleTime : function () {
		if (this.dropdown.style.display === 'none') {
			this.doShowTime();
		} else {
			this.hideTime();
		}
	},

	doShowTime : function () {
		this.dropdown.setStyles({
			'display' : 'block'
		});
		this.timeActive = true;
		Fabrik.fireEvent('fabrik.date.showtime', this);
	},

	hideTime: function () {
		this.timeActive = false;
		this.dropdown.setStyles({
			'display': 'none'
		});
		this.form.doElementValidation(this.element.id);
		Fabrik.fireEvent('fabrik.date.hidetime', this);
		Fabrik.fireEvent('fabrik.date.select', this);
	},

	formatMinute: function (m) {
		m = m.replace(':', '');
		m.pad('2', '0', 'left');
		return m;
	},

	stateTime: function () {
		if (this.timeElement) {
			var newv = this.hour.toString().pad('2', '0', 'left') + ':' + this.minute.toString().pad('2', '0', 'left');
			var changed = this.timeElement.value !== newv;
			this.timeElement.value = newv;
			if (changed) {
				this.fireEvents([ 'change' ]);
			}
		}
	},

	showTime: function () {
		this.setAbsolutePos(this.timeElement); // need to recall if using tabbed form
		this.toggleTime();
		this.setActive();
	},

	setActive: function () {
		var hours = this.dropdown.getElements('.fbdateTime-hour');
		hours.each(function (e) {
			e.setStyles({
				backgroundColor: this.buttonBg
			});
		}, this);
		var mins = this.dropdown.getElements('.fbdateTime-minute');
		mins.each(function (e) {
			e.setStyles({
				backgroundColor: this.buttonBg
			});
		}, this);
		hours[this.hour.toInt()].setStyles({
			backgroundColor: this.buttonBgSelected
		});
		if (typeOf(mins[this.minute / 5]) !== 'null') {
			mins[this.minute / 5].setStyles({
				backgroundColor: this.buttonBgSelected
			});
		}
	},
	
	addEventToCalOpts: function () {
		this.options.calendarSetup.onSelect = function (calendar, date) {
			this.calSelect(calendar, date);
		}.bind(this);
		
		this.options.calendarSetup.dateStatusFunc = function (date) {
			return this.dateSelect(date);
		}.bind(this);
		
		this.options.calendarSetup.onClose = function (calendar) {
			this.calClose(calendar);
		}.bind(this);
		
	},

	cloned : function (c) {
		this.setUpDone = false;
		this.hour = 0;
		var button = this.element.getElement('img');
		if (button) {
			button.id = this.element.id + "_cal_img";
		}
		var datefield = this.element.getElement('input');
		datefield.id = this.element.id + "_cal";
		this.options.calendarSetup.inputField = datefield.id;
		this.options.calendarSetup.button = this.element.id + "_img";

		if (this.options.hidden !== true) {
			this.makeCalendar();
			this.cal.hide();
		}
		this.setUp();
	}
});

/// you can add custom events with:
	/*
	 * Fabrik.addEvent('fabrik.date.select', function () {
		console.log('trigger custom date event');
	})
 */