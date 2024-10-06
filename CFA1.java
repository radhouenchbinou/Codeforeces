public class CFA1 {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        long n = sc.nextLong();
        long m = sc.nextLong();
        long a = sc.nextLong();
        long flagstone = 0;
        if (n % a == 0) {
            flagstone = n / a;
        } else {
            flagstone = n / a + 1;
        }
        if (m % a == 0) {
            flagstone *= m / a;
        } else {
            flagstone *= m / a + 1;
        }
        System.out.println(flagstone);
        sc.close();
    }
}
