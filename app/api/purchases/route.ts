import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { productId, quantity, purchasePrice, notes } = await request.json();

    if (!productId || !quantity || !purchasePrice) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'La cantidad debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (purchasePrice <= 0) {
      return NextResponse.json(
        { error: 'El precio de compra debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const totalCost = quantity * purchasePrice;

    const { data: purchase, error } = await supabaseAdmin
      .from('purchase_records')
      .insert([
        {
          product_id: productId,
          quantity,
          purchase_price: purchasePrice,
          total_cost: totalCost,
          notes,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error al registrar la compra' },
        { status: 500 }
      );
    }

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error('Error interno:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get('productId');

    let query = supabaseAdmin.from('purchase_records').select('*');

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: purchases, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener compras' },
        { status: 500 }
      );
    }

    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Error interno:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
