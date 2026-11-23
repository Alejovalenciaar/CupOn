import unittest
from modelo_simplex_cupon import calcular_modelo_simplex


class TestModeloSimplexCupon(unittest.TestCase):
    def test_caso_base_documento(self):
        res = calcular_modelo_simplex(
            P=40_000,
            C=20_000,
            p1=0.10,
            p2=0.25,
            K=120,
            D1=70,
            B=680_000,
        )
        self.assertEqual(res["xOpt"], 70.0)
        self.assertEqual(res["yOpt"], 40.0)
        self.assertEqual(res["totalCoupons"], 110.0)
        self.assertEqual(res["maxProfit"], 1_520_000.0)
        self.assertEqual(res["u1"], 16_000.0)
        self.assertEqual(res["u2"], 10_000.0)
        self.assertEqual(res["d1"], 4_000.0)
        self.assertEqual(res["d2"], 10_000.0)
        self.assertEqual(res["s1UnusedCapacity"], 10.0)
        self.assertEqual(res["s2UnmetDemandStage1"], 0.0)
        self.assertEqual(res["s3RemainingBudget"], 0.0)
        self.assertGreaterEqual(len(res["vertices"]), 4)

    def test_validacion_descuento_no_rentable(self):
        with self.assertRaises(ValueError):
            # Si P=40000 y C=30000, un descuento p2=0.30 da utilidad negativa (40000*0.7 - 30000 = -2000)
            calcular_modelo_simplex(
                P=40_000,
                C=30_000,
                p1=0.10,
                p2=0.30,
                K=100,
                D1=50,
                B=500_000,
            )


if __name__ == "__main__":
    unittest.main()
