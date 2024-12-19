#!/bin/bash

echo "enabling hasManyThrough with same table & no-pk reference..."

# update trainer model to add relations

addTypesAt="$(grep -n 'type: RelationType.hasMany;' node_modules/@loopback/repository/dist/relations/relation.types.d.ts | cut -d : -f 1)"
addTypesAt=$((addTypesAt+1))
sed -i "$addTypesAt i customReferenceKeyTo?: string; \n customReferenceKeyFrom?: string;" node_modules/@loopback/repository/dist/relations/relation.types.d.ts

sed -i "s#const targetPrimaryKey = relationMeta.keyTo;#const targetPrimaryKey = relationMeta.customReferenceKeyTo || relationMeta.keyTo;#g" node_modules/@loopback/repository/dist/relations/has-many/has-many-through.helpers.js
sed -i "s#const targetId = relationMeta.keyTo;#const targetId = relationMeta.customReferenceKeyTo || relationMeta.keyTo;#g" node_modules/@loopback/repository/dist/relations/has-many/has-many-through.helpers.js


addIfConditionAt="$(grep -n 'const targetPrimaryKey = (_f = relationMeta.keyTo)' node_modules/@loopback/repository/dist/relations/has-many/has-many-through.helpers.js | cut -d : -f 1)"
addIfConditionAt=$((addIfConditionAt+1))
sed -i "$addIfConditionAt i if (relationMeta.customReferenceKeyTo) { \n targetPrimaryKey = relationMeta.customReferenceKeyTo; \n}" node_modules/@loopback/repository/dist/relations/has-many/has-many-through.helpers.js

sed -i "s#const targetPrimaryKey = (_f = relationMeta.keyTo)#let targetPrimaryKey = (_f = relationMeta.keyTo)#g" node_modules/@loopback/repository/dist/relations/has-many/has-many-through.helpers.js

sed -i "s#keyFrom: relationMeta.keyFrom,#keyFrom: relationMeta.customReferenceKeyFrom || relationMeta.keyFrom,#g" node_modules/@loopback/repository/dist/relations/has-many/has-many-through.helpers.js

echo "---"
