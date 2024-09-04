function tratamentoErro(error, res){
    let menssagem = {};
    let codigo = 400;

    switch (error.code) {
        case 11000:
            if (error.code === 11000 && error.keyPattern && error.keyValue) {
                const campo = Object.keys(error.keyPattern)[0];
                const valor = error.keyValue[campo];
                menssagem = `Já existe um registro com o valor '${valor}' para o campo '${campo}'.`;
                codigo = 409;
            }
            break;
        case 121:
            if (error.errInfo) {
                const { operatorName, schemaRulesNotSatisfied } = error.errInfo.details;
                if (operatorName === "$jsonSchema" && schemaRulesNotSatisfied) {
                    schemaRulesNotSatisfied.forEach(rule => {
                        const { operatorName, propertiesNotSatisfied, missingProperties } = rule;
                        if (operatorName === "properties" && propertiesNotSatisfied) {
                            propertiesNotSatisfied.forEach(element => {
                                const campo = element.propertyName;
                                const info = element.description;
                                menssagem[campo] = info;
                                console.error(menssagem);
                            });
                        }
                        if (operatorName === "required" && missingProperties) {
                            missingProperties.forEach(element => {
                                const campo = element + "";
                                menssagem[campo] = "Dado obrigatório";
                                console.error(menssagem);
                            });
                        }
                    });
                }
            }
            break;
        default:
            menssagem = error;
            break;
    }

    
    console.error(menssagem);
    res.status(codigo).send({'error':menssagem});
}

module.exports = tratamentoErro;