#!/bin/bash
echo "Creating extra relations..."

# update trainer model to add relations

deletetextuntil () {
    INFILE=$1
    FROMTEXT=$2
    TOTEXT=$3
    DELETEFROM=$(($(grep "${TOTEXT}" src/models/trainer.model.ts -n | cut -d : -f 1)-$(grep -B10 "${TOTEXT}" src/models/trainer.model.ts | grep "${FROMTEXT}" -A10 | wc -l)))
    DELETEUNTIL=$(grep "${TOTEXT}" src/models/trainer.model.ts -n | cut -d : -f 1)
    if [ ${DELETEFROM} -gt 0 ] && [ ${DELETEUNTIL} -gt 0 ]; then
        sed -i "${DELETEFROM}","${DELETEUNTIL}"'{d;}' src/models/trainer.model.ts
    else
        echo "not deleted as one of the variables is empty."
    fi
}

deletetextuntil src/models/trainer.model.ts "@property({" "summerRateAfterId?: number;"
deletetextuntil src/models/trainer.model.ts "@property({" "summerRateBeforeId?: number;"
deletetextuntil src/models/trainer.model.ts "@property({" "winterRateAfterId?: number;"
deletetextuntil src/models/trainer.model.ts "@property({" "winterRateBeforeId?: number;"
deletetextuntil src/models/trainer.model.ts "@property({" "clubRateId?: number;"

addAtModel="$(grep -n 'SummerRateBeforeId: number;' src/models/trainer.model.ts | cut -d : -f 1)"
addAtModel=$((addAtModel+1))

sed -i "$addAtModel i @belongsTo(() => Product, {name: 'SummerRateAfter'}) \n SummerRateAfterId: number;" src/models/trainer.model.ts
addAtModel=$((addAtModel+2))

sed -i "$addAtModel i @belongsTo(() => Product, {name: 'WinterRateBefore'}) \n WinterRateBeforeId: number;" src/models/trainer.model.ts
addAtModel=$((addAtModel+2))

sed -i "$addAtModel i @belongsTo(() => Product, {name: 'WinterRateAfter'}) \n WinterRateAfterId: number;" src/models/trainer.model.ts
addAtModel=$((addAtModel+2))

sed -i "$addAtModel i @belongsTo(() => Product, {name: 'ClubRate'}) \n ClubRateId: number;" src/models/trainer.model.ts

# update trainer repository to add relations

addAtRepository="$(grep -n 'readonly SummerRateBefore' src/repositories/trainer.repository.ts | cut -d : -f 1)"
addAtRepository=$((addAtRepository+1))

sed -i "$addAtRepository i public readonly SummerRateAfter: BelongsToAccessor<Product, typeof Trainer.prototype.id>;" src/repositories/trainer.repository.ts
addAtRepository=$((addAtRepository+1))

sed -i "$addAtRepository i public readonly WinterRateBefore: BelongsToAccessor<Product, typeof Trainer.prototype.id>;" src/repositories/trainer.repository.ts
addAtRepository=$((addAtRepository+1))

sed -i "$addAtRepository i public readonly WinterRateAfter: BelongsToAccessor<Product, typeof Trainer.prototype.id>;" src/repositories/trainer.repository.ts
addAtRepository=$((addAtRepository+1))

sed -i "$addAtRepository i public readonly ClubRate: BelongsToAccessor<Product, typeof Trainer.prototype.id>;" src/repositories/trainer.repository.ts

addAtRepository="$(grep -n 'this.registerInclusionResolver' src/repositories/trainer.repository.ts | cut -d : -f 1)"
addAtRepository=$((addAtRepository+1))

sed -i "$addAtRepository i this.SummerRateAfter = this.createBelongsToAccessorFor('SummerRateAfter', productRepositoryGetter,); \n this.registerInclusionResolver('SummerRateAfter', this.SummerRateAfter.inclusionResolver);" src/repositories/trainer.repository.ts

addAtRepository=$((addAtRepository+1))
sed -i "$addAtRepository i this.WinterRateBefore = this.createBelongsToAccessorFor('WinterRateBefore', productRepositoryGetter,); \n this.registerInclusionResolver('WinterRateBefore', this.WinterRateBefore.inclusionResolver);" src/repositories/trainer.repository.ts

addAtRepository=$((addAtRepository+1))
sed -i "$addAtRepository i this.WinterRateAfter = this.createBelongsToAccessorFor('WinterRateAfter', productRepositoryGetter,); \n this.registerInclusionResolver('WinterRateAfter', this.WinterRateAfter.inclusionResolver);" src/repositories/trainer.repository.ts

addAtRepository=$((addAtRepository+1))
sed -i "$addAtRepository i this.ClubRate = this.createBelongsToAccessorFor('ClubRate', productRepositoryGetter,); \n this.registerInclusionResolver('ClubRate', this.ClubRate.inclusionResolver);" src/repositories/trainer.repository.ts

# update controller to add relations

sed -i "s#return this.trainerRepository.SummerRateBefore(id);#return [ \n this.trainerRepository.SummerRateBefore(id), \n this.trainerRepository.SummerRateAfter(id), \n this.trainerRepository.WinterRateBefore(id), \n this.trainerRepository.WinterRateAfter(id), \n this.trainerRepository.ClubRate(id) \n];#g" src/controllers/trainer-product.controller.ts
sed -i "s#Promise<Product>#Promise<Promise<Product>[]>#g" src/controllers/trainer-product.controller.ts

echo "---"
