# UP Catalogo - Deployment Checklist

## ✅ Completed
- [x] Next.js 14 application created
- [x] Supabase backend configured
- [x] GitHub repository created: https://github.com/KeystoneAndrade/upcatalogo
- [x] Deployed to Vercel
- [x] Supabase schema created (6 tables + RLS policies)
- [x] Environment variables configured on Vercel
- [x] Auth routes fixed (moved from route groups)

## 🔄 In Progress - DNS Configuration
- [ ] Domain `centroo.com.br` added to Vercel
- [ ] Environment variable `NEXT_PUBLIC_APP_DOMAIN=centroo.com.br` added to Vercel
- [ ] DNS CNAME propagated (waiting for DNS propagation)

## 📋 Testing Checklist (After DNS Propagates)

### 1. Landing Page
```
URL: https://centroo.com.br
Expected: Hero section, features, CTA buttons
Status: [ ] Pass / [ ] Fail
```

### 2. Signup Flow
```
URL: https://centroo.com.br/auth/signup
Steps:
1. Fill in store name: "loja-teste"
2. Enter email: seu@email.com
3. Set password: (min 6 chars)
4. Add WhatsApp (optional)
5. Click "Criar minha loja"
Expected: Redirect to /dashboard
Status: [ ] Pass / [ ] Fail
```

### 3. Dashboard Access
```
URL: https://centroo.com.br/dashboard
Expected:
- Sidebar with navigation
- Dashboard stats
- Recent orders section
Status: [ ] Pass / [ ] Fail
```

### 4. Product Management
```
Path: Dashboard → Products → New Product
Steps:
1. Click "New Product"
2. Fill: Name, Price, Description
3. Upload image (optional)
4. Click Save
Expected: Product created and listed
Status: [ ] Pass / [ ] Fail
```

### 5. Storefront
```
URL: https://centroo.com.br/produtos
Expected:
- Product grid showing created products
- Product cards with name, price, image
- Add to cart button
Status: [ ] Pass / [ ] Fail
```

### 6. Product Detail & Cart
```
Steps:
1. Click on a product
2. View product details
3. Click "Adicionar ao carrinho"
4. Check cart counter in header
Expected: Cart updated with product
Status: [ ] Pass / [ ] Fail
```

### 7. Checkout Flow
```
URL: https://centroo.com.br/checkout
Steps:
1. Fill customer info (name, phone, email)
2. Select address
3. Choose shipping zone
4. Select payment method
5. Click "Finalizar no WhatsApp"
Expected: Redirect to WhatsApp with order message
Status: [ ] Pass / [ ] Fail
```

### 8. Subdomain Tenant Access
```
URL: https://loja-teste.centroo.com.br
Expected:
- After DNS propagates, should show storefront for "loja-teste" tenant
- Products from that store
Status: [ ] Pass / [ ] Fail
```

## 🚀 Next Steps (After Testing)

1. Create more test stores/tenants
2. Test multi-tenant switching (different subdomains)
3. Configure custom domain support
4. Set up email notifications
5. Configure WhatsApp webhook (if needed)
6. Add payment gateway integration
7. Deploy to production

## 📝 Environment Variables (Vercel)

Required:
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `NEXT_PUBLIC_APP_DOMAIN` ⏳ (pending)

## 🔗 Important Links

- **Repository:** https://github.com/KeystoneAndrade/upcatalogo
- **Vercel:** https://vercel.com/dashboard
- **Supabase:** https://app.supabase.com
- **Domain Registrar:** Check DNS settings

## 📞 Support

For issues or questions:
1. Check Vercel deployment logs
2. Check Supabase SQL errors
3. Check browser console for client-side errors
4. Check Vercel function logs for backend errors
