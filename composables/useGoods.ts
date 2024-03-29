import type {Goods} from "~/types/goods";
import goodsList from "~/composables/goodsData";

export const useGoods = (): Goods[] => {
    return goodsList.map((goods, index) => {
        return {
            ...goods,
            name: `${goods.name}${index}`
        }
    });
}