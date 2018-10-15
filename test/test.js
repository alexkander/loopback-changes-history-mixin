'use strict';

const assert     = require('assert');
const expect     = require('chai').expect;
const should     = require('chai').should();
const loopback   = require('loopback');
const Promise    = require('bluebird');

// metodos que faltan probar
// destroyAll
// destroyById
// replaceById
// replaceOrCreate
// upsert
// upsertWithWhere
// prototype.destroy
// prototype.replaceAtributes

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

    it('relationForeignKey must be a string', () => {
      try {
        getApp({
          fields: ['price'],
          modelName: 'ProductHistory',
          relationName: 'customHistory',
          relationParentName: 'element',
          relationForeignKey: false,
        });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'relationForeignKeyMustBeAString');
      }
    });

    it('versionFieldName must be a string', () => {
      try {
        getApp({
          fields: ['price'],
          modelName: 'ProductHistory',
          relationName: 'customHistory',
          relationParentName: 'element',
          relationForeignKey: 'elementId',
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
          relationForeignKey: 'elementId',
          hashFieldName: false,
        });
        getApp({
          fields: ['price'],
          modelName: 'ProductHistory',
          relationName: 'customHistory',
          relationParentName: 'element',
          relationForeignKey: 'elementId',
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
          relationForeignKey: 'elementId',
          actionFieldName: false,
        });
        getApp({
          fields: ['price'],
          modelName: 'ProductHistory',
          relationName: 'customHistory',
          relationParentName: 'element',
          relationForeignKey: 'elementId',
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
          relationForeignKey: 'elementId',
          updatedFieldName: false,
        });
        getApp({
          fields: ['price'],
          modelName: 'ProductHistory',
          relationName: 'customHistory',
          relationParentName: 'element',
          relationForeignKey: 'elementId',
          updatedFieldName: {},
        });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'updatedFieldNameMustBeAString');
      }
    });

  });

  describe('prototype.save', () => {

    describe('setup without versionHash param', () => {

      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        hashFieldName:      false,
        actionFieldName:    'eventName',
        updatedFieldName:   'updatedAt',
      });

      it('properties definitions', () => {
        expect(app.models).to.have.property('Product');
        expect(app.models).to.have.property('ProductChanges');
        expect(app.models.Product.relations).to.have.property('customHistory');
        app.models.Product.relations.customHistory.type.should.equal('hasMany');
        app.models.Product.relations.customHistory.keyTo.should.equal('elementId');
        expect(app.models.Product.definition.properties).to.have.property('version');
        should.not.exist(app.models.Product.definition.properties.versionHash);
        app.models.Product.definition.properties.version.type.should.equal(String);
        expect(app.models.ProductChanges.relations).to.have.property('element');
        app.models.ProductChanges.relations.element.type.should.equal('belongsTo');
        app.models.ProductChanges.relations.element.keyFrom.should.equal('elementId');
        expect(app.models.ProductChanges.definition.properties).to.have.property('version');
        should.not.exist(app.models.ProductChanges.definition.properties.versionHash);
        expect(app.models.ProductChanges.definition.properties).to.have.property('eventName');
        expect(app.models.ProductChanges.definition.properties).to.have.property('updatedAt');
        app.models.ProductChanges.definition.properties.version.type.should.equal(String);
        app.models.ProductChanges.definition.properties.eventName.type.should.equal(String);
        app.models.ProductChanges.definition.properties.updatedAt.type.should.equal(Date);
        expect(app.models.ProductChanges.definition.properties).to.have.property('price');
      });

      it('Not changes', p(() => {
        return app.models.ProductChanges.count({})
        .then((count) => {
          count.should.equal(0);
        })
      }));

      it('Create changes history', p(() => {
        return app.models.Product.create({
          price: 100,
          amount: 10,
          description: 'product description',
        })
        .then((record) => {
          expect(record).to.have.property('price');
          expect(record).to.have.property('amount');
          expect(record).to.have.property('description');
          expect(record).to.have.property('version');
          should.not.exist(record.versionHash);
          record.version.should.be.a('string');
          return record.customHistory.count()
          .then((count) => {
            count.should.equal(1);
            return record.customHistory.findOne({ order: 'id desc' });
          })
          .then((change1) => {
            expect(change1).to.have.property('version');
            should.not.exist(change1.versionHash);
            expect(change1).to.have.property('eventName');
            expect(change1).to.have.property('updatedAt');
            should.not.exist(change1.amount);
            should.not.exist(change1.description);
            change1.version.should.be.a('string');
            change1.eventName.should.be.a('string');
            change1.updatedAt.should.be.a('date');
            change1.eventName.should.equal('create');
            change1.elementId.should.equal(record.id);
            change1.version.should.equal(record.version);
            return change1.element.get({})
            .then((element) => {
              record.version.should.equal(element.version);
              record.amount--;
              record.description = 'new product description';
              return record.save();
            })
            .then(() => {
              return record.customHistory.count()
            })
            .then((count) => {
              count.should.equal(2);
              record.price = 200;
              return record.save();
            })
            .then(() => {
              return record.customHistory.count()
            })
            .then((count) => {
              count.should.equal(3);
              return record.customHistory.findOne({ order: 'id desc' });
            })
            .then((change2) => {
              change2.eventName.should.equal('update');
              change2.elementId.should.equal(record.id);
              change2.version.should.equal(record.version);
              change1.elementId.should.equal(record.id);
              change1.version.should.not.equal(record.version);
            });
          })
        });
      }));

    });

    describe('setup without actionFieldName param', () => {

      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        hashFieldName:      'versionHash',
        actionFieldName:    false,
        updatedFieldName:   'updatedAt',
      });

      it('properties definitions', () => {
        expect(app.models).to.have.property('Product');
        expect(app.models).to.have.property('ProductChanges');
        expect(app.models.Product.relations).to.have.property('customHistory');
        app.models.Product.relations.customHistory.type.should.equal('hasMany');
        app.models.Product.relations.customHistory.keyTo.should.equal('elementId');
        expect(app.models.Product.definition.properties).to.have.property('version');
        expect(app.models.Product.definition.properties).to.have.property('versionHash');
        app.models.Product.definition.properties.version.type.should.equal(String);
        app.models.Product.definition.properties.versionHash.type.should.equal(String);
        expect(app.models.ProductChanges.relations).to.have.property('element');
        app.models.ProductChanges.relations.element.type.should.equal('belongsTo');
        app.models.ProductChanges.relations.element.keyFrom.should.equal('elementId');
        expect(app.models.ProductChanges.definition.properties).to.have.property('version');
        expect(app.models.ProductChanges.definition.properties).to.have.property('versionHash');
        should.not.exist(app.models.ProductChanges.definition.properties.eventName);
        expect(app.models.ProductChanges.definition.properties).to.have.property('updatedAt');
        app.models.ProductChanges.definition.properties.version.type.should.equal(String);
        app.models.ProductChanges.definition.properties.versionHash.type.should.equal(String);
        app.models.ProductChanges.definition.properties.updatedAt.type.should.equal(Date);
        expect(app.models.ProductChanges.definition.properties).to.have.property('price');
      });

      it('Not changes', p(() => {
        return app.models.ProductChanges.count({})
        .then((count) => {
          count.should.equal(0);
        })
      }));

      it('Create changes history', p(() => {
        return app.models.Product.create({
          price: 100,
          amount: 10,
          description: 'product description',
        })
        .then((record) => {
          expect(record).to.have.property('price');
          expect(record).to.have.property('amount');
          expect(record).to.have.property('description');
          expect(record).to.have.property('version');
          expect(record).to.have.property('versionHash');
          record.version.should.be.a('string');
          record.versionHash.should.be.a('string');
          return record.customHistory.count()
          .then((count) => {
            count.should.equal(1);
            return record.customHistory.findOne({ order: 'id desc' });
          })
          .then((change1) => {
            expect(change1).to.have.property('version');
            expect(change1).to.have.property('versionHash');
            should.not.exist(change1.eventName);
            expect(change1).to.have.property('updatedAt');
            should.not.exist(change1.amount);
            should.not.exist(change1.description);
            change1.version.should.be.a('string');
            change1.versionHash.should.be.a('string');
            change1.updatedAt.should.be.a('date');
            change1.elementId.should.equal(record.id);
            change1.version.should.equal(record.version);
            change1.versionHash.should.equal(record.versionHash);
            return change1.element.get({})
            .then((element) => {
              record.version.should.equal(element.version);
              record.versionHash.should.equal(element.versionHash);
              record.amount--;
              record.description = 'new product description';
              return record.save();
            })
            .then(() => {
              return record.customHistory.count()
            })
            .then((count) => {
              count.should.equal(1);
              record.price = 200;
              return record.save();
            })
            .then(() => {
              return record.customHistory.count()
            })
            .then((count) => {
              count.should.equal(2);
              return record.customHistory.findOne({ order: 'id desc' });
            })
            .then((change2) => {
              change2.elementId.should.equal(record.id);
              change2.version.should.equal(record.version);
              change2.versionHash.should.equal(record.versionHash);
              change1.elementId.should.equal(record.id);
              change1.version.should.not.equal(record.version);
              change1.versionHash.should.not.equal(record.versionHash);
            });
          })
        });
      }));

    });

    describe('setup without updatedFieldName param', () => {

      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        hashFieldName:      'versionHash',
        actionFieldName:    'eventName',
        updatedFieldName:   false,
      });

      it('properties definitions', () => {
        expect(app.models).to.have.property('Product');
        expect(app.models).to.have.property('ProductChanges');
        expect(app.models.Product.relations).to.have.property('customHistory');
        app.models.Product.relations.customHistory.type.should.equal('hasMany');
        app.models.Product.relations.customHistory.keyTo.should.equal('elementId');
        expect(app.models.Product.definition.properties).to.have.property('version');
        expect(app.models.Product.definition.properties).to.have.property('versionHash');
        app.models.Product.definition.properties.version.type.should.equal(String);
        app.models.Product.definition.properties.versionHash.type.should.equal(String);
        expect(app.models.ProductChanges.relations).to.have.property('element');
        app.models.ProductChanges.relations.element.type.should.equal('belongsTo');
        app.models.ProductChanges.relations.element.keyFrom.should.equal('elementId');
        expect(app.models.ProductChanges.definition.properties).to.have.property('version');
        expect(app.models.ProductChanges.definition.properties).to.have.property('versionHash');
        expect(app.models.ProductChanges.definition.properties).to.have.property('eventName');
        should.not.exist(app.models.ProductChanges.definition.properties.updatedAt);
        app.models.ProductChanges.definition.properties.version.type.should.equal(String);
        app.models.ProductChanges.definition.properties.versionHash.type.should.equal(String);
        app.models.ProductChanges.definition.properties.eventName.type.should.equal(String);
        expect(app.models.ProductChanges.definition.properties).to.have.property('price');
      });

      it('Not changes', p(() => {
        return app.models.ProductChanges.count({})
        .then((count) => {
          count.should.equal(0);
        })
      }));

      it('Create changes history', p(() => {
        return app.models.Product.create({
          price: 100,
          amount: 10,
          description: 'product description',
        })
        .then((record) => {
          expect(record).to.have.property('price');
          expect(record).to.have.property('amount');
          expect(record).to.have.property('description');
          expect(record).to.have.property('version');
          expect(record).to.have.property('versionHash');
          record.version.should.be.a('string');
          record.versionHash.should.be.a('string');
          return record.customHistory.count()
          .then((count) => {
            count.should.equal(1);
            return record.customHistory.findOne({ order: 'id desc' });
          })
          .then((change1) => {
            expect(change1).to.have.property('version');
            expect(change1).to.have.property('versionHash');
            expect(change1).to.have.property('eventName');
            should.not.exist(change1.updatedAt);
            should.not.exist(change1.amount);
            should.not.exist(change1.description);
            change1.version.should.be.a('string');
            change1.versionHash.should.be.a('string');
            change1.eventName.should.be.a('string');
            change1.eventName.should.equal('create');
            change1.elementId.should.equal(record.id);
            change1.version.should.equal(record.version);
            change1.versionHash.should.equal(record.versionHash);
            return change1.element.get({})
            .then((element) => {
              record.version.should.equal(element.version);
              record.versionHash.should.equal(element.versionHash);
              record.amount--;
              record.description = 'new product description';
              return record.save();
            })
            .then(() => {
              return record.customHistory.count()
            })
            .then((count) => {
              count.should.equal(1);
              record.price = 200;
              return record.save();
            })
            .then(() => {
              return record.customHistory.count()
            })
            .then((count) => {
              count.should.equal(2);
              return record.customHistory.findOne({ order: 'id desc' });
            })
            .then((change2) => {
              change2.eventName.should.equal('update');
              change2.elementId.should.equal(record.id);
              change2.version.should.equal(record.version);
              change2.versionHash.should.equal(record.versionHash);
              change1.elementId.should.equal(record.id);
              change1.version.should.not.equal(record.version);
              change1.versionHash.should.not.equal(record.versionHash);
            });
          })
        });
      }));

    });

    describe('setup with all params', () => {

      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        hashFieldName:      'versionHash',
        actionFieldName:    'eventName',
        updatedFieldName:   'updatedAt',
      });

      it('properties definitions', () => {
        expect(app.models).to.have.property('Product');
        expect(app.models).to.have.property('ProductChanges');
        expect(app.models.Product.relations).to.have.property('customHistory');
        app.models.Product.relations.customHistory.type.should.equal('hasMany');
        app.models.Product.relations.customHistory.keyTo.should.equal('elementId');
        expect(app.models.Product.definition.properties).to.have.property('version');
        expect(app.models.Product.definition.properties).to.have.property('versionHash');
        app.models.Product.definition.properties.version.type.should.equal(String);
        app.models.Product.definition.properties.versionHash.type.should.equal(String);
        expect(app.models.ProductChanges.relations).to.have.property('element');
        app.models.ProductChanges.relations.element.type.should.equal('belongsTo');
        app.models.ProductChanges.relations.element.keyFrom.should.equal('elementId');
        expect(app.models.ProductChanges.definition.properties).to.have.property('version');
        expect(app.models.ProductChanges.definition.properties).to.have.property('versionHash');
        expect(app.models.ProductChanges.definition.properties).to.have.property('eventName');
        expect(app.models.ProductChanges.definition.properties).to.have.property('updatedAt');
        app.models.ProductChanges.definition.properties.version.type.should.equal(String);
        app.models.ProductChanges.definition.properties.versionHash.type.should.equal(String);
        app.models.ProductChanges.definition.properties.eventName.type.should.equal(String);
        app.models.ProductChanges.definition.properties.updatedAt.type.should.equal(Date);
        expect(app.models.ProductChanges.definition.properties).to.have.property('price');
      });

      it('Not changes', p(() => {
        return app.models.ProductChanges.count({})
        .then((count) => {
          count.should.equal(0);
        })
      }));

      it('Create changes history', p(() => {
        return app.models.Product.create({
          price: 100,
          amount: 10,
          description: 'product description',
        })
        .then((record) => {
          expect(record).to.have.property('price');
          expect(record).to.have.property('amount');
          expect(record).to.have.property('description');
          expect(record).to.have.property('version');
          expect(record).to.have.property('versionHash');
          record.version.should.be.a('string');
          record.versionHash.should.be.a('string');
          return record.customHistory.count()
          .then((count) => {
            count.should.equal(1);
            return record.customHistory.findOne({ order: 'id desc' });
          })
          .then((change1) => {
            expect(change1).to.have.property('version');
            expect(change1).to.have.property('versionHash');
            expect(change1).to.have.property('eventName');
            expect(change1).to.have.property('updatedAt');
            should.not.exist(change1.amount);
            should.not.exist(change1.description);
            change1.version.should.be.a('string');
            change1.versionHash.should.be.a('string');
            change1.eventName.should.be.a('string');
            change1.updatedAt.should.be.a('date');
            change1.eventName.should.equal('create');
            change1.elementId.should.equal(record.id);
            change1.version.should.equal(record.version);
            change1.versionHash.should.equal(record.versionHash);
            return change1.element.get({})
            .then((element) => {
              record.version.should.equal(element.version);
              record.versionHash.should.equal(element.versionHash);
              record.amount--;
              record.description = 'new product description';
              return record.save();
            })
            .then(() => {
              return record.customHistory.count()
            })
            .then((count) => {
              count.should.equal(1);
              record.price = 200;
              return record.save();
            })
            .then(() => {
              return record.customHistory.count()
            })
            .then((count) => {
              count.should.equal(2);
              return record.customHistory.findOne({ order: 'id desc' });
            })
            .then((change2) => {
              change2.eventName.should.equal('update');
              change2.elementId.should.equal(record.id);
              change2.version.should.equal(record.version);
              change2.versionHash.should.equal(record.versionHash);
              change1.elementId.should.equal(record.id);
              change1.version.should.not.equal(record.version);
              change1.versionHash.should.not.equal(record.versionHash);
            });
          })
        });
      }));

    });

  });

  describe('prototype.updateAttribute', () => {

    it('setup without versionHash param', p(() => {
      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        hashFieldName:      false,
        actionFieldName:    'eventName',
        updatedFieldName:   'updatedAt',
      });
      return app.models.Product.create({
        price: 100,
        amount: 10,
        description: 'product description',
      })
      .then((record) => {
        return record.customHistory.findOne({ order: 'id desc' })
        .then((change1) => {
          return record.updateAttribute('description', 'new product description')
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(2);
            return record.updateAttribute('price', 200);
          })
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(3);
            return record.customHistory.findOne({ order: 'id desc' });
          })
          .then((change2) => {
            change2.eventName.should.equal('update');
            change2.elementId.should.equal(record.id);
            change2.version.should.equal(record.version);
            change1.elementId.should.equal(record.id);
            change1.version.should.not.equal(record.version);
          });
        })
      });
    }));

    it('setup without actionFieldName param', p(() => {
      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        hashFieldName:      'versionHash',
        actionFieldName:    false,
        updatedFieldName:   'updatedAt',
      });
      return app.models.Product.create({
        price: 100,
        amount: 10,
        description: 'product description',
      })
      .then((record) => {
        return record.customHistory.findOne({ order: 'id desc' })
        .then((change1) => {
          return record.updateAttribute('description', 'new product description')
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(1);
            return record.updateAttribute('price', 200);
          })
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(2);
            return record.customHistory.findOne({ order: 'id desc' });
          })
          .then((change2) => {
            change2.elementId.should.equal(record.id);
            change2.version.should.equal(record.version);
            change2.versionHash.should.equal(record.versionHash);
            change1.elementId.should.equal(record.id);
            change1.version.should.not.equal(record.version);
            change1.versionHash.should.not.equal(record.versionHash);
          });
        })
      });
    }));

    it('setup without updatedFieldName param', p(() => {
      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        hashFieldName:      'versionHash',
        actionFieldName:    'eventName',
        updatedFieldName:   false,
      });
      return app.models.Product.create({
        price: 100,
        amount: 10,
        description: 'product description',
      })
      .then((record) => {
        return record.customHistory.findOne({ order: 'id desc' })
        .then((change1) => {
          return record.updateAttribute('description', 'new product description')
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(1);
            return record.updateAttribute('price', 200);
          })
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(2);
            return record.customHistory.findOne({ order: 'id desc' });
          })
          .then((change2) => {
            change2.eventName.should.equal('update');
            change2.elementId.should.equal(record.id);
            change2.version.should.equal(record.version);
            change2.versionHash.should.equal(record.versionHash);
            change1.elementId.should.equal(record.id);
            change1.version.should.not.equal(record.version);
            change1.versionHash.should.not.equal(record.versionHash);
          });
        })
      });
    }));

    it('setup with all params', p(() => {
      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        hashFieldName:      'versionHash',
        actionFieldName:    'eventName',
        updatedFieldName:   'updatedAt',
      });
      return app.models.Product.create({
        price: 100,
        amount: 10,
        description: 'product description',
      })
      .then((record) => {
        return record.customHistory.findOne({ order: 'id desc' })
        .then((change1) => {
          return record.updateAttribute('description', 'new product description')
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(1);
            return record.updateAttribute('price', 200);
          })
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(2);
            return record.customHistory.findOne({ order: 'id desc' });
          })
          .then((change2) => {
            change2.eventName.should.equal('update');
            change2.elementId.should.equal(record.id);
            change2.version.should.equal(record.version);
            change2.versionHash.should.equal(record.versionHash);
            change1.elementId.should.equal(record.id);
            change1.version.should.not.equal(record.version);
            change1.versionHash.should.not.equal(record.versionHash);
          });
        })
      });
    }));

  });

  describe('prototype.updateAttributes', () => {

    it('setup without versionHash param', p(() => {
      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        hashFieldName:      false,
        actionFieldName:    'eventName',
        updatedFieldName:   'updatedAt',
      });
      return app.models.Product.create({
        price: 100,
        amount: 10,
        description: 'product description',
      })
      .then((record) => {
        return record.customHistory.findOne({ order: 'id desc' })
        .then((change1) => {
          return record.updateAttributes({
            amount: record.amount-1,
            description: 'new product description',
          })
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(2);
            return record.updateAttributes({
              price: 200
            });
          })
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(3);
            return record.customHistory.findOne({ order: 'id desc' });
          })
          .then((change2) => {
            change2.eventName.should.equal('update');
            change2.elementId.should.equal(record.id);
            change2.version.should.equal(record.version);
            change1.elementId.should.equal(record.id);
            change1.version.should.not.equal(record.version);
          });
        })
      });
    }));

    it('setup without actionFieldName param', p(() => {
      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        hashFieldName:      'versionHash',
        actionFieldName:    false,
        updatedFieldName:   'updatedAt',
      });
      return app.models.Product.create({
        price: 100,
        amount: 10,
        description: 'product description',
      })
      .then((record) => {
        return record.customHistory.findOne({ order: 'id desc' })
        .then((change1) => {
          return record.updateAttributes({
            amount: record.amount-1,
            description: 'new product description',
          })
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(1);
            record.price = 200;
            return record.updateAttributes({
              price: 200,
            });
          })
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(2);
            return record.customHistory.findOne({ order: 'id desc' });
          })
          .then((change2) => {
            change2.elementId.should.equal(record.id);
            change2.version.should.equal(record.version);
            change2.versionHash.should.equal(record.versionHash);
            change1.elementId.should.equal(record.id);
            change1.version.should.not.equal(record.version);
            change1.versionHash.should.not.equal(record.versionHash);
          });
        })
      });
    }));

    it('setup without updatedFieldName param', p(() => {
      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        hashFieldName:      'versionHash',
        actionFieldName:    'eventName',
        updatedFieldName:   false,
      });
      return app.models.Product.create({
        price: 100,
        amount: 10,
        description: 'product description',
      })
      .then((record) => {
        return record.customHistory.findOne({ order: 'id desc' })
        .then((change1) => {
          return record.updateAttributes({
            amount: record.amount-1,
            description: 'new product description',
          })
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(1);
            return record.updateAttributes({
              price: 200
            });
          })
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(2);
            return record.customHistory.findOne({ order: 'id desc' });
          })
          .then((change2) => {
            change2.eventName.should.equal('update');
            change2.elementId.should.equal(record.id);
            change2.version.should.equal(record.version);
            change2.versionHash.should.equal(record.versionHash);
            change1.elementId.should.equal(record.id);
            change1.version.should.not.equal(record.version);
            change1.versionHash.should.not.equal(record.versionHash);
          });
        })
      });
    }));

    it('setup with all params', p(() => {
      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        hashFieldName:      'versionHash',
        actionFieldName:    'eventName',
        updatedFieldName:   'updatedAt',
      });
      return app.models.Product.create({
        price: 100,
        amount: 10,
        description: 'product description',
      })
      .then((record) => {
        return record.customHistory.findOne({ order: 'id desc' })
        .then((change1) => {
          return record.updateAttributes({
            amount: record.amount-1,
            description: 'new product description',
          })
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(1);
            return record.updateAttributes({
              price: 200
            });
          })
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(2);
            return record.customHistory.findOne({ order: 'id desc' });
          })
          .then((change2) => {
            change2.eventName.should.equal('update');
            change2.elementId.should.equal(record.id);
            change2.version.should.equal(record.version);
            change2.versionHash.should.equal(record.versionHash);
            change1.elementId.should.equal(record.id);
            change1.version.should.not.equal(record.version);
            change1.versionHash.should.not.equal(record.versionHash);
          });
        })
      });
    }));

  });
  
  describe('updateAll', () => {
    it('does not generate history changes', p(() => {
      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        hashFieldName:      'versionHash',
        actionFieldName:    'eventName',
        updatedFieldName:   'updatedAt',
      });
      return app.models.Product.create({
        price: 100,
        amount: 10,
        description: 'product description',
      })
      .then((record) => {
        return app.models.Product.updateAll({
          id: record.id
        }, {
          price: 200
        })
        .then(() => {
          return record.customHistory.count()
        })
        .then((count) => {
          count.should.equal(1);
        });
      });
    }));
  });

  describe('upsert', () => {
    it('generate history changes', p(() => {
      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        hashFieldName:      'versionHash',
        actionFieldName:    'eventName',
        updatedFieldName:   'updatedAt',
      });
      return app.models.Product.upsert({
        price: 100,
        amount: 10,
        description: 'product description',
      })
      .then(() => {
        return app.models.Product.findOne({});
      })
      .then((record) => {
        expect(record).to.have.property('price');
        expect(record).to.have.property('amount');
        expect(record).to.have.property('description');
        expect(record).to.have.property('version');
        expect(record).to.have.property('versionHash');
        record.version.should.be.a('string');
        record.versionHash.should.be.a('string');
        return record.customHistory.count()
        .then((count) => {
          count.should.equal(1);
          return record.customHistory.findOne({ order: 'id desc' });
        })
        .then((change1) => {
          expect(change1).to.have.property('version');
          expect(change1).to.have.property('versionHash');
          expect(change1).to.have.property('eventName');
          expect(change1).to.have.property('updatedAt');
          should.not.exist(change1.amount);
          should.not.exist(change1.description);
          change1.version.should.be.a('string');
          change1.versionHash.should.be.a('string');
          change1.eventName.should.be.a('string');
          change1.updatedAt.should.be.a('date');
          change1.eventName.should.equal('create');
          change1.elementId.should.equal(record.id);
          change1.version.should.equal(record.version);
          change1.versionHash.should.equal(record.versionHash);
          return change1.element.get({})
          .then((element) => {
            record.version.should.equal(element.version);
            record.versionHash.should.equal(element.versionHash);
            return app.models.Product.upsert({
              id: record.id,
              amount: record.amount-1,
              description: 'new product description'
            });
          })
          .then(() => {
            return record.customHistory.count()
          })
          .then((count) => {
            count.should.equal(1);
            return app.models.Product.upsert({
              id: record.id,
              price: 200
            });
          })
          .then(() => {
            return app.models.Product.findOne({});
          })
          .then((record) => {
            return record.customHistory.count()
            .then((count) => {
              count.should.equal(2);
              return record.customHistory.findOne({ order: 'id desc' });
            })
            .then((change2) => {
              change2.eventName.should.equal('update');
              change2.elementId.should.equal(record.id);
              change2.version.should.equal(record.version);
              change2.versionHash.should.equal(record.versionHash);
              change1.elementId.should.equal(record.id);
              change1.version.should.not.equal(record.version);
              change1.versionHash.should.not.equal(record.versionHash);
            });
          })
        })
      });
    }));
  });

});