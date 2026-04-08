import { getRestockRequestsGroupedByProduct } from "../restockService.js";
import { erro, sucesso } from "../../helpers/apiResponse.js";

export async function getRestockRequests(req, res) {
  try {
    const data = await getRestockRequestsGroupedByProduct();
    return sucesso(res, data);
  } catch (error) {
    return erro(res, error.message, 500);
  }
}
