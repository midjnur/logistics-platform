import RegisterForm from '@/components/forms/RegisterForm';
import AuthLayout from '@/components/layouts/AuthLayout';

export default function RegisterPage() {
    return (
        <AuthLayout>
            <RegisterForm />
        </AuthLayout>
    );
}
