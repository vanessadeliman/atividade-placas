module.exports = function tratamentoErroMongoose(error, res){
    const errors = error.errors;
    let menssagem = [];
    
    for (const campo in errors) {
      if (errors.hasOwnProperty(campo)) {
        menssagem.push({campo: errors[campo].message}); 
        console.error({campo: errors[campo].message});
      }
    }
    res.status(500).json({ "error" : menssagem });
}
