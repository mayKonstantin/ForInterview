/*
Моей задачей было реализовать ecommerce часть для проекта.
Из-за соглашения NDA не могу показать весь функционал.
Здесь представлена ранняя версия контроллера. В последних
версиях я декомпозировал его функционал на компоненты
и отрефакторил. Но для демонстрации кода думаю, что лучший
вариант показать его в таком виде.

Проект мы писали в соответсвии с последней спецификацией ES6
и для безболезненной поддержки использовали транспайлер Babel.
*/
import Ember from 'ember';
import LoginControllerMixin from 'ember-simple-auth/mixins/login-controller-mixin';

export default Ember.Controller.extend(LoginControllerMixin, {
	identification: Ember.computed.or('signupModel.email', 'loginModel.email'),
	password: Ember.computed.or('signupModel.password', 'loginModel.password'),

	isSigninStep: true,
	isStepOne: true,
	isStepTwo: false,
	isStepThree: false,

	selectedOrderCountryCode: Ember.computed('order.countryCode', {
		get: function() {
			const current = this.get('order.countryCode');
			const list = this.get('countries');
			return list.find(item => { return item.id === current; });
		},
		set: function(key, newValue) {
			const value = newValue['id'];
			this.set('order.countryCode', value);
			return newValue;
		}
	}),

	selectedOrderStateCode: Ember.computed('order.stateCode', {
		get: function() {
			const current = this.get('order.stateCode');
			const list = this.get('countryStates');
			return list.find(item => { return item.id === current; });
		},
		set: function(key, newValue) {
			const value = newValue['id'];
			this.set('order.stateCode', value);
			return newValue;
		}
	}),

	selectedCountry: Ember.computed('account.country', {
		get: function() {
			const current = this.get('account.country');
			const list = this.get('countries');
			return list.find(item => { return item.id === current; });
		},
		set: function(key, newValue) {
			const value = newValue['id'];
			this.set('account.country', value);
			return newValue;
		}
	}),

	selectedOrderCardType: Ember.computed('order.cardType', {
		get: function() {
			const current = this.get('order.cardType');
			const list = this.get('cardTypeList');
			return list.find(item => { return item.id === current; });
		},
		set: function(key, newValue) {
			const value = newValue['id'];
			this.set('order.cardType', value);
			return newValue;
		}
	}),

	selectedOrderExpirationYear: Ember.computed('order.expirationYear', {
		get: function() {
			const current = this.get('order.expirationYear');
			const list = this.get('yearList');
			return list.find(item => { return item.id === current; });
		},
		set: function(key, newValue) {
			const value = newValue['id'];
			this.set('order.expirationYear', value);
			return newValue;
		}
	}),

	selectedOrderExpirationMonth: Ember.computed('order.expirationMonth', {
		get: function() {
			const current = this.get('order.expirationMonth');
			const list = this.get('monthList');
			return list.find(item => { return item.id === current; });
		},
		set: function(key, newValue) {
			const value = newValue['id'];
			this.set('order.expirationMonth', value);
			return newValue;
		}
	}),

	cardTypeList: [
		{id: "VI", name: "Visa"},
		{id: "MS", name: "MasterCard"}
	],
	monthList: [
		{id: '1', name: '01'},
		{id: '2', name: '02'},
		{id: '3', name: '03'},
		{id: '4', name: '04'},
		{id: '5', name: '05'},
		{id: '6', name: '06'},
		{id: '7', name: '07'},
		{id: '8', name: '08'},
		{id: '9', name: '09'},
		{id: '10', name: '10'},
		{id: '11', name: '11'},
		{id: '12', name: '12'}
	],
	yearList: [
		{id: '2016', name: '2016'},
		{id: '2017', name: '2017'},
		{id: '2018', name: '2018'},
		{id: '2019', name: '2019'},
		{id: '2020', name: '2020'},
		{id: '2021', name: '2021'},
		{id: '2022', name: '2022'}
	],

	order: {
		firstName: '',
		lastName: '',
		companyName: '',
		phone1: '',
		street1: '',
		street2: '',
		city: '',
		state: DS.attr('string'),
		postalCode: '',
		advantageId: DS.attr('string'),
		country: ''
	},

	stepOneFinished: function() {
		// user was authorized
		var isAuthenticated = this.get('session').isAuthenticated;
		if (isAuthenticated) {
			return true;
		}
	}.property('session.isAuthenticated'),

	stepOneNotFinished: function() {
		if (!this.get('stepOneFinished')) {
			return true;
		}
		return null;
	}.property('stepOneFinished'),

	stepTwoFinished: false,

	loginDisabled: Ember.computed('loginModel.email', 'loginModel.password', 'isLoading', function() {
		return Ember.isEmpty(this.get('loginModel.email')) || Ember.isEmpty(this.get('loginModel.password')) || this.get('isLoading');
	}),

	isLoading: null,
	validateOrderIsLoading: null,
	completeOrderIsLoading: null,

	countryStates: function() {
		this.set('order.stateCode', null);
		return this.get('states').filterBy('country', this.get('order.countryCode'));
	}.property('order.countryCode', 'states.[]'),

	isCountryHaveStates: function() {
		return !Ember.isEmpty(this.get('countryStates'));
	}.property('countryStates'),

	actions: {
		authenticate: function() {
			this.set('isLoading', true);
			this.set('errorMessage', null);
			const { identification, password } = this.getProperties('identification', 'password');
			this.get('session').authenticate('authenticator:oauth2', identification, password)
				.then(() => {
					this.set('isLoading', null);
					this.send('reloadAccount');
				},
				(response) => {
					this.get('loginModel').setErrors(response);
					this.set('isLoading', null);
				});
		},
		signUp: function(formValues) {
			var adapter = this.store.adapterFor('sign-up');
			return adapter.ajax('/api/account', 'POST', {data: {account: formValues}});
		},
		setSignUpErrors: function(response){
			this.get('signupModel').setErrors(response);
		},
		logout: function() {
			this.get('session').invalidate();
		},
		validateOrder: function() {
			var self = this;
			var order = this.get('order');
			this.set('validateOrderIsLoading', true);
			$.ajax({
				method: 'PUT',
				url: '/api/order/create',
				dataType: 'json',
				contentType: 'application/json',
				data: JSON.stringify({
					order: {
						first_name: order.get('firstName') || "",
						last_name: order.get('lastName'),
						company_name: order.get('companyName'),
						phone1: order.get('phone1'),
						street1: order.get('street1'),
						street2: order.get('street2'),
						city: order.get('city'),
						postal_code: order.get('postalCode'),
						country_code: order.get('countryCode'),
						state_code: order.get('stateCode')
					}
				})
			})
				.fail(function(err) {
					Ember.warn('fails validateOrder');
					var json = $.parseJSON(err.responseText);
					var validationMessages = _.map(json.errors, function(errors) {
						return errors.join(', ');
					});
					self.set('orderValidationMessages', validationMessages);
				})
				.done(function(/*data*/) {
					Ember.warn('done validateOrder');
					self.set('stepTwoFinished', true);
					self.set('orderValidationMessages', null);
					self.send('goToStepThree');
				})
				.always(function() {
					Ember.warn('always validateOrder');
					self.set('validateOrderIsLoading', null);
				});
			return false;
		},
		completeOrder: function() {
			var self = this;
			var order = this.get('order');
			this.set('completeOrderIsLoading', true);
			$.ajax({
				method: 'PUT',
				url: '/api/order/complete',
				dataType: 'json',
				contentType: 'application/json',
				data: JSON.stringify({
					order: {
						first_name: order.get('firstName') || "",
						last_name: order.get('lastName'),
						company_name: order.get('companyName'),
						phone1: order.get('phone1'),
						street1: order.get('street1'),
						street2: order.get('street2'),
						city: order.get('city'),
						postal_code: order.get('postalCode'),
						country_code: order.get('countryCode'),
						state_code: order.get('stateCode'),
						card_number: order.get('cardNumber'),
						card_type: order.get('cardType'),
						card_verification_number: order.get('cardVerificationNumber'),
						expiration_month: order.get('expirationMonth'),
						expiration_year: order.get('expirationYear'),
						name_on_card: order.get('nameOnCard')
					}
				})
			})
				.fail(function(err) {
					var json = $.parseJSON(err.responseText);
					var validationMessages = _.map(json.errors, function(errors) {
						return errors.join(', ');
					});
					self.set('orderCompleteValidationMessages', validationMessages);
				})
				.done(function(data) {
					self.set('orderCompleteValidationMessages', null);
					var orderId = data.order_id;
					var amount = data.amount_charged;
					var email = self.get('account.email');
					var info = { orderId: orderId, amount: amount, email: email };
					self.set('info', info);
					self.send('reloadAccount');
					self.send('showConfirmation', info);
				})
				.always(function() {
					self.set('completeOrderIsLoading', null);
				});
			return false;
		},
		goToStepOne: function() {
			this.set('isStepOne', true);
			this.set('isStepTwo', false);
			this.set('isStepThree', false);
		},
		goToSignup: function() {
			this.set('isSigninStep', false);
			this.set('errorMessage', null);
		},
		goToSignin: function() {
			this.set('isSigninStep', true);
			this.set('errorMessage', null);
		},
		goToStepTwo: function() {
			if (this.get('stepOneFinished')) {
				this.set('isStepOne', false);
				this.set('isStepTwo', true);
				this.set('isStepThree', false);
			} else {
				Ember.warn('You must finish first step');
			}
		},
		goToStepThree: function() {
			if (this.get('stepTwoFinished')) {
				this.set('isStepOne', false);
				this.set('isStepTwo', false);
				this.set('isStepThree', true);
			} else {
				Ember.warn('You must finish second step');
			}
		},
		reloadAccount: function() {
			if (this.get('session').get('isAuthenticated')) {
				return this.store.findRecord('account', 'me', {reload: true});
			}
			return false;
		}
	}
});
