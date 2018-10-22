'use strict';

const assert   = require('assert');
const expect   = require('chai').expect;
const should   = require('chai').should();
const loopback = require('loopback');
const Promise  = require('bluebird');

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
        getApp({ fields: 'no valid' });
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
        getApp({ modelName: false });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'modelNameMusbBeAString');
      }
    });

    it('relationName must be a string', () => {
      try {
        getApp({ relationName: false });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'relationNameMustBeAString');
      }
    });

    it('relationForeignKey must be a string', () => {
      try {
        getApp({ relationForeignKey: false });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'relationForeignKeyMustBeAString');
      }
    });

    it('relationParentName must be a string', () => {
      try {
        getApp({ relationParentName: false });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'relationParentNameMustBeAString');
      }
    });

    it('versionFieldName must be a string', () => {
      try {
        getApp({ versionFieldName: false });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'versionFieldNameMustBeAString');
      }
    });

    it('versionFieldLen must be a number', () => {
      try {
        getApp({ versionFieldLen: false });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'versionFieldLenMustBeANumber');
      }
    });

    it('hashFieldName must be a string', () => {
      getApp({ hashFieldName: false });
      try {
        getApp({
          hashFieldName: {},
        });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'hashFieldNameMustBeAString');
      }
    });

    it('hashFieldLen must be a number', () => {
      try {
        getApp({ hashFieldLen: false });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'hashFieldLenMustBeANumber');
      }
    });

    it('actionFieldName must be a string', () => {
      getApp({ actionFieldName: false });
      try {
        getApp({ actionFieldName: {} });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'actionFieldNameMustBeAString');
      }
    });

    it('updatedFieldName must be a string', () => {
      getApp({ updatedFieldName: false });
      try {
        getApp({ updatedFieldName: {} });
        assert(false, 'error must be throwed');
      } catch (err) {
        assert(err.code === 'updatedFieldNameMustBeAString');
      }
    });

  });

  describe('definitions validations', () => {

    it('default setup', () => {
      
      const app = getApp({});

      // ------------------------------
      expect(app.models).to.have.property('Product');

      // Relations
      expect(app.models.Product.relations).to.have.property('history');
      expect(app.models.Product.relations.history.type).to.equal('hasMany');
      expect(app.models.Product.relations.history.keyTo).to.equal('_recordId');
      
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
      expect(app.models.Product_history.relations._record.keyFrom).to.equal('_recordId');
      // Properties
      expect(app.models.Product_history.definition.properties).to.have.property('_recordId');
      expect(app.models.Product_history.definition.properties).to.have.property('_version');
      expect(app.models.Product_history.definition.properties).to.have.property('_hash');
      expect(app.models.Product_history.definition.properties).to.have.property('_action');
      expect(app.models.Product_history.definition.properties).to.have.property('_update');
      expect(app.models.Product_history.definition.properties).to.have.property('price');
      expect(app.models.Product_history.definition.properties).to.have.property('amount');
      expect(app.models.Product_history.definition.properties).to.have.property('description');
      // Properties types
      expect(app.models.Product_history.definition.properties._recordId.type).to.equal(Number);
      expect(app.models.Product_history.definition.properties._version.type).to.equal(String);
      expect(app.models.Product_history.definition.properties._version.length).to.equal(ChangesHistoryMixin.DEFAULT_OPTS.versionFieldLen);
      expect(app.models.Product_history.definition.properties._hash.type).to.equal(String);
      expect(app.models.Product_history.definition.properties._hash.length).to.equal(ChangesHistoryMixin.DEFAULT_OPTS.hashFieldLen);
      expect(app.models.Product_history.definition.properties._action.type).to.equal(String);
      expect(app.models.Product_history.definition.properties._update.type).to.equal(Date);
      expect(app.models.Product_history.definition.properties.price.type).to.equal(Number);
      expect(app.models.Product_history.definition.properties.amount.type).to.equal(Number);
      expect(app.models.Product_history.definition.properties.description.type).to.equal(String);

    });

    it('custom setup', () => {

      const VERSION_LEN = 4;
      const HASH_LEN = 8;
      
      const app = getApp({
        fields:             ['price'],
        modelName:          'ProductChanges',
        relationName:       'customHistory',
        relationParentName: 'element',
        relationForeignKey: 'elementId',
        versionFieldName:   'version',
        versionFieldLen:    VERSION_LEN,
        hashFieldName:      'versionHash',
        hashFieldLen:       HASH_LEN,
        actionFieldName:    'eventName',
        updatedFieldName:   'updatedAt',
      });

      // Relations
      expect(app.models.Product.relations).to.have.property('customHistory');
      expect(app.models.Product.relations.customHistory.type).to.equal('hasMany');
      expect(app.models.Product.relations.customHistory.keyTo).to.equal('elementId');
      
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
      expect(app.models.ProductChanges.relations.element.keyFrom).to.equal('elementId');
      // Properties
      expect(app.models.ProductChanges.definition.properties).to.have.property('elementId');
      expect(app.models.ProductChanges.definition.properties).to.have.property('version');
      expect(app.models.ProductChanges.definition.properties).to.have.property('versionHash');
      expect(app.models.ProductChanges.definition.properties).to.have.property('eventName');
      expect(app.models.ProductChanges.definition.properties).to.have.property('updatedAt');
      expect(app.models.ProductChanges.definition.properties).to.have.property('price');
      expect(app.models.ProductChanges.definition.properties).to.have.not.property('amount');
      expect(app.models.ProductChanges.definition.properties).to.have.not.property('description');
      // Properties types
      expect(app.models.ProductChanges.definition.properties.elementId.type).to.equal(Number);
      expect(app.models.ProductChanges.definition.properties.version.type).to.equal(String);
      expect(app.models.ProductChanges.definition.properties.version.length).to.equal(VERSION_LEN);
      expect(app.models.ProductChanges.definition.properties.versionHash.type).to.equal(String);
      expect(app.models.ProductChanges.definition.properties.versionHash.length).to.equal(HASH_LEN);
      expect(app.models.ProductChanges.definition.properties.eventName.type).to.equal(String);
      expect(app.models.ProductChanges.definition.properties.updatedAt.type).to.equal(Date);
      expect(app.models.ProductChanges.definition.properties.price.type).to.equal(Number);

    });

    it('custom min setup', () => {
      
      const app = getApp({
        hashFieldName:    false,
        actionFieldName:  false,
        updatedFieldName: false,
      });

      expect(app.models.Product.definition.properties).to.have.not.property('_hash');
      expect(app.models.Product_history.definition.properties).to.have.not.property('_hash');
      expect(app.models.Product_history.definition.properties).to.have.not.property('_action');
      expect(app.models.Product_history.definition.properties).to.have.not.property('_update');

    });

  });

  [ {
    name: 'with default params',
    params: {},
  }, {
    name: 'without hashFieldName param',
    skipNoGenerateChanges: true,
    params: {
      hashFieldName: false
    },
  }, {
    name: 'without actionFieldName param',
    params: {
      actionFieldName: false
    },
  }, {
    name: 'without updatedFieldName param',
    params: {
      updatedFieldName: false
    },
  }, ]
  .map((section) => {

    const getAppSection = () => getApp(section.params);

    describe(section.name, () => {

      describe('inserting records', () => {

        it('Not changes', p(() => {

          const app = getAppSection();

          return app.models.Product_history.count({})
          .then((count) => {
            expect(count).to.equal(0);
          });

        }));

        [
          {
            name: 'Model.create',
            callback: (app, data) => app.models.Product.create(data),
          }, {
            name: 'Model.updateOrCreate',
            callback: (app, data) => app.models.Product.updateOrCreate(data),
          }, {
            name: 'Model.replaceOrCreate',
            callback: (app, data) => app.models.Product.replaceOrCreate(data)
          }, {
            name: 'Model.findOrCreate',
            callback: (app, data) => app.models.Product.findOrCreate({}, data)
            .then(([record]) => record)
          }, {
            name: 'Model.upsertWithWhere',
            callback: (app, data) => app.models.Product.upsertWithWhere({}, data, { instanceByWhere: true })
          }
        ]
        .map((action) => {

          it(action.name, p(() => {
            
            const app = getAppSection();

            const data = {
              price: 100,
              amount: 10,
              description: 'product description',
            };

            const V1 = ChangesHistoryMixin.getVersion(ChangesHistoryMixin.DEFAULT_OPTS.versionFieldLen, 1);
            
            return action.callback(app, data)
            .then((record) => {
              // Properties
              expect(record).to.have.property('_version');
              if (section.params.hashFieldName !== false) {
                expect(record).to.have.property('_hash');
              } else {
                expect(record).to.have.not.property('_hash');
              }
              // Tipos
              expect(record._version).to.be.a('string');
              if (section.params.hashFieldName !== false) {
                expect(record._hash).to.be.a('string');
                expect(record._hash.length).to.equal(ChangesHistoryMixin.DEFAULT_OPTS.hashFieldLen);
              }

              expect(record._version).to.equal(V1);

              return record.history.find({})
              .then((changes) => {
                
                // Cantidad de elementos
                expect(changes.length).to.equal(1);

                const [change] = changes;
                // Properties
                expect(change).to.have.property('_version');
                expect(change).to.have.property('id');
                if (section.params.hashFieldName !== false) {
                  expect(change).to.have.property('_hash');
                } else {
                  expect(change).to.have.not.property('_hash');
                }
                if (section.params.actionFieldName !== false) {
                  expect(change).to.have.property('_action');
                } else {
                  expect(change).to.have.not.property('_action');
                }
                if (section.params.updatedFieldName !== false) {
                  expect(change).to.have.property('_update');
                } else {
                  expect(change).to.have.not.property('_update');
                }
                expect(change).to.have.property('price');
                expect(change).to.have.property('amount');
                expect(change).to.have.property('description');
                // Properties types
                expect(change.id).to.be.a('number');
                expect(change._version).to.be.a('string');
                if (section.params.hashFieldName !== false) {
                  expect(change._hash).to.be.a('string');
                }
                if (section.params.actionFieldName !== false) {
                  expect(change._action).to.be.a('string');
                }
                if (section.params.updatedFieldName !== false) {
                  expect(change._update).to.be.a('date');
                }
                expect(change.price).to.be.a('number');
                expect(change.amount).to.be.a('number');
                expect(change.description).to.be.a('string');
                // Values
                expect(change.id).to.equal(record.id);
                expect(change._version).to.equal(record._version);
                if (section.params.hashFieldName !== false) {
                  expect(change._hash).to.equal(record._hash);
                }
                if (section.params.actionFieldName !== false) {
                  expect(change._action).to.equal('create');
                }
                expect(change.price).to.equal(record.price);
                expect(change.amount).to.equal(record.amount);
                expect(change.description).to.equal(record.description);

              })
            })

          }));

        });

      });


      const updateActions = [
        {
          name: 'Model.updateOrCreate',
          callback: (app, data, record) => app.models.Product.updateOrCreate({
            id: record.id,
            price: data.price + 50,
          }),
        }, {
          name: 'Model.replaceOrCreate',
          callback: (app, data, record) => {
            const newData = record.toJSON();
            newData.price += 50;
            return app.models.Product.replaceOrCreate(newData);
          },
        }, {
          name: 'Model.upsertWithWhere',
          callback: (app, data, record) => {
            const newData = record.toJSON();
            newData.price += 50;
            delete newData.id;
            return app.models.Product.upsertWithWhere({
              id: record.id,
            }, newData, {
              instanceByWhere: true,
            });
          }
        }, {
          name: 'Model.replaceById',
          callback: (app, data, record) => {
            const newData = record.toJSON();
            newData.price += 50;
            delete newData.id;
            return app.models.Product.replaceById(record.id, newData);
          }
        }, {
          name: 'Model.prototype.save',
          callback: (app, data, record) => {
            record.price += 50;
            return record.save();
          }
        }, {
          name: 'Model.prototype.updateAttribute',
          callback: (app, data, record) => {
            return record.updateAttribute('price', record.price+50);
          }
        }, {
          name: 'Model.prototype.updateAttributes',
          callback: (app, data, record) => {
            return record.updateAttributes({
              'price': record.price+50
            });
          }
        }, {
          name: 'Model.prototype.replaceAttributes',
          callback: (app, data, record) => {
            const newData = record.toJSON();
            newData.price += 50;
            delete newData.id;
            return record.replaceAttributes(newData);
          }
        }
      ];

      describe('updating records', () => {

        const V2 = ChangesHistoryMixin.getVersion(ChangesHistoryMixin.DEFAULT_OPTS.versionFieldLen, 2);

        updateActions.map((action) => {

          it(action.name, p(() => {

            const app = getAppSection();

            const data = {
              price: 100,
              amount: 10,
              description: 'product description',
            };

            return app.models.Product.create(data)
            .then((record) => {
              const prevHash = record._hash;
              const prevVersion = record._version;
              return action.callback(app, data, record)
              .then((newRecord) => {
                return newRecord.history.find({})
                .then((changes) => {

                  expect(changes.length).to.equal(2);

                  const [change1, change2] = changes;

                  if (section.params.hashFieldName !== false) {
                    expect(newRecord._hash).to.not.equal(prevHash);
                  }
                  expect(newRecord._version).to.not.equal(prevVersion);
                  expect(newRecord._version).to.equal(V2);

                  expect(change2.price).to.equal(newRecord.price);
                  expect(change2.amount).to.equal(newRecord.amount);
                  expect(change2.description).to.equal(newRecord.description);
                  expect(change2._version).to.equal(V2);
                  if (section.params.hashFieldName !== false) {
                    expect(change2._hash).to.equal(newRecord._hash);
                  }
                  if (section.params.actionFieldName !== false) {
                    expect(change2._action).to.equal('update');
                  }
                  expect(change2._recordId).to.equal(newRecord.id);

                })
              })
            });

          }));

        });

      });

      if (!section.skipNoGenerateChanges) {
        describe('updating records no generate changes', () => {

          const V1 = ChangesHistoryMixin.getVersion(ChangesHistoryMixin.DEFAULT_OPTS.versionFieldLen, 1);

          updateActions.map((action) => {

            it(action.name, p(() => {

              const opts = Object.assign({}, section.params);
              opts.fields = ['amount'];
              const app = getApp(opts);

              const data = {
                price: 100,
                amount: 10,
                description: 'product description',
              };

              return app.models.Product.create(data)
              .then((record) => {
                const prevHash = record._hash;
                const prevVersion = record._version;
                return action.callback(app, data, record)
                .then((newRecord) => {
                  return newRecord.history.find({})
                  .then((changes) => {

                    expect(changes.length).to.equal(1);

                    if (section.params.hashFieldName !== false) {
                      expect(newRecord._hash).to.equal(prevHash);
                    }
                    expect(newRecord._version).to.equal(prevVersion);
                    expect(newRecord._version).to.equal(V1);

                  })
                })
              });

            }));

          });

          it('Model.updatingAll ()', p(() => {

            const app = getAppSection();

            return app.models.Product.create({ price: 100, })
            .then(() => {
              return app.models.Product.create({ price: 200, });
            })
            .then(() => {
              return app.models.Product_history.count({})
              .then((count) => {
                expect(count).to.equal(2);
              })
              .then(() => {
                return app.models.Product.updateAll({}, { amount: 0 });
              })
              .then(() => {
                return app.models.Product_history.count({})
              })
              .then((count) => {
                expect(count).to.equal(2);
              });
            });

          }));

        });
      }

      describe('deleting records', () => {

        const V2 = ChangesHistoryMixin.getVersion(ChangesHistoryMixin.DEFAULT_OPTS.versionFieldLen, 2);

        [ {
          name: 'Model.prototype.destroy',
          callback: (app, record) => record.destroy(),
        }, {
          name: 'Model.prototype.delete',
          callback: (app, record) => record.delete(),
        }, {
          name: 'Model.destroyById',
          callback: (app, record) => app.models.Product.destroyById(record.id),
        }, {
          name: 'Model.deleteById',
          callback: (app, record) => app.models.Product.deleteById(record.id),
        }, ]
        .map((action) => {

          it(action.name, p(() => {

            const app = getAppSection();

            const data = {
              price: 100,
              amount: 10,
              description: 'product description',
            };

            return app.models.Product.create(data)
            .then((record) => {
              return action.callback(app, record);
            })
            .then(() => {
              return app.models.Product_history.find({})
              .then((changes) => {
                expect(changes.length).to.equal(2);
                const [change1, change2] = changes;
                expect(change2._version).to.equal(V2);
                if (section.params.actionFieldName !== false) {
                  expect(change2._action).to.equal('delete');
                }
              })
            })

          }));

        });

        ['destroyAll', 'deleteAll']
        .map((method) => {
          it(`Model.${method} (no generate changes)`, p(() => {

            const app = getAppSection();

            return app.models.Product.create({ price: 100, })
            .then(() => {
              return app.models.Product.create({ price: 200, });
            })
            .then(() => {
              return app.models.Product_history.count({})
            })
            .then((count) => {
              expect(count).to.equal(2);
            })
            .then(() => {
              return app.models.Product[method]({});
            })
            .then(() => {
              return app.models.Product_history.count({})
            })
            .then((count) => {
              expect(count).to.equal(2);
            });

          }));
        })

      });

    });
  });

});