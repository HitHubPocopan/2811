import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ExpenseItem } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { createdBy, posNumber, category, items, total, shippingCost, notes, paymentStatus, checkDate } = await request.json();

    if (!createdBy) {
      console.error('Error: createdBy no identificado');
      return NextResponse.json(
        { error: 'Usuario no identificado' },
        { status: 401 }
      );
    }

    const validCategories = ['Compra de Inventario', 'Expensas', 'Luz', 'Internet', 'Agua', 'Otros'];
    if (category && !validCategories.includes(category)) {
      console.error('Error: Categoría inválida', category);
      return NextResponse.json(
        { error: 'Categoría de gasto inválida' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.error('Error: Items inválido', items);
      return NextResponse.json(
        { error: 'Debe incluir al menos un artículo' },
        { status: 400 }
      );
    }

    let subtotal = 0;
    const validatedItems: ExpenseItem[] = [];

    for (const item of items) {
      console.log('Validando item:', JSON.stringify(item));

      if (!item.description || typeof item.description !== 'string' || item.description.trim() === '') {
        console.error('Error: Descripción inválida', item.description);
        return NextResponse.json(
          { error: 'La descripción del artículo es requerida' },
          { status: 400 }
        );
      }

      const quantity = Number(item.quantity) || 0;
      if (quantity <= 0) {
        console.error('Error: Cantidad inválida', item.quantity);
        return NextResponse.json(
          { error: 'La cantidad debe ser mayor a 0' },
          { status: 400 }
        );
      }

      const purchasePrice = Number(item.purchase_price) || 0;
      if (purchasePrice < 0) {
        console.error('Error: Precio negativo', item.purchase_price);
        return NextResponse.json(
          { error: 'El precio de compra unitario no puede ser negativo' },
          { status: 400 }
        );
      }

      const itemSubtotal = quantity * purchasePrice;
      
      subtotal += itemSubtotal;
      validatedItems.push({
        description: item.description.trim(),
        quantity: quantity,
        unit_price: Number(item.unit_price) || 0,
        purchase_price: purchasePrice,
        subtotal: itemSubtotal,
      });
    }

    const finalShippingCost = Number(shippingCost) || 0;
    const finalTotal = subtotal + finalShippingCost;

    console.log('Calculado - Subtotal:', subtotal, 'Envío:', finalShippingCost, 'Total:', finalTotal);
    console.log('Esperado - Total:', total);

    const validPaymentStatus = ['paid', 'unpaid'].includes(paymentStatus) ? paymentStatus : 'paid';
    
    const insertData: Record<string, unknown> = {
      created_by: createdBy,
      items: validatedItems,
      subtotal,
      shipping_cost: finalShippingCost,
      total: finalTotal,
      status: 'pendiente',
      payment_status: validPaymentStatus,
    };

    if (category) {
      insertData.category = category;
    }

    if (posNumber && typeof posNumber === 'number' && posNumber >= 1 && posNumber <= 3) {
      insertData.pos_number = posNumber;
    }
    if (notes && typeof notes === 'string' && notes.trim()) {
      insertData.notes = notes.trim();
    }
    if (checkDate && typeof checkDate === 'string' && checkDate.trim()) {
      insertData.check_date = checkDate;
    }

    console.log('Insertando:', JSON.stringify(insertData));

    const { data, error } = await supabaseAdmin
      .from('egresos')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: `Error al registrar el egreso: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Egreso registrado exitosamente:', data.id);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: `Error interno: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status') as 'pendiente' | 'aprobado' | 'rechazado' | null;
    const category = searchParams.get('category');
    const posNumber = searchParams.get('posNumber');

    let query = supabaseAdmin.from('egresos').select('*');

    if (id) {
      query = query.eq('id', id);
    }

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

    if (id) {
      return NextResponse.json(data?.[0] || null);
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de egreso no proporcionado' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('egresos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { error: 'Error al eliminar el egreso' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de egreso no proporcionado' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    updateData.updated_at = new Date().toISOString();

    if ('status' in body) {
      updateData.status = body.status;
    }
    if ('payment_status' in body) {
      updateData.payment_status = body.payment_status;
    }
    if ('check_date' in body) {
      updateData.check_date = body.check_date || null;
    }
    if ('category' in body) {
      updateData.category = body.category;
    }
    if ('items' in body && Array.isArray(body.items)) {
      updateData.items = body.items;
    }
    if ('subtotal' in body) {
      updateData.subtotal = body.subtotal;
    }
    if ('shipping_cost' in body) {
      updateData.shipping_cost = body.shipping_cost;
    }
    if ('total' in body) {
      updateData.total = body.total;
    }
    if ('notes' in body) {
      updateData.notes = body.notes || null;
    }
    if ('pos_number' in body) {
      updateData.pos_number = body.pos_number || null;
    }

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json(
        { error: 'No hay datos para actualizar' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('egresos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el egreso' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
