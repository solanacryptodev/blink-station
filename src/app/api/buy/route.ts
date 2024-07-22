import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { ActionGetResponse, ActionPostRequest, ActionPostResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import {
    PROGRAM_ID,
    CONNECTION,
    gmClientService,
    isValidNftName,
    getNftMint,
    validatedQueryParams
} from '@/lib/blinks/actions';
import { BN } from "@coral-xyz/anchor";

export const dynamic = 'force-dynamic'

export const GET = async (req: Request) => {
    try {
        const requestURL = new URL(req.url);
        console.log('requestURL: ', requestURL.origin);
        const { playerPubKey } = validatedQueryParams(requestURL);

        // if (!nftName || !isValidNftName(nftName)) {
        //     return Response.json({ error: 'Invalid or missing NFT name' },
        //     { headers: ACTIONS_CORS_HEADERS, status: 400 });
        // }

        const baseHref = new URL(`/api/buy?player=${playerPubKey}`, requestURL.origin).toString();

        const payload: ActionGetResponse = {
            title: "Star Atlas NFT Purchase",
            icon: "https://staratlas.com/favicon.ico",
            description: `Purchase an NFT from the Star Atlas marketplace`,
            label: "FindOrdersForAsset",
            links: {
                actions: [
                    {
                        label: "Find Orders",
                        href: `${baseHref}&nftName={nftName}`,
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

        return NextResponse.json(payload, {
            headers: ACTIONS_CORS_HEADERS
        });
    } catch ( error ) {
        console.log('error: ', error);
        return new NextResponse(
            'Invalid request',
            { headers: ACTIONS_CORS_HEADERS, status: 400 }
        );
    }
}

export const OPTIONS = GET;

export const POST = async (req: Request) => {
    try {
        console.log('connection: ', CONNECTION);
        console.log('programID: ', PROGRAM_ID.toString());
        const requestURL = new URL(req.url);
        const { nftName, label } = validatedQueryParams(requestURL);
        console.log('nft name: ', nftName);
        console.log('performing action... ', requestURL);
        // const orderId = requestURL.searchParams.get('orderId');
        // const orderIdKey = new PublicKey(orderId as string);

        const body: ActionPostRequest = await req.json();
        console.log('body: ', body);
        const buyerPubkey = new PublicKey(body.account);

        const nftMint = getNftMint(nftName) as PublicKey;
        console.log('nftMint: ', nftMint.toString());

        const orders = await gmClientService.getOpenOrdersForAsset(CONNECTION, nftMint, PROGRAM_ID);
        const buyOrders = orders.filter(order => order.orderType === 'buy');
        console.log('buy orders: ', buyOrders);

        const topOrders = buyOrders.slice(0, 6).map(order => ({
            label: `Buy for ${order.uiPrice} ${order.currencyMint === 'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx' ? 'ATLAS' : 'USDC'}`,
            href: `/api/buy?nftName=${nftName}&action=buy`
        }));

        console.log('topOrders: ', topOrders);

        const payload: ActionGetResponse = {
                title: "Star Atlas NFT Purchase",
                icon: "https://staratlas.com/favicon.ico",
                description: `Select an order to purchase ${nftName.toUpperCase()} NFT`,
                label: "Select Order",
                links: { actions: topOrders }
            };

            // const purchaseQty = 1;
            // const exchangeTx = await gmClientService.getCreateExchangeTransaction(
            //     CONNECTION,
            //     orders[0],
            //     buyerPubkey,
            //     purchaseQty,
            //     PROGRAM_ID,
            // );
            //
            // const serializedTransaction = exchangeTx.transaction.serialize({ requireAllSignatures: false }).toString('base64');
            //
            // const second_payload: ActionPostResponse = {
            //     transaction: serializedTransaction,
            //     message: `Purchase ${nftName.toUpperCase()} NFT for ${orders[0].uiPrice} ATLAS`
            // };

        return NextResponse.json(payload, { headers: ACTIONS_CORS_HEADERS }
        );

    } catch ( error ) {
        console.log('error: ', error);
    }
}
