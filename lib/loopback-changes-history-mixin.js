'use strict';

module.exports = function (Model, bootOptions) {

  const options = Object.assign({
    userFieldname: '_user',
    userFieldRequired: true,
    actionFieldname: '_action',
    relationName: 'history',
    modelName: '_history_' + Model.modelName.toLowerCase(),
  }, bootOptions);

  Model.defineProperty(options.userFieldname, {
    type: 'string',
    required: options.userFieldRequired,
  });

  const HistoryModel = Model.dataSource.define(options.modelName);

  Model.forEachProperty((fieldname, opts) => {
    if(fieldname==='id') return;
    HistoryModel.defineProperty(fieldname, {
      type: opts.type,
      required: options.required,
      dataType: opts.dataType,
    });
  });

  HistoryModel.defineProperty(options.actionFieldname, {
    type: 'string',
    required: true,
  });

  HistoryModel.belongsTo(Model, {
    as: '_record', 
  });

  Model.hasMany(HistoryModel, {
    as: options.relationName, 
    foreignKey: '_recordId'
  });

  Model.observe('after save', function (ctx) {
    const data = ctx.instance.toJSON();
    delete data.id;
    data[options.actionFieldname] = ctx.isNewInstance? 'create' : 'update';
    return Promise.resolve()
    .then(() => {
      return ctx.instance[options.relationName].create(data);
    });
  });

};