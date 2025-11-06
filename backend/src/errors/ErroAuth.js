import ErroBase from "./ErroBase.js";

export class ErroAuth extends ErroBase {
  constructor(mensagem = "Falha na autenticação") {
    super(mensagem, 401);
  }
}

export class ErroTokenExpirado extends ErroAuth {
  constructor(mensagem = "Token expirado. Faça login novamente.") {
    super(mensagem);
  }
}

export class ErroTokenInvalido extends ErroAuth {
  constructor(mensagem = "Token inválido ou mal formado.") {
    super(mensagem);
  }
}

export class ErroSemToken extends ErroAuth {
  constructor(mensagem = "Acesso negado. Nenhum token fornecido.") {
    super(mensagem);
  }
}
