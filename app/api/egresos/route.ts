import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ExpenseItem } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { createdBy, posNumber, category, items, total, shippingCost, notes, paymentStatus, checkDate } = await request.json();

    if (!createdBy) {
      return NextResponse.json(
        { error: 'Usuario no identificado' },
        { status: 401 }
      );
    }

    if (!category || !['Compra de Inventario', 'Servicios', 'Gastos Operativos', 'Otros'].includes(category)) {
      return NextResponse.json(
        { error: 'Categoría de gasto inválida' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Debe incluir al menos un artículo' },
        { status: 400 }
      );
    }

    let subtotal = 0;
    const validatedItems: ExpenseItem[] = [];

    for (const item of items) {
      if (!item.description || typeof item.description !== 'string' || item.description.trim() === '') {
        return NextResponse.json(
          { error: 'La descripción del artículo es requerida' },
          { status: 400 }
        );
      }

      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'La cantidad debe ser mayor a 0' },
          { status: 400 }
        );
      }

      if (typeof item.purchase_price !== 'number' || item.purchase_price < 0) {
        return NextResponse.json(
          { error: 'El precio de compra unitario no puede ser negativo' },
          { status: 400 }
        );
      }

      const itemSubtotal = item.quantity * item.purchase_price;
      
      if (Math.abs(item.subtotal - itemSubtotal) > 0.01) {
        return NextResponse.json(
          { error: `Subtotal incorrecto para ${item.description}` },
          { status: 400 }
        );
      }

      subtotal += itemSubtotal;
      validatedItems.push({
        description: item.description.trim(),
        quantity: item.quantity,
        unit_price: item.unit_price || 0,
        purchase_price: item.purchase_price,
        subtotal: itemSubtotal,
      });
    }

    const finalShippingCost = shippingCost && typeof shippingCost === 'number' && shippingCost >= 0 ? shippingCost : 0;
    const finalTotal = subtotal + finalShippingCost;

    if (Math.abs(total - finalTotal) > 0.01) {
      return NextResponse.json(
        { error: 'Total no coincide con los cálculos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('egresos')
      .insert([
        {
          created_by: createdBy,
          pos_number: posNumber && typeof posNumber === 'number' && posNumber >= 1 && posNumber <= 3 ? posNumber : null,
          category,
          items: validatedItems,
          subtotal,
          shipping_cost: finalShippingCost,
          total: finalTotal,
          notes: notes && typeof notes === 'string' ? notes.trim() : null,
          status: 'pendiente',
          payment_status: paymentStatus || 'paid',
          check_date: checkDate && typeof checkDate === 'string' ? checkDate : null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Error al registrar el egreso' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pendiente' | 'aprobado' | 'rechazado' | null;
    const category = searchParams.get('category');
    const posNumber = searchParams.get('posNumber');

    let query = supabaseAdmin.from('egresos').select('*');

    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (posNumber) {
      query = query.eq('pos_number', parseInt(posNumber, 10));
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(100);

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener egresos' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
