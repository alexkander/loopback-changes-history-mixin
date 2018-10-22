'use strict';

const assert     = require('assert');
const expect     = require('chai').expect;
const should     = require('chai').should();
const loopback   = require('loopback');
const Promise    = require('bluebird');

const ChangesHistoryMixin = require('../changes-history');

function getApp(opts) {
  
  const app = loopback();
  const ds  = loopback.createDataSource({
    connector: 'memory',
    name:      'ds'
  });

  app.dataSource('ds', ds);

  const Product = ds.createModel('Product', {
    price:       'number',
    amount:      'number',
    description: 'string',
  });

  app.model(Product);

  ChangesHistoryMixin(Product, opts);

  return app;

}

function p(callback) {
  return function () {
    return Promise.resolve()
    .then(() => callback());
  };
}

// SETUP LOOPBACK SERVER END ---------------------------------------------------

describe('#loopback-allowed-properties-mixin', () => {

  describe('Params validations', () => {

    it('fields must be an array', () => {
      try {
        getApp({fields: 'no valid'});
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'fieldMustBeAndArray');
      }
    });

    it('fields must have at least a element', () => {
      try {
        getApp({ fields: [] });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'fieldMustHaveAtLeastAElement');
      }
    });

    it('modelName must be a string', () => {
      try {
        getApp({
          fields: ['price'],
          modelName: false,
        });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'modelNameMusbBeAString');
      }
    });

    it('relationName must be a string', () => {
      try {
        getApp({
          fields: ['price'],
          modelName: 'ProductHistory',
          relationName: false,
        });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'relationNameMustBeAString');
      }
    });

    it('relationParentName must be a string', () => {
      try {
        getApp({
          fields: ['price'],
          modelName: 'ProductHistory',
          relationName: 'customHistory',
          relationParentName: false,
        });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'relationParentNameMustBeAString');
      }
    });

    it('versionFieldName must be a string', () => {
      try {
        getApp({
          fields: ['price'],
          modelName: 'ProductHistory',
          relationName: 'customHistory',
          relationParentName: 'element',
          versionFieldName: false,
        });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'versionFieldNameMustBeAString');
      }
    });

    it('hashFieldName must be a string', () => {
      try {
        getApp({
          fields: ['price'],
          modelName: 'ProductHistory',
          relationName: 'customHistory',
          relationParentName: 'element',
          hashFieldName: false,
        });
        getApp({
          fields: ['price'],
          modelName: 'ProductHistory',
          relationName: 'customHistory',
          relationParentName: 'element',
          hashFieldName: {},
        });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'hashFieldNameMustBeAString');
      }
    });

    it('actionFieldName must be a string', () => {
      try {
        getApp({
          fields: ['price'],
          modelName: 'ProductHistory',
          relationName: 'customHistory',
          relationParentName: 'element',
          actionFieldName: false,
        });
        getApp({
          fields: ['price'],
          modelName: 'ProductHistory',
          relationName: 'customHistory',
          relationParentName: 'element',
          actionFieldName: {},
        });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'actionFieldNameMustBeAString');
      }
    });

    it('updatedFieldName must be a string', () => {
      try {
        getApp({
          fields: ['price'],
          modelName: 'ProductHistory',
          relationName: 'customHistory',
          relationParentName: 'element',
          updatedFieldName: false,
        });
        getApp({
          fields: ['price'],
          modelName: 'ProductHistory',
          relationName: 'customHistory',
          relationParentName: 'element',
          updatedFieldName: {},
        });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'updatedFieldNameMustBeAString');
      }
    });

    it('default setup', () => {
      
      const app = getApp({});

      // ------------------------------
      expect(app.models).to.have.property('Product');

      // Relations
      expect(app.models.Product.relations).to.have.property('history');
      expect(app.models.Product.relations.history.type).to.equal('hasMany');
      expect(app.models.Product.relations.history.keyTo).to.equal('id');
      
      // Properties
      expect(app.models.Product.definition.properties).to.have.property('_version');
      expect(app.models.Product.definition.properties).to.have.property('_hash');
      // Properties types
      expect(app.models.Product.definition.properties._version.type).to.equal(String);
      expect(app.models.Product.definition.properties._hash.type).to.equal(String);

      // ------------------------------
      expect(app.models).to.have.property('Product_history');

      // Relations
      expect(app.models.Product_history.relations).to.have.property('_record');
      expect(app.models.Product_history.relations._record.type).to.equal('belongsTo');
      expect(app.models.Product_history.relations._record.keyFrom).to.equal('id');
      // Properties
      expect(app.models.Product_history.definition.properties).to.have.property('_version');
      expect(app.models.Product_history.definition.properties).to.have.property('_hash');
      expect(app.models.Product_history.definition.properties).to.have.property('_action');
      expect(app.models.Product_history.definition.properties).to.have.property('_update');
      expect(app.models.Product_history.definition.properties).to.have.property('price');
      expect(app.models.Product_history.definition.properties).to.have.property('amount');
      expect(app.models.Product_history.definition.properties).to.have.property('description');
      // Properties types
      expect(app.models.Product_history.definition.properties._version.type).to.equal(String);
      expect(app.models.Product_history.definition.properties._hash.type).to.equal(String);
      expect(app.models.Product_history.definition.properties._action.type).to.equal(String);
      expect(app.models.Product_history.definition.properties._update.type).to.equal(Date);
      expect(app.models.Product_history.definition.properties.price.type).to.equal(Number);
      expect(app.models.Product_history.definition.properties.amount.type).to.equal(Number);
      expect(app.models.Product_history.definition.properties.description.type).to.equal(String);

    });

    it('custom setup', () => {
      
      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        versionFieldName:   'version',
        hashFieldName:      'versionHash',
        actionFieldName:    'eventName',
        updatedFieldName:   'updatedAt',
      });

      // ------------------------------
      expect(app.models).to.have.property('Product');

      // Relations
      expect(app.models.Product.relations).to.have.property('customHistory');
      expect(app.models.Product.relations.customHistory.type).to.equal('hasMany');
      expect(app.models.Product.relations.customHistory.keyTo).to.equal('id');
      
      // Properties
      expect(app.models.Product.definition.properties).to.have.property('version');
      expect(app.models.Product.definition.properties).to.have.property('versionHash');
      // Properties types
      expect(app.models.Product.definition.properties.version.type).to.equal(String);
      expect(app.models.Product.definition.properties.versionHash.type).to.equal(String);

      // ------------------------------
      expect(app.models).to.have.property('ProductChanges');

      // Relations
      expect(app.models.ProductChanges.relations).to.have.property('element');
      expect(app.models.ProductChanges.relations.element.type).to.equal('belongsTo');
      expect(app.models.ProductChanges.relations.element.keyFrom).to.equal('id');
      // Properties
      expect(app.models.ProductChanges.definition.properties).to.have.property('version');
      expect(app.models.ProductChanges.definition.properties).to.have.property('versionHash');
      expect(app.models.ProductChanges.definition.properties).to.have.property('eventName');
      expect(app.models.ProductChanges.definition.properties).to.have.property('updatedAt');
      expect(app.models.ProductChanges.definition.properties).to.have.property('price');
      expect(app.models.ProductChanges.definition.properties).to.have.not.property('amount');
      expect(app.models.ProductChanges.definition.properties).to.have.not.property('description');
      // Properties types
      expect(app.models.ProductChanges.definition.properties.version.type).to.equal(String);
      expect(app.models.ProductChanges.definition.properties.versionHash.type).to.equal(String);
      expect(app.models.ProductChanges.definition.properties.eventName.type).to.equal(String);
      expect(app.models.ProductChanges.definition.properties.updatedAt.type).to.equal(Date);
      expect(app.models.ProductChanges.definition.properties.price.type).to.equal(Number);

    });

    it('custom min setup', () => {
      
      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        versionFieldName:   'version',
        hashFieldName:      false,
        actionFieldName:    false,
        updatedFieldName:   false,
      });

      // ------------------------------
      expect(app.models).to.have.property('Product');

      // Relations
      expect(app.models.Product.relations).to.have.property('customHistory');
      expect(app.models.Product.relations.customHistory.type).to.equal('hasMany');
      expect(app.models.Product.relations.customHistory.keyTo).to.equal('id');
      // Properties
      expect(app.models.Product.definition.properties).to.have.property('version');
      expect(app.models.Product.definition.properties).to.have.not.property('versionHash');
      // Properties types
      expect(app.models.Product.definition.properties.version.type).to.equal(String);

      // ------------------------------
      expect(app.models).to.have.property('ProductChanges');

      // Relations
      expect(app.models.ProductChanges.relations).to.have.property('element');
      expect(app.models.ProductChanges.relations.element.type).to.equal('belongsTo');
      expect(app.models.ProductChanges.relations.element.keyFrom).to.equal('id');
      // Properties
      expect(app.models.ProductChanges.definition.properties).to.have.property('version');
      expect(app.models.ProductChanges.definition.properties).to.have.not.property('versionHash');
      expect(app.models.ProductChanges.definition.properties).to.have.not.property('eventName');
      expect(app.models.ProductChanges.definition.properties).to.have.not.property('updatedAt');
      expect(app.models.ProductChanges.definition.properties).to.have.property('price');
      expect(app.models.ProductChanges.definition.properties).to.have.not.property('amount');
      expect(app.models.ProductChanges.definition.properties).to.have.not.property('description');
      // Properties types
      expect(app.models.ProductChanges.definition.properties.version.type).to.equal(String);
      expect(app.models.ProductChanges.definition.properties.price.type).to.equal(Number);

    });

  });

  describe.skip('prototype.updateAttribute', () => {});

  describe.skip('prototype.updateAttributes', () => {});
  
  describe.skip('updateAll', () => {});

  describe.skip('upsert', () => {});

});