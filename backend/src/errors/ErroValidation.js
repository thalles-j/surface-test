import ErroBase from "./ErroBase.js";

class ErroValidation extends ErroBase {
    constructor(mensagem = "Um ou mais dados fornecidos estão incorretos") {
        super(mensagem, 400); // 400 = Bad Request
    }
}

export default ErroValidation;