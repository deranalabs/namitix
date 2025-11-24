module contracts_namitix::namitix_ticket {
    use sui::object::{Self as object, UID};
    use sui::tx_context::{Self as tx_context, TxContext};
    use sui::transfer;

    public struct Ticket has key {
        id: UID,
        event_id: vector<u8>,
        owner: address,
        blob_id: vector<u8>,
    }

    /// Mint a new Namitix ticket object for the sender.
    public fun mint_ticket(
        event_id: vector<u8>,
        blob_id: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let ticket = Ticket {
            id: object::new(ctx),
            event_id,
            owner: tx_context::sender(ctx),
            blob_id,
        };
        transfer::transfer(ticket, tx_context::sender(ctx));
    }
}