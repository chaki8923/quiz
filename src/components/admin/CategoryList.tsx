"use client";

import { Category } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { EditCategoryModal } from "./EditCategoryModal";
import { DeleteCategoryButton } from "./DeleteCategoryButton";
import { BookOpen, ChevronRight, Hash } from "lucide-react";

interface CategoryWithCount extends Category {
  quizCount: number;
}

interface CategoryListProps {
  categories: CategoryWithCount[];
}

export function CategoryList({ categories }: CategoryListProps) {
  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <Card key={category.id} className="hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-100">
              <BookOpen size={20} className="text-brand-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {category.name}
                </h3>
                <Badge variant={category.quizCount > 0 ? "info" : "default"}>
                  <Hash size={10} className="mr-0.5" />
                  {category.quizCount} 問
                </Badge>
              </div>
              {category.description && (
                <p className="mt-0.5 text-sm text-gray-500 truncate">
                  {category.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <EditCategoryModal category={category} />
              <DeleteCategoryButton
                categoryId={category.id}
                categoryName={category.name}
              />
              <Link href={`/admin/categories/${category.id}`}>
                <Button size="sm" variant="secondary">
                  クイズ管理
                  <ChevronRight size={14} />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
