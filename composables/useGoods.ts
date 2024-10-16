import type {Goods} from "~/types/goods";
import goodsList from '~/composables/goodsData';

export const useGoods = (): Goods[] => {
    goodsList.forEach((goods, index) => goods.name = `${goods.name}${index}`);
    return goodsList;
    // return goodsList.map((goods, index) => {
    //     return {
    //         ...goods,
    //         name: `${goods.name}${index}`
    //     }
    // });
}