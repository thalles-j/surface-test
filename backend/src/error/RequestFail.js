import ErroBase from "./ErroBase.js";

class ErroValidacao extends ErroBase {
    constructor(mensagem = "Um ou mais dados fornecidos estão incorretos") {
        super(mensagem, 400); // 400 = Bad Request
    }
}
