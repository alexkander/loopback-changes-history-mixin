'use strict';

module.exports = function (Model, bootOptions) {

  const options = Object.assign({
    versionFieldName:   '_version',
    updatedFieldName:   '_updated',
    actionFieldname:    '_action',
    relationName:       'history',
    relationParentName: '_record',
    relationForeignKey: '_recordId',
    fields:             [],
    modelName:          `${Model.modelName.toLowerCase()}_history`,
  }, bootOptions);

  if (options.versionFieldName && options.fields!='*') {
    Model.defineProperty(options.versionFieldName, { type: 'string' });
    options.fields.push(options.versionFieldName);
  }

  if (options.updatedFieldName && options.fields!='*') {
    Model.defineProperty(options.updatedFieldName, { type: 'date' });
    options.fields.push(options.updatedFieldName);
  }

  const HistoryModel = Model.dataSource.define(options.modelName);

  Model.forEachProperty((fieldname, opts) => {
    if(options.fields!='*' && options.fields.indexOf(fieldname)===-1) return;
    HistoryModel.defineProperty(fieldname, {
      type: opts.type,
      required: options.required,
      dataType: opts.dataType,
    });
  });

  HistoryModel.defineProperty(options.actionFieldname, { type: 'string' });

  HistoryModel.belongsTo(Model, {
    foreignKey: options.relationForeignKey,
    as:         options.relationNameField,
  });

  Model.hasMany(HistoryModel, {
    foreignKey: options.relationForeignKey,
    as:         options.relationName, 
  });

  Model.observe('before save', function (ctx) {
    if (options.versionFieldName) {
      const VERSION_LEN = 5;
      let version = ctx.instance[options.versionFieldName] || '1';
      if (!ctx.isNewInstance) {
        version = parseInt(version) + 1;
      }
      version = ('0'.repeat(VERSION_LEN)+version).substr(-VERSION_LEN);
      ctx.instance[options.versionFieldName] = version;
    }
    if (options.updatedFieldName) {
      ctx.instance[options.updatedFieldName] = new Date();
    }
    return Promise.resolve();
  });

  Model.observe('after save', function (ctx) {
    const data = {};
    const dataRaw = ctx.instance.toJSON();
    if (options.fields=='*') {
      data = Object.assign(data, dataRaw);
    } else {
      options.fields.map((fieldName) => {
        data[fieldName] = dataRaw[fieldName];
      })
    }
    delete data.id;
    data[options.actionFieldname] = ctx.isNewInstance? 'create' : 'update';
    return Promise.resolve()
    .then(() => {
      return ctx.instance[options.relationName].create(data);
    });
  });

};