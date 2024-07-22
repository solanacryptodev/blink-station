import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { ActionGetResponse, ActionPostResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { PROGRAM_ID, CONNECTION, gmClientService, isValidNftName, getNftMint } from '@/lib/blinks/actions';
import { BN } from "@coral-xyz/anchor";

export const dynamic = 'force-dynamic'

export const GET = async (req: Request) => {
    try {
        const requestURL = new URL(req.url);
        console.log('searchParams: ', requestURL.origin);
        // console.log('nft name: ', searchParams.get('nftName'));
        // const nftName = searchParams.get('nftName')?.toLowerCase() as string;
        const nftName = 'pearce_x4';

        // if (!nftName || !isValidNftName(nftName)) {
        //     return Response.json({ error: 'Invalid or missing NFT name' },
        //     { headers: ACTIONS_CORS_HEADERS, status: 400 });
        // }

        const baseHref = new URL(`/api/buy?nftName=${nftName}`, requestURL.origin).toString();

        const payload: ActionGetResponse = {
            title: "Star Atlas NFT Purchase",
            icon: "https://staratlas.com/favicon.ico",
            description: `Purchase an NFT from the Star Atlas marketplace`,
            label: "Select NFT Order",
            links: {
                actions: [
                    {
                        label: "Find Orders",
                        href: `${baseHref}&action=findOrders`,
                        parameters: [
                            {
                                name: "nftName",
                                label: "Enter NFT name",
                                required: true,
                            }
                        ]
                    }
                ]
            }
        };

        console.log('payload: ', payload.links?.actions[0]);
        return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
    } catch ( error ) {
        console.log('error: ', error);
    }

    return NextResponse.json({ error: 'Invalid or missing NFT name' }, { headers: ACTIONS_CORS_HEADERS, status: 400 });
}

export const POST = async (req: Request) => {
    const requestURL = new URL(req.url);
    const nftName = 'pearce_x4';
    const action = requestURL.searchParams.get('action');
    const orderId = requestURL.searchParams.get('orderId');
    const orderIdKey = new PublicKey(orderId as string);

    if (!nftName || !isValidNftName(nftName)) {
        return Response.json({ error: 'Invalid or missing NFT name' }, { headers: ACTIONS_CORS_HEADERS, status: 400 });
    }

    const body = await req.json();
    const buyerPubkey = new PublicKey(body.account);

    const nftMint = getNftMint(nftName);
    if (!nftMint) {
        return Response.json({ error: 'Invalid NFT name' }, { headers: ACTIONS_CORS_HEADERS, status: 400 });
    }

    if (action === 'findOrders') {
        const orders = await gmClientService.getOpenOrdersForAsset(CONNECTION, PROGRAM_ID, nftMint);
        console.log('orders: ', orders);
        const topOrders = orders.slice(0, 6).map(order => ({
            label: `Buy for ${order.uiPrice} ATLAS`,
            href: `/api/buy?nftName=${nftName}&action=buy&orderId=${order.id}`
        }));

        const payload: ActionGetResponse = {
            title: "Star Atlas NFT Purchase",
            icon: "https://staratlas.com/favicon.ico",
            description: `Select an order to purchase ${nftName.toUpperCase()} NFT`,
            label: "Select Order",
            links: { actions: topOrders }
        };

        return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
    } else if (action === 'buy' && orderId) {
        const order = await gmClientService.getOpenOrder(CONNECTION, PROGRAM_ID, orderIdKey);
        if (!order) {
            return Response.json({ error: 'Order not found' }, { headers: ACTIONS_CORS_HEADERS, status: 400 });
        }

        const purchaseQty = 1;
        const exchangeTx = await gmClientService.getCreateExchangeTransaction(
            CONNECTION,
            order,
            buyerPubkey,
            purchaseQty,
            PROGRAM_ID,
        );

        const serializedTransaction = exchangeTx.transaction.serialize({ requireAllSignatures: false }).toString('base64');

        const payload: ActionPostResponse = {
            transaction: serializedTransaction,
            message: `Purchase ${nftName.toUpperCase()} NFT for ${order.uiPrice} ATLAS`
        };

        return Response.json(new BN(payload), { headers: ACTIONS_CORS_HEADERS });
    } else {
        return Response.json({ error: 'Invalid action' }, { headers: ACTIONS_CORS_HEADERS, status: 400 });
    }
}
