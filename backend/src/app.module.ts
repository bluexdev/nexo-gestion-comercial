import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { InvoicingModule } from './invoicing/invoicing.module';
import { MerchandiseReceiptModule } from './merchandise-receipt/merchandise-receipt.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { UsersModule } from './users/users.module';
import { HealthController } from './health.controller';
import { RolesGuard } from './common/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (environment: Record<string, unknown>) => {
        const required = [
          'DATABASE_URL',
          'JWT_ACCESS_SECRET',
          'JWT_REFRESH_SECRET',
          'CORS_ORIGIN',
        ];
        for (const key of required) {
          if (!environment[key]) {
            throw new Error(`Missing environment variable: ${key}`);
          }
        }
        return environment;
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    SuppliersModule,
    PurchaseOrdersModule,
    MerchandiseReceiptModule,
    CustomersModule,
    InvoicingModule,
    DispatchModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: RolesGuard }],
})
export class AppModule {}
