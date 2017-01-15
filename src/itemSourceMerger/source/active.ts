'use strict';

import StaticItemSource from './static';
import {IItem, IActiveItemSource, IItemSourceMerger, IItemComparer} from '../itemSourceMerger';

/**
 * Represents an active source of items.
 * @param ItemType The type of the item stored by this source.
 */
export default class ActiveItemSource<ItemType extends IItem> extends StaticItemSource<ItemType> implements IActiveItemSource<ItemType>
{
    /**
     * Previous items (before last update).
     */
    protected previousItems: ItemType[];
    /**
     * The merger that is notified of changes in the source.
     */
    public merger: IItemSourceMerger<ItemType>;
    /**
     * Creates a new instance of ActiveItemSource.
     * @param id The unique indentifier of this source.
     * @param initialItems The initial items to add to the source.
     */
    constructor(id: string, initialItems: ItemType[] = [])
    {
        super(id, initialItems);

        this.previousItems = [];
    }
    /**
     * Internally notifies the merger.
     */
    protected notifyMerger(): void
    {
        if (this.merger !== undefined)
        {
            this.merger.activeSourceUpdated(this);
        }
    }
    /**
     * Returns the previous items (before last update).
     */
    public getPreviousItems(): ItemType[]
    {
        return this.previousItems;
    }
    /**
     * Replaces the items with a set of new ones.
     * @param items The items to replce the old items.
     */
    public updateItems(items: ItemType[]): void
    {

        this.previousItems = this.items;
        this.items = items;

        this.notifyMerger();
    }
    /**
     * Adds an item to the source.
     * @param item The item to add.
     */
    public addItem(item: ItemType): void
    {
        let existing = Array.from(this.items);

        for(let i = existing.length - 1; i >= 0; i--)
        {
            if (existing[i].id == item.id)
            {
                existing.splice(i, 1);
            }
        }

        existing.push(item);

        this.updateItems(existing);
    }
    /**
     * Removes an item from the source.
     * @param item The item to remove.
     */
    public removeItem(item: ItemType): void
    {
        this.removeItemById(item.id);
    }
    /**
     * Internally removes an item from the source.
     * @param itemId The id of the item to remove.
     */
    protected removeItemById(itemId: string): void
    {
        let existing = Array.from(this.items);

        for(let i = existing.length - 1; i >= 0; i--)
        {
            if (existing[i].id == itemId)
            {
                existing.splice(i, 1);
            }
        }
       
       this.updateItems(existing);
    }
    /**
     * Removes items from the source based on a comparer (arrow function).
     * @param comparer The comparer used to select the items to remove.
     */
    public removeItems(comparer: IItemComparer<ItemType>): void
    {
        let existing = Array.from(this.items);

        for(let i = existing.length - 1; i >= 0; i--)
        {
            if (comparer(existing[i]))
            {
                existing.splice(i, 1);
            }
        }
       
       this.updateItems(existing);
    }
    /**
     * Removes all items from the source.
     */
    public clear(): void
    {
        this.previousItems = this.items;
        this.items = [];

        this.notifyMerger();
    }
}