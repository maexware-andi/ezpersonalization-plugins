//{namespace name=backend/yoochoose/view/general_settings}
//{block name="backend/yoochoose/view/general_settings"}
Ext.define('Shopware.apps.Yoochoose.view.GeneralSettings', {
    extend: 'Ext.form.FieldSet',
    alias: 'widget.general-settings',
    collapsible: true,
    collapsed: false,
    hidden: false,
    width: '100%',
    margin: 5,
    autoScroll: true,
    border: true,
    defaults: {
        labelWidth: 160,
        anchor: '100%'
    },
    snippets: {
        title: '{s name=general/title}General Settings{/s}'
    },
    initComponent: function () {
        var me = this;

        me.title = me.snippets.title;
        me.items = me.createForm();
        me.registerEvents();

        me.callParent(arguments);
    },
    registerEvents: function () {
        this.addEvents(
                'registerNewUser'
                );
        this.addEvents(
                'configureYoochoose'
                );
    },
    createForm: function () {
        var me = this,
            data = me.record[0].data, 
            customerLink = data.customerId ? '/?customer_id=' + data.customerId : '';

        return [
            {
                xtype: 'button',
                fieldLabel: 'If you don\'t have a Customer ID yet please',
                text: 'Click here to register new Yoochoose account',
                style: 'margin-bottom: 5px',
                handler: function () {
                    me.fireEvent('registerNewUser');
                }
            },
            Ext.create('Ext.form.field.Text', {
                name: 'customerId',
                fieldLabel: 'Customer ID',
                minWidth: 250,
                allowBlank: false,
                blankText: 'This field is required',
                required: true,
                value: data.customerId ? data.customerId : null,
                listeners: {
                    'change': function(){
                        var customerLink = document.getElementById('yoochoose-admin-link'), 
                            newCustomerId = arguments[1];

                        customerLink.href = customerLink.href.replace(/(.*=)(\d*)/g, function () {
                            return arguments[1] + newCustomerId;
                        });
                    }
                  }
            }),
            Ext.create('Ext.form.field.Text', {
                name: 'licenseKey',
                fieldLabel: 'License Key',
                minWidth: 250,
                allowBlank: false,
                blankText: 'This field is required',
                required: true,
                helpText: 'Type plugin name, required field',
                supportText: 'You can find you license key and detailed statistics on the\n\
                             <a id="yoochoose-admin-link" href=" https://admin.yoochoose.net' + customerLink + '" target="_blank">Yoochoose Configuration Backend</a>',
                value: data.licenseKey
            }),
            Ext.create('Ext.form.field.Text', {
                name: 'pluginId',
                fieldLabel: 'Plugin ID',
                minWidth: 250,
                allowBlank: true,
                supportText: '(optional) if all you shop views have the same design leave it blank.',
                value: data.pluginId
            }),
            Ext.create('Ext.form.field.Text', {
                name: 'endpoint',
                fieldLabel: 'Endpoint',
                minWidth: 250,
                allowBlank: true,
                blankText: 'This field is required',
                required: false,
                readOnly: true,
                helpText: 'Type http://',
                value: data.endpoint
            }),
            Ext.create('Ext.form.field.Text', {
                name: 'design',
                fieldLabel: 'Design',
                minWidth: 250,
                allowBlank: true,
                blankText: 'This field is required',
                required: false,
                readOnly: true,
                helpText: 'Type plugin name, required field',
                supportText: 'We will try a design template for your shop.\n\
                              Please read <a href="https://doc.yoochoose.net/display/PUBDOC/Shopware+Plugin+2.0+Tutorial" target="_blank">Shopware Connect Extension Tutorial</a>,\n\
                              if you need to customize the design of the recommendations.',
                value: data.design
            }),
//            Ext.create('Ext.form.field.ComboBox', {
//                id: 'locale',
//                fieldLabel: 'Language',
//                name: 'language',
//                typeAhead: false,
//                transform: 'stateSelect',
//                width: 135,
//                forceSelection: false,
//                queryMode: 'remote',
//                displayField: 'name',
//                valueField: 'locale',
//                editable: true,
//                required: true,
//                helpTitle: 'Notification',
//                allowBlank: false,
//                store: 'base.Locale',
//                value: data.locale,
//                listeners: {
//                    beforerender: function () {
//                        this.store.load();
//                    }
//                }
//            }),
            {
                xtype: 'checkbox',
                fieldLabel: 'Include the country code into the language.',
                inputValue: true,
                uncheckedValue: false,
                name: 'useCountry',
                labelWidth: 260,
                helpText: 'Include the country code into the language',
                helpTitle: 'Notification',
                listeners: {
                    afterrender: function () {
                        this.setValue(data.useCountry);
                    }
                }
            }
        ];
    }
});
//{/block}